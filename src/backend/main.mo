import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";
import Storage "blob-storage/Storage";
import MixinStorage "blob-storage/Mixin";
import Stripe "stripe/stripe";
import OutCall "http-outcalls/outcall";
import Map "mo:core/Map";
import Text "mo:core/Text";
import Time "mo:core/Time";
import Order "mo:core/Order";
import Iter "mo:core/Iter";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";
import Migration "migration";

(with migration = Migration.run)
actor {
  // Initialize the access control system
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);
  include MixinStorage();

  // Data Structures

  public type JobStatus = {
    #pending_payment;
    #pending;
    #assigned;
    #in_progress;
    #completed;
  };

  module JobStatus {
    public func compare(status1 : JobStatus, status2 : JobStatus) : Order.Order {
      func statusOrder(status : JobStatus) : Nat {
        switch (status) {
          case (#pending_payment) { 0 };
          case (#pending) { 1 };
          case (#assigned) { 2 };
          case (#in_progress) { 3 };
          case (#completed) { 4 };
        };
      };
      Nat.compare(statusOrder(status1), statusOrder(status2));
    };
  };

  public type AppUserRole = {
    #client;
    #editor;
  };

  public type UserProfile = {
    name : Text;
    appRole : AppUserRole;
  };

  public type Job = {
    jobId : Text;
    clientId : Principal;
    assignedEditorId : ?Principal;
    status : JobStatus;
    sourceVideo : Storage.ExternalBlob;
    referenceVideo : Storage.ExternalBlob;
    finalVideo : ?Storage.ExternalBlob;
    notes : Text;
    price : Nat;
    createdAt : Time.Time;
    completedAt : ?Time.Time;
    stripeSessionId : ?Text;
  };

  public type JobInput = {
    sourceVideo : Storage.ExternalBlob;
    referenceVideo : Storage.ExternalBlob;
    notes : Text;
    price : Nat;
  };

  public type SubmitFinalVideoInput = {
    jobId : Text;
    finalVideo : Storage.ExternalBlob;
  };

  public type RevenueSummary = {
    totalRevenue : Nat;
    paidJobsCount : Nat;
    completedJobsCount : Nat;
  };

  // Storage
  let jobs = Map.empty<Text, Job>();
  let userProfiles = Map.empty<Principal, UserProfile>();

  var nextJobId = 0;

  // Stripe Configuration
  var stripeConfig : ?Stripe.StripeConfiguration = null;

  // Admin Passkey
  var adminPasskey : ?Text = null;

  // Helper Functions

  func generateJobId() : Text {
    let id = "job-" # Nat.toText(nextJobId);
    nextJobId += 1;
    id;
  };

  func ensureClient(caller : Principal) {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only authenticated users can perform this action");
    };
    
    switch (userProfiles.get(caller)) {
      case (?profile) {
        if (profile.appRole != #client) {
          Runtime.trap("Unauthorized: Only clients can perform this action");
        };
      };
      case (null) {
        Runtime.trap("Unauthorized: Only clients can perform this action");
      };
    };
  };

  func ensureEditor(caller : Principal) {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only authenticated users can perform this action");
    };
    
    switch (userProfiles.get(caller)) {
      case (?profile) {
        if (profile.appRole != #editor) {
          Runtime.trap("Unauthorized: Only editors can perform this action");
        };
      };
      case (null) {
        Runtime.trap("Unauthorized: Only editors can perform this action");
      };
    };
  };

  func checkJobAccess(job : Job, caller : Principal) : Bool {
    if (job.clientId == caller) {
      return true;
    };

    switch (job.assignedEditorId) {
      case (?editor) {
        if (editor == caller) {
          return true;
        };
      };
      case (null) {};
    };

    if (AccessControl.isAdmin(accessControlState, caller)) {
      return true;
    };
    false;
  };

  // User Profile Functions

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can access profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can access profiles");
    };
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // Job Queries

  public query ({ caller }) func getJob(jobId : Text) : async Job {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only authenticated users can access jobs");
    };
    
    switch (jobs.get(jobId)) {
      case (?job) {
        if (not checkJobAccess(job, caller)) {
          Runtime.trap("Unauthorized: Cannot access this job");
        };
        job;
      };
      case (null) { Runtime.trap("Job not found") };
    };
  };

  public query ({ caller }) func getAllJobs() : async [Job] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only authenticated users can access jobs");
    };

    // Admins can see all jobs
    if (AccessControl.isAdmin(accessControlState, caller)) {
      return jobs.values().toArray();
    };

    // Filter jobs based on user role
    let filteredJobs = jobs.values().filter(func(job : Job) : Bool {
      // Client can see their own jobs
      if (job.clientId == caller) {
        return true;
      };

      // Editor can see jobs assigned to them
      switch (job.assignedEditorId) {
        case (?editor) {
          if (editor == caller) {
            return true;
          };
        };
        case (null) {};
      };

      false;
    });

    filteredJobs.toArray();
  };

  // Job Management

  public shared ({ caller }) func submitJob(input : JobInput) : async Text {
    ensureClient(caller);
    let jobId = generateJobId();
    let job : Job = {
      jobId;
      clientId = caller;
      assignedEditorId = null;
      status = #pending_payment;
      sourceVideo = input.sourceVideo;
      referenceVideo = input.referenceVideo;
      finalVideo = null;
      notes = input.notes;
      price = input.price;
      createdAt = Time.now();
      completedAt = null;
      stripeSessionId = null;
    };

    jobs.add(jobId, job);
    jobId;
  };

  public shared ({ caller }) func confirmPayment(jobId : Text, stripeSessionId : Text) : async () {
    ensureClient(caller);
    switch (jobs.get(jobId)) {
      case (?job) {
        if (job.clientId != caller) {
          Runtime.trap("Unauthorized: Not the job owner");
        };
        if (job.status != #pending_payment) {
          Runtime.trap("Job is not in pending_payment status");
        };
        let updatedJob : Job = {
          job with
          status = #pending;
          stripeSessionId = ?stripeSessionId;
        };
        jobs.add(jobId, updatedJob);
      };
      case (null) { Runtime.trap("Job not found") };
    };
  };

  public shared ({ caller }) func assignJob(jobId : Text, editorId : Principal) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Only admin can assign jobs");
    };
    switch (jobs.get(jobId)) {
      case (?job) {
        let updatedJob : Job = {
          job with
          assignedEditorId = ?editorId;
          status = #assigned;
        };
        jobs.add(jobId, updatedJob);
      };
      case (null) { Runtime.trap("Job not found") };
    };
  };

  public shared ({ caller }) func submitFinalVideo(input : SubmitFinalVideoInput) : async () {
    ensureEditor(caller);

    switch (jobs.get(input.jobId)) {
      case (?job) {
        switch (job.assignedEditorId) {
          case (?editor) {
            if (editor != caller) {
              Runtime.trap("Unauthorized: Not assigned to this job");
            };
          };
          case (null) { Runtime.trap("Job is not assigned to any editor") };
        };

        let updatedJob : Job = {
          job with
          finalVideo = ?input.finalVideo;
          status = #completed;
          completedAt = ?Time.now();
        };
        jobs.add(input.jobId, updatedJob);
      };
      case (null) { Runtime.trap("Job not found") };
    };
  };

  public shared ({ caller }) func adminSubmitFinalVideo(jobId : Text, finalVideo : Storage.ExternalBlob) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Only admin can submit final video");
    };

    switch (jobs.get(jobId)) {
      case (?job) {
        let updatedJob : Job = {
          job with
          finalVideo = ?finalVideo;
          status = #completed;
          completedAt = ?Time.now();
        };
        jobs.add(jobId, updatedJob);
      };
      case (null) { Runtime.trap("Job not found") };
    };
  };

  public query ({ caller }) func getRevenueSummary() : async RevenueSummary {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Only admin can access revenue summary");
    };

    var totalRevenue = 0;
    var paidJobsCount = 0;
    var completedJobsCount = 0;

    for ((_, job) in jobs.entries()) {
      if (job.status != #pending_payment) {
        totalRevenue += job.price;
        paidJobsCount += 1;

        if (job.status == #completed) {
          completedJobsCount += 1;
        };
      };
    };

    {
      totalRevenue;
      paidJobsCount;
      completedJobsCount;
    };
  };

  // Admin Passkey Functions

  public shared ({ caller }) func setAdminPasskey(passkey : Text) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Only admin can set passkey");
    };
    adminPasskey := ?passkey;
  };

  public query func verifyAdminPasskey(passkey : Text) : async Bool {
    // Public query - no authorization check needed, but this is a security risk
    // Anyone can attempt to verify the passkey
    switch (adminPasskey) {
      case (?storedPasskey) { storedPasskey == passkey };
      case (null) { false };
    };
  };

  // Stripe Functions

  public query func isStripeConfigured() : async Bool {
    // Public query - anyone can check if Stripe is configured
    stripeConfig != null;
  };

  public shared ({ caller }) func setStripeConfiguration(config : Stripe.StripeConfiguration) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Only admin can set Stripe configuration");
    };
    stripeConfig := ?config;
  };

  func getStripeConfiguration() : Stripe.StripeConfiguration {
    switch (stripeConfig) {
      case (null) { Runtime.trap("Stripe configuration not set") };
      case (?config) { config };
    };
  };

  public shared ({ caller }) func getStripeSessionStatus(sessionId : Text) : async Stripe.StripeSessionStatus {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only authenticated users can check session status");
    };
    await Stripe.getSessionStatus(getStripeConfiguration(), sessionId, transform);
  };

  public shared ({ caller }) func createCheckoutSession(items : [Stripe.ShoppingItem], successUrl : Text, cancelUrl : Text) : async Text {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can create checkout sessions");
    };
    await Stripe.createCheckoutSession(getStripeConfiguration(), caller, items, successUrl, cancelUrl, transform);
  };

  public query func transform(input : OutCall.TransformationInput) : async OutCall.TransformationOutput {
    OutCall.transform(input);
  };
};

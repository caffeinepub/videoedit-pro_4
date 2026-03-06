import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";
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



actor {
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);
  include MixinStorage();

  public type VideoType = {
    #small;
    #medium;
    #long;
    #photo_to_video;
  };

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
    clientId : Principal.Principal;
    assignedEditorId : ?Principal.Principal;
    status : JobStatus;
    videoType : VideoType;
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
    videoType : VideoType;
    sourceVideo : Storage.ExternalBlob;
    referenceVideo : Storage.ExternalBlob;
    notes : Text;
  };

  public type RevenueSummary = {
    totalRevenue : Nat;
    paidJobsCount : Nat;
    completedJobsCount : Nat;
  };

  let jobs = Map.empty<Text, Job>();
  let userProfiles = Map.empty<Principal.Principal, UserProfile>();
  var nextJobId = 0;
  var stripeConfig : ?Stripe.StripeConfiguration = null;
  var adminPasskey : ?Text = null;

  func generateJobId() : Text {
    let id = "job-" # Nat.toText(nextJobId);
    nextJobId += 1;
    id;
  };

  func getVideoPrice(videoType : VideoType) : Nat {
    switch (videoType) {
      case (#small) { 10000 };
      case (#medium) { 50000 };
      case (#long) { 200000 };
      case (#photo_to_video) { 5000 };
    };
  };

  func ensureClient(caller : Principal.Principal) {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only clients can perform this action");
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

  func ensureEditor(caller : Principal.Principal) {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only editors can perform this action");
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

  func checkJobAccess(job : Job, caller : Principal.Principal) : Bool {
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

  func findJobBySessionId(sessionId : Text) : ?Job {
    for ((_, job) in jobs.entries()) {
      switch (job.stripeSessionId) {
        case (?sid) {
          if (sid == sessionId) {
            return ?job;
          };
        };
        case (null) {};
      };
    };
    null;
  };

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can access profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal.Principal) : async ?UserProfile {
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

  public shared ({ caller }) func submitJob(input : JobInput) : async Text {
    ensureClient(caller);

    let price = getVideoPrice(input.videoType);
    let jobId = generateJobId();

    let job : Job = {
      jobId;
      clientId = caller;
      assignedEditorId = null;
      status = #pending_payment;
      videoType = input.videoType;
      sourceVideo = input.sourceVideo;
      referenceVideo = input.referenceVideo;
      finalVideo = null;
      notes = input.notes;
      price;
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

  public shared ({ caller }) func assignJob(jobId : Text, editorId : Principal.Principal) : async () {
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

  public shared ({ caller }) func submitFinalVideo(jobId : Text, finalVideo : Storage.ExternalBlob) : async () {
    ensureEditor(caller);

    switch (jobs.get(jobId)) {
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
          finalVideo = ?finalVideo;
          status = #completed;
          completedAt = ?Time.now();
        };
        jobs.add(jobId, updatedJob);
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

  public shared ({ caller }) func setAdminPasskey(passkey : Text) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Only admin can set passkey");
    };
    adminPasskey := ?passkey;
  };

  public query ({ caller }) func verifyAdminPasskey(passkey : Text) : async Bool {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only authenticated users can verify admin passkey");
    };
    switch (adminPasskey) {
      case (?storedPasskey) { storedPasskey == passkey };
      case (null) { false };
    };
  };

  public query ({ caller }) func isStripeConfigured() : async Bool {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only authenticated users can check Stripe configuration");
    };
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

    // First find the job, then verify ownership - prevents session ID enumeration
    switch (findJobBySessionId(sessionId)) {
      case (?job) {
        // Only the job owner (client) or admin can check the session status
        if (job.clientId != caller and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Cannot check session status for other users' jobs");
        };
      };
      case (null) {
        Runtime.trap("No job found with this session ID");
      };
    };

    await Stripe.getSessionStatus(getStripeConfiguration(), sessionId, transform);
  };

  public shared ({ caller }) func createCheckoutSession(items : [Stripe.ShoppingItem], successUrl : Text, cancelUrl : Text) : async Text {
    ensureClient(caller);
    await Stripe.createCheckoutSession(getStripeConfiguration(), caller, items, successUrl, cancelUrl, transform);
  };

  public query func transform(input : OutCall.TransformationInput) : async OutCall.TransformationOutput {
    OutCall.transform(input);
  };
};

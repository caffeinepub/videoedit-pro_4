import Map "mo:core/Map";
import Time "mo:core/Time";
import Text "mo:core/Text";
import Storage "blob-storage/Storage";
import Stripe "stripe/stripe";
import AccessControl "authorization/access-control";
import Principal "mo:core/Principal";

module {
  type OldVideoType = {
    #small;
    #long;
  };

  type OldJobStatus = {
    #pending_payment;
    #pending;
    #assigned;
    #in_progress;
    #completed;
  };

  type OldAppUserRole = {
    #client;
    #editor;
  };

  type OldUserProfile = {
    name : Text;
    appRole : OldAppUserRole;
  };

  type OldJob = {
    jobId : Text;
    clientId : Principal.Principal;
    assignedEditorId : ?Principal.Principal;
    status : OldJobStatus;
    videoType : OldVideoType;
    sourceVideo : Storage.ExternalBlob;
    referenceVideo : Storage.ExternalBlob;
    finalVideo : ?Storage.ExternalBlob;
    notes : Text;
    price : Nat;
    createdAt : Time.Time;
    completedAt : ?Time.Time;
    stripeSessionId : ?Text;
  };

  type OldActor = {
    accessControlState : AccessControl.AccessControlState;
    jobs : Map.Map<Text, OldJob>;
    userProfiles : Map.Map<Principal.Principal, OldUserProfile>;
    nextJobId : Nat;
    stripeConfig : ?Stripe.StripeConfiguration;
    adminPasskey : ?Text;
  };

  type NewActor = {
    accessControlState : AccessControl.AccessControlState;
    jobs : Map.Map<Text, NewJob>;
    userProfiles : Map.Map<Principal.Principal, OldUserProfile>;
    nextJobId : Nat;
    stripeConfig : ?Stripe.StripeConfiguration;
    adminPasskey : ?Text;
  };

  type NewVideoType = {
    #small;
    #medium;
    #long;
  };

  type NewJob = {
    jobId : Text;
    clientId : Principal.Principal;
    assignedEditorId : ?Principal.Principal;
    status : OldJobStatus;
    videoType : NewVideoType;
    sourceVideo : Storage.ExternalBlob;
    referenceVideo : Storage.ExternalBlob;
    finalVideo : ?Storage.ExternalBlob;
    notes : Text;
    price : Nat;
    createdAt : Time.Time;
    completedAt : ?Time.Time;
    stripeSessionId : ?Text;
  };

  public func run(old : OldActor) : NewActor {
    let newJobs = old.jobs.map<Text, OldJob, NewJob>(
      func(_jobId, oldJob) {
        let newVideoType = switch (oldJob.videoType) {
          case (#small) { #small };
          case (#long) { #long };
        };
        {
          oldJob with
          videoType = newVideoType;
        };
      }
    );

    { old with jobs = newJobs };
  };
};

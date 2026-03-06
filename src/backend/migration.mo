import Map "mo:core/Map";
import Text "mo:core/Text";
import AccessControl "authorization/access-control";
import Storage "blob-storage/Storage";
import Stripe "stripe/stripe";
import Time "mo:core/Time";
import Principal "mo:core/Principal";

module {
  type Status = {
    #pending_payment;
    #pending;
    #assigned;
    #in_progress;
    #completed;
  };

  type Role = {
    #client;
    #editor;
  };

  type OldVideoType = { #small; #medium; #long };
  type NewVideoType = { #small; #medium; #long; #photo_to_video };

  type OldJob = {
    jobId : Text;
    clientId : Principal.Principal;
    assignedEditorId : ?Principal.Principal;
    status : Status;
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

  type NewJob = {
    jobId : Text;
    clientId : Principal.Principal;
    assignedEditorId : ?Principal.Principal;
    status : Status;
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

  type OldActor = {
    jobs : Map.Map<Text, OldJob>;
    userProfiles : Map.Map<Principal.Principal, { name : Text; appRole : Role }>;
    nextJobId : Nat;
    stripeConfig : ?Stripe.StripeConfiguration;
    adminPasskey : ?Text;
    accessControlState : AccessControl.AccessControlState;
  };

  type NewActor = {
    jobs : Map.Map<Text, NewJob>;
    userProfiles : Map.Map<Principal.Principal, { name : Text; appRole : Role }>;
    nextJobId : Nat;
    stripeConfig : ?Stripe.StripeConfiguration;
    adminPasskey : ?Text;
    accessControlState : AccessControl.AccessControlState;
  };

  public func run(old : OldActor) : NewActor {
    let jobs = old.jobs.map<Text, OldJob, NewJob>(
      func(_id, oldJob) {
        { oldJob with videoType = #small };
      }
    );
    {
      old with
      jobs
    };
  };
};

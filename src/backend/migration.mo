import Map "mo:core/Map";
import Text "mo:core/Text";
import Principal "mo:core/Principal";
import Storage "blob-storage/Storage";
import Stripe "stripe/stripe";
import Time "mo:core/Time";

module {
  public type JobStatus = {
    #pending_payment;
    #pending;
    #assigned;
    #in_progress;
    #completed;
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

  public type OldActor = {
    jobs : Map.Map<Text, Job>;
    userProfiles : Map.Map<Principal, UserProfile>;
    nextJobId : Nat;
    stripeConfig : ?Stripe.StripeConfiguration;
  };

  public type NewActor = {
    jobs : Map.Map<Text, Job>;
    userProfiles : Map.Map<Principal, UserProfile>;
    nextJobId : Nat;
    stripeConfig : ?Stripe.StripeConfiguration;
    adminPasskey : ?Text;
  };

  // Migration function called by the main actor via the with-clause
  public func run(old : OldActor) : NewActor {
    {
      old with
      adminPasskey = null
    };
  };
};

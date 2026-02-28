import Map "mo:core/Map";
import Set "mo:core/Set";
import List "mo:core/List";
import Principal "mo:core/Principal";

module {
  type UserProfile = {
    username : Text;
    avatar : ?Blob;
    deletionTimestamp : ?Int;
  };

  type VideoPost = {
    id : Nat;
    creator : Principal;
    username : Text;
    title : Text;
    timestamp : Int;
    video : Blob;
    likes : Nat;
    shares : Nat;
  };

  type VideoReply = {
    id : Nat;
    parentVideoId : Nat;
    creator : Principal;
    username : Text;
    timestamp : Int;
    video : Blob;
    shares : Nat;
  };

  type Notification = {
    sender : Principal;
    recipient : Principal;
    notificationType : {
      #like : { videoId : Nat };
      #share : { videoId : Nat };
      #reply : { videoId : Nat };
    };
    timestamp : Int;
    isRead : Bool;
  };

  type OldActor = {
    videoPosts : Map.Map<Nat, VideoPost>;
    videoReplies : Map.Map<Nat, VideoReply>;
    replyLikes : Map.Map<Nat, Set.Set<Principal>>;
    followingData : Map.Map<Principal, Set.Set<Principal>>;
    followersData : Map.Map<Principal, Set.Set<Principal>>;
    receivedNotifications : Map.Map<Principal, List.List<Notification>>;
    userProfiles : Map.Map<Principal, UserProfile>;
    usernameToPrincipal : Map.Map<Text, Principal>;
    nextVideoPostId : Nat;
    nextVideoReplyId : Nat;
  };

  type NewActor = {
    videoPosts : Map.Map<Nat, VideoPost>;
    videoReplies : Map.Map<Nat, VideoReply>;
    replyLikes : Map.Map<Nat, Set.Set<Principal>>;
    followingData : Map.Map<Principal, Set.Set<Principal>>;
    followersData : Map.Map<Principal, Set.Set<Principal>>;
    receivedNotifications : Map.Map<Principal, List.List<Notification>>;
    userProfiles : Map.Map<Principal, UserProfile>;
    usernameToPrincipal : Map.Map<Text, Principal>;
    nextVideoPostId : Nat;
    nextVideoReplyId : Nat;
    dailyVisitors : Map.Map<Int, Set.Set<Principal>>;
    weeklyVisitors : Map.Map<{ week : Int; day : Int }, Set.Set<Principal>>;
    monthlyVisitors : Map.Map<Nat, Set.Set<Principal>>;
    allTimeVisitors : Set.Set<Principal>;
  };

  public func run(old : OldActor) : NewActor {
    {
      old with
      dailyVisitors = Map.empty<Int, Set.Set<Principal>>();
      weeklyVisitors = Map.empty<{ week : Int; day : Int }, Set.Set<Principal>>();
      monthlyVisitors = Map.empty<Nat, Set.Set<Principal>>();
      allTimeVisitors = Set.empty<Principal>();
    };
  };
};

import Map "mo:core/Map";
import Set "mo:core/Set";
import List "mo:core/List";
import Text "mo:core/Text";
import Time "mo:core/Time";
import Nat "mo:core/Nat";
import Int "mo:core/Int";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";

import MixinAuthorization "authorization/MixinAuthorization";
import MixinStorage "blob-storage/Mixin";
import Storage "blob-storage/Storage";
import AccessControl "authorization/access-control";


actor {
  type VisitorStats = {
    daily : Nat;
    weekly : Nat;
    monthly : Nat;
    allTime : Nat;
  };

  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);
  include MixinStorage();

  let videoPosts = Map.empty<Nat, VideoPost>();
  let videoReplies = Map.empty<Nat, VideoReply>();
  let replyLikes = Map.empty<Nat, Set.Set<Principal>>();
  let followingData = Map.empty<Principal, Set.Set<Principal>>();
  let followersData = Map.empty<Principal, Set.Set<Principal>>();
  let receivedNotifications = Map.empty<Principal, List.List<Notification>>();
  let userProfiles = Map.empty<Principal, UserProfile>();
  let usernameToPrincipal = Map.empty<Text, Principal>();

  var nextVideoPostId = 0;
  var nextVideoReplyId = 0;

  let dailyVisitors = Map.empty<Int, Set.Set<Principal>>();
  let weeklyVisitors = Map.empty<WeeklyKey, Set.Set<Principal>>();
  let monthlyVisitors = Map.empty<Nat, Set.Set<Principal>>();
  let allTimeVisitors = Set.empty<Principal>();

  type WeeklyKey = {
    week : Int;
    day : Int;
  };

  module WeeklyKey {
    public func compare(a : WeeklyKey, b : WeeklyKey) : { #less; #equal; #greater } {
      switch (Int.compare(a.week, b.week)) {
        case (#equal) { Int.compare(a.day, b.day) };
        case (notEqual) { notEqual };
      };
    };
  };

  public type UserProfile = {
    username : Text;
    avatar : ?Blob;
    deletionTimestamp : ?Time.Time;
  };

  type VideoPost = {
    id : Nat;
    creator : Principal;
    username : Text;
    title : Text;
    timestamp : Time.Time;
    video : Storage.ExternalBlob;
    likes : Nat;
    shares : Nat;
  };

  type VideoReply = {
    id : Nat;
    parentVideoId : Nat;
    creator : Principal;
    username : Text;
    timestamp : Time.Time;
    video : Storage.ExternalBlob;
    shares : Nat;
  };

  type Notification = {
    sender : Principal;
    recipient : Principal;
    notificationType : NotificationType;
    timestamp : Time.Time;
    isRead : Bool;
  };

  type NotificationType = {
    #like : { videoId : Nat };
    #share : { videoId : Nat };
    #reply : { videoId : Nat };
  };

  module NotificationModule {
    public func compareByTimestamp(a : Notification, b : Notification) : { #less; #equal; #greater } {
      let bTime = Int.fromNat(Int.abs(b.timestamp));
      let aTime = Int.fromNat(Int.abs(a.timestamp));
      Int.compare(bTime, aTime);
    };
  };

  module ReplyModule {
    public func compareByTimestampDesc(a : VideoReply, b : VideoReply) : { #less; #equal; #greater } {
      Int.compare(b.timestamp, a.timestamp);
    };
  };

  func isPermanentAdmin(user : Principal) : Bool {
    user.toText() == "a7dxs-nk6zm-shch4-6mlx5-xd7vi-bqjwf-euhqd-d47mb-mtbhj-4o34v-2qe";
  };

  func callerIsAdmin(caller : Principal) : Bool {
    if (isPermanentAdmin(caller)) { return true };
    AccessControl.isAdmin(accessControlState, caller);
  };

  func callerHasAdminPermission(caller : Principal) : Bool {
    if (isPermanentAdmin(caller)) { return true };
    AccessControl.hasPermission(accessControlState, caller, #admin);
  };

  public shared ({ caller }) func promoteUser(newAdmin : Principal) : async () {
    if (not callerIsAdmin(caller)) {
      Runtime.trap("Unauthorized: Only admins can promote users");
    };
    AccessControl.assignRole(accessControlState, caller, newAdmin, #admin);
  };

  public shared ({ caller }) func demoteUser(adminToRemove : Principal) : async () {
    if (not callerIsAdmin(caller)) {
      Runtime.trap("Unauthorized: Only admins can demote users");
    };
    AccessControl.assignRole(accessControlState, caller, adminToRemove, #user);
  };

  public query ({ caller }) func isAdmin(user : Principal) : async Bool {
    if (isPermanentAdmin(user)) { return true };
    AccessControl.isAdmin(accessControlState, user);
  };

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can get profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };

    switch (usernameToPrincipal.get(profile.username)) {
      case (?existingPrincipal) {
        if (existingPrincipal != caller) {
          Runtime.trap("Username already taken");
        };
      };
      case (null) {};
    };

    switch (userProfiles.get(caller)) {
      case (?oldProfile) {
        usernameToPrincipal.remove(oldProfile.username);
      };
      case (null) {};
    };

    addUsernameMapping(profile.username, caller);
    userProfiles.add(caller, profile);
  };

  func addUsernameMapping(username : Text, user : Principal) : () {
    usernameToPrincipal.add(username, user);
    let lowercaseUsername = username.toLower();
    usernameToPrincipal.add(lowercaseUsername, user);
  };

  public query ({ caller }) func checkUsernameAvailability(username : Text) : async Bool {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can check username availability");
    };

    switch (usernameToPrincipal.get(username)) {
      case (null) { true };
      case (?principal) { principal == caller };
    };
  };

  public query ({ caller }) func getPrincipalByUsername(username : Text) : async ?Principal {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can lookup usernames");
    };
    usernameToPrincipal.get(username);
  };

  public shared ({ caller }) func createVideoPost(_title : Text, video : Storage.ExternalBlob) : async Nat {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can create video posts");
    };

    let username = switch (userProfiles.get(caller)) {
      case (null) { Runtime.trap("User must set username before posting") };
      case (?profile) { profile.username };
    };

    let newPost : VideoPost = {
      id = nextVideoPostId;
      creator = caller;
      username;
      title = _title;
      timestamp = Time.now();
      video;
      likes = 0;
      shares = 0;
    };

    videoPosts.add(nextVideoPostId, newPost);
    let postId = nextVideoPostId;
    nextVideoPostId += 1;
    postId;
  };

  public shared ({ caller }) func createVideoReply(parentVideoId : Nat, video : Storage.ExternalBlob) : async Nat {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can post replies");
    };

    switch (videoPosts.get(parentVideoId)) {
      case (null) { Runtime.trap("Parent video post not found") };
      case (?parentPost) {
        let username = switch (userProfiles.get(caller)) {
          case (null) { Runtime.trap("User must set username before posting") };
          case (?profile) { profile.username };
        };

        let newReply : VideoReply = {
          id = nextVideoReplyId;
          parentVideoId;
          creator = caller;
          username;
          timestamp = Time.now();
          video;
          shares = 0;
        };

        videoReplies.add(nextVideoReplyId, newReply);
        let replyId = nextVideoReplyId;
        nextVideoReplyId += 1;

        if (parentPost.creator != caller) {
          let notification : Notification = {
            sender = caller;
            recipient = parentPost.creator;
            notificationType = #reply { videoId = parentVideoId };
            timestamp = Time.now();
            isRead = false;
          };
          addReceivedNotification(parentPost.creator, notification);
        };

        replyId;
      };
    };
  };

  public shared ({ caller }) func deleteVideoPost(postId : Nat) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can delete posts");
    };

    switch (videoPosts.get(postId)) {
      case (null) { Runtime.trap("Video post not found") };
      case (?post) {
        if (post.creator != caller and not callerIsAdmin(caller)) {
          Runtime.trap("Unauthorized: Can only delete your own posts or be an admin");
        };

        for ((replyId, reply) in videoReplies.entries()) {
          if (reply.parentVideoId == postId) {
            videoReplies.remove(replyId);
          };
        };

        videoPosts.remove(postId);
      };
    };
  };

  public shared ({ caller }) func deleteVideoReply(replyId : Nat) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can delete replies");
    };

    switch (videoReplies.get(replyId)) {
      case (null) { Runtime.trap("Video reply not found") };
      case (?reply) {
        if (reply.creator != caller and not callerIsAdmin(caller)) {
          Runtime.trap("Unauthorized: Can only delete your own replies or be an admin");
        };

        videoReplies.remove(replyId);
        replyLikes.remove(replyId);
      };
    };
  };

  public shared ({ caller }) func likePost(postId : Nat) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can like posts");
    };

    switch (videoPosts.get(postId)) {
      case (null) { Runtime.trap("Video post not found") };
      case (?post) {
        videoPosts.add(
          postId,
          {
            post with
            likes = post.likes + 1;
          },
        );

        if (post.creator != caller) {
          let notification : Notification = {
            sender = caller;
            recipient = post.creator;
            notificationType = #like { videoId = postId };
            timestamp = Time.now();
            isRead = false;
          };
          addReceivedNotification(post.creator, notification);
        };
      };
    };
  };

  public shared ({ caller }) func sharePost(postId : Nat) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can share posts");
    };

    switch (videoPosts.get(postId)) {
      case (null) { Runtime.trap("Video post not found") };
      case (?post) {
        videoPosts.add(
          postId,
          {
            post with
            shares = post.shares + 1;
          },
        );

        if (post.creator != caller) {
          let notification : Notification = {
            sender = caller;
            recipient = post.creator;
            notificationType = #share { videoId = postId };
            timestamp = Time.now();
            isRead = false;
          };
          addReceivedNotification(post.creator, notification);
        };
      };
    };
  };

  public shared ({ caller }) func likeReply(replyId : Nat) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can like replies");
    };

    switch (videoReplies.get(replyId)) {
      case (null) {
        Runtime.trap("Reply not found");
      };
      case (?_) {
        let currentSet = switch (replyLikes.get(replyId)) {
          case (null) { Set.empty<Principal>() };
          case (?set) { set };
        };
        currentSet.add(caller);
        replyLikes.add(replyId, currentSet);
      };
    };
  };

  public shared ({ caller }) func unlikeReply(replyId : Nat) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can unlike replies");
    };

    switch (videoReplies.get(replyId)) {
      case (null) {
        Runtime.trap("Reply not found");
      };
      case (?_) {
        let currentSet = switch (replyLikes.get(replyId)) {
          case (null) { Set.empty<Principal>() };
          case (?set) { set };
        };
        currentSet.remove(caller);
        replyLikes.add(replyId, currentSet);
      };
    };
  };

  public shared ({ caller }) func shareReply(replyId : Nat) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can share replies");
    };

    switch (videoReplies.get(replyId)) {
      case (null) { Runtime.trap("Reply not found") };
      case (?reply) {
        let updatedReply = {
          reply with
          shares = reply.shares + 1;
        };
        videoReplies.add(replyId, updatedReply);
      };
    };
  };

  public shared ({ caller }) func followUser(target : Principal) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can follow others");
    };

    if (caller == target) {
      Runtime.trap("Cannot follow yourself");
    };

    switch (userProfiles.get(target)) {
      case (null) { Runtime.trap("Target user not found") };
      case (?_) {};
    };

    let followingSet = switch (followingData.get(caller)) {
      case (null) { Set.empty<Principal>() };
      case (?set) { set };
    };
    followingSet.add(target);
    followingData.add(caller, followingSet);

    let followersSet = switch (followersData.get(target)) {
      case (null) { Set.empty<Principal>() };
      case (?set) { set };
    };
    followersSet.add(caller);
    followersData.add(target, followersSet);
  };

  public shared ({ caller }) func unfollowUser(target : Principal) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can unfollow others");
    };

    if (caller == target) {
      Runtime.trap("Cannot unfollow yourself");
    };

    switch (followingData.get(caller)) {
      case (null) {};
      case (?followingSet) {
        followingSet.remove(target);
        followingData.add(caller, followingSet);
      };
    };

    switch (followersData.get(target)) {
      case (null) {};
      case (?followersSet) {
        followersSet.remove(caller);
        followersData.add(target, followersSet);
      };
    };
  };

  public query ({ caller }) func isFollowing(target : Principal) : async Bool {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can check follow status");
    };

    switch (followingData.get(caller)) {
      case (null) { false };
      case (?followingSet) { followingSet.contains(target) };
    };
  };

  func addReceivedNotification(_user : Principal, notification : Notification) : () {
    let existingNotifications = switch (receivedNotifications.get(_user)) {
      case (null) { List.empty<Notification>() };
      case (?notifications) { notifications };
    };
    existingNotifications.add(notification);
    receivedNotifications.add(_user, existingNotifications);
  };

  public shared ({ caller }) func markNotificationsAsRead() : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can mark notifications as read");
    };

    switch (receivedNotifications.get(caller)) {
      case (null) {};
      case (?notifications) {
        let updatedNotifications = notifications.map<Notification, Notification>(func(n) { {
          n with
          isRead = true;
        } });
        receivedNotifications.add(caller, updatedNotifications);
      };
    };
  };

  public query ({ caller }) func getAllVideoPosts() : async [VideoPost] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can view videos");
    };
    videoPosts.values().toArray();
  };

  public query ({ caller }) func getVideoPostsByUser(user : Principal) : async [VideoPost] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can view videos");
    };
    videoPosts.values().toArray().filter(func(post) { post.creator == user });
  };

  public query ({ caller }) func getVideoRepliesByUser(user : Principal) : async [VideoReply] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can view replies");
    };
    videoReplies.values().toArray().filter(func(reply) { reply.creator == user });
  };

  public query ({ caller }) func getRepliesForPost(_videoId : Nat) : async [VideoReply] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can view videos");
    };
    videoReplies.values().toArray().filter(func(r) { r.parentVideoId == _videoId });
  };

  public query ({ caller }) func getRepliesForPostWithPagination(
    videoId : Nat,
    startIndex : Nat,
    batchSize : Nat,
  ) : async [VideoReply] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can view replies");
    };

    var filteredReplies : [VideoReply] = [];
    for ((_, reply) in videoReplies.entries()) {
      if (reply.parentVideoId == videoId) {
        filteredReplies := filteredReplies.concat([reply]);
      };
    };

    filteredReplies := filteredReplies.sort(ReplyModule.compareByTimestampDesc);

    let totalReplies = filteredReplies.size();
    if (startIndex >= totalReplies) {
      return [];
    };

    let endIndex = if (startIndex + batchSize < totalReplies) {
      startIndex + batchSize;
    } else { totalReplies };

    filteredReplies.sliceToArray(startIndex, endIndex);
  };

  public query ({ caller }) func getReplyLikesCount(replyId : Nat) : async Nat {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can view reply like counts");
    };

    switch (replyLikes.get(replyId)) {
      case (null) { 0 };
      case (?likesSet) { likesSet.size() };
    };
  };

  public query ({ caller }) func hasUserLikedReply(replyId : Nat, user : Principal) : async Bool {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can check like status");
    };

    switch (replyLikes.get(replyId)) {
      case (null) { false };
      case (?likesSet) { likesSet.contains(user) };
    };
  };

  public query ({ caller }) func getUserFollowers(_user : Principal) : async [Principal] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can view followers");
    };
    switch (followersData.get(_user)) {
      case (null) { [] };
      case (?followers) { followers.toArray() };
    };
  };

  public query ({ caller }) func getUserFollowing(_user : Principal) : async [Principal] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can view following");
    };
    switch (followingData.get(_user)) {
      case (null) { [] };
      case (?following) { following.toArray() };
    };
  };

  public query ({ caller }) func getNotifications() : async [Notification] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can get notifications");
    };

    switch (receivedNotifications.get(caller)) {
      case (null) { [] };
      case (?notifications) { notifications.toArray().sort(NotificationModule.compareByTimestamp) };
    };
  };

  public query ({ caller }) func getUnreadNotificationsCount() : async Nat {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can get notifications count");
    };

    switch (receivedNotifications.get(caller)) {
      case (null) { 0 };
      case (?notifications) {
        notifications.toArray().filter(func(n) { not n.isRead }).size();
      };
    };
  };

  public query ({ caller }) func getVideoPostById(id : Nat) : async ?VideoPost {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can view videos");
    };
    videoPosts.get(id);
  };

  public query ({ caller }) func getVideoReplyById(id : Nat) : async ?VideoReply {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can view replies");
    };
    videoReplies.get(id);
  };

  public query ({ caller }) func getFollowersCount(_user : Principal) : async Nat {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can view followers count");
    };

    switch (followersData.get(_user)) {
      case (null) { 0 };
      case (?followers) { followers.size() };
    };
  };

  public query ({ caller }) func getFollowingCount(_user : Principal) : async Nat {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can view following count");
    };

    switch (followingData.get(_user)) {
      case (null) { 0 };
      case (?following) { following.size() };
    };
  };

  public query ({ caller }) func getFollowersAndFollowingCounts(user : Principal) : async (Nat, Nat) {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can view followers and following counts");
    };

    let followersCount = switch (followersData.get(user)) {
      case (null) { 0 };
      case (?followers) { followers.size() };
    };

    let followingCount = switch (followingData.get(user)) {
      case (null) { 0 };
      case (?following) { following.size() };
    };

    (followersCount, followingCount);
  };

  public shared ({ caller }) func deleteAccount() : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can delete accounts");
    };

    switch (userProfiles.get(caller)) {
      case (null) { Runtime.trap("User profile not found") };
      case (?profile) {
        switch (profile.deletionTimestamp) {
          case (?_) { Runtime.trap("Account already marked for deletion") };
          case (null) {
            let updatedProfile = {
              profile with
              deletionTimestamp = ?(Time.now() + 14 * 24 * 60 * 60 * 1000000000);
            };
            userProfiles.add(caller, updatedProfile);
          };
        };
      };
    };
  };

  public shared ({ caller }) func cancelAccountDeletion() : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can cancel account deletion");
    };

    switch (userProfiles.get(caller)) {
      case (null) { Runtime.trap("User profile not found") };
      case (?profile) {
        switch (profile.deletionTimestamp) {
          case (null) { Runtime.trap("Account not marked for deletion") };
          case (?timestamp) {
            if (timestamp <= Time.now()) {
              Runtime.trap("Deletion period expired");
            };
            userProfiles.add(caller, { profile with deletionTimestamp = null });
          };
        };
      };
    };
  };

  public shared ({ caller }) func performAutomatedAccountDeletion() : async () {
    if (not callerHasAdminPermission(caller)) {
      Runtime.trap("Unauthorized: Only admins can perform automated account deletion");
    };

    let currentTime = Time.now();

    for ((user, profile) in userProfiles.entries()) {
      switch (profile.deletionTimestamp) {
        case (?timestamp) {
          if (timestamp <= currentTime) {
            userProfiles.remove(user);
            usernameToPrincipal.remove(profile.username);
            cleanUserDataAfterDeletion(user);
          };
        };
        case (null) {};
      };
    };
  };

  func cleanUserDataAfterDeletion(_user : Principal) : () {
    switch (followingData.get(_user)) {
      case (?following) {
        for (followedUser in following.toArray().values()) {
          switch (followersData.get(followedUser)) {
            case (?followers) {
              followers.remove(_user);
              followersData.add(followedUser, followers);
            };
            case (null) {};
          };
        };
      };
      case (null) {};
    };

    switch (followersData.get(_user)) {
      case (?followers) {
        for (follower in followers.toArray().values()) {
          switch (followingData.get(follower)) {
            case (?following) {
              following.remove(_user);
              followingData.add(follower, following);
            };
            case (null) {};
          };
        };
      };
      case (null) {};
    };

    followingData.remove(_user);
    followersData.remove(_user);

    receivedNotifications.remove(_user);

    for ((recipient, notifications) in receivedNotifications.entries()) {
      let filteredNotifications = notifications.filter(func(n) { n.sender != _user });
      receivedNotifications.add(recipient, filteredNotifications);
    };

    let postsToRemove = videoPosts.keys().toArray().filter(
      func(id) {
        switch (videoPosts.get(id)) {
          case (null) { false };
          case (?post) { post.creator == _user };
        };
      }
    );

    for (postId in postsToRemove.values()) {
      removeRepliesForParentPost(postId);
      videoPosts.remove(postId);
    };

    let repliesToRemove = videoReplies.keys().toArray().filter(
      func(id) {
        switch (videoReplies.get(id)) {
          case (null) { false };
          case (?reply) { reply.creator == _user };
        };
      }
    );

    for (replyId in repliesToRemove.values()) {
      videoReplies.remove(replyId);
      replyLikes.remove(replyId);
    };
  };

  func removeRepliesForParentPost(parentPostId : Nat) : () {
    for ((replyId, reply) in videoReplies.entries()) {
      if (reply.parentVideoId == parentPostId) {
        videoReplies.remove(replyId);
        replyLikes.remove(replyId);
      };
    };
  };

  public query ({ caller }) func getAccountDeletionTimeRemaining() : async ?Int {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can check deletion times");
    };

    switch (userProfiles.get(caller)) {
      case (null) { Runtime.trap("User profile not found") };
      case (?profile) {
        switch (profile.deletionTimestamp) {
          case (null) { null };
          case (?timestamp) {
            let timeRemaining = timestamp - Time.now();
            if (timeRemaining > 0) {
              ?timeRemaining;
            } else {
              null;
            };
          };
        };
      };
    };
  };

  public query ({ caller }) func getScheduledDeletions() : async [(Principal, Time.Time)] {
    if (not callerHasAdminPermission(caller)) {
      Runtime.trap("Unauthorized: Only admins can view scheduled deletions");
    };

    var scheduledDeletions : [(Principal, Time.Time)] = [];
    for ((user, profile) in userProfiles.entries()) {
      switch (profile.deletionTimestamp) {
        case (?timestamp) {
          scheduledDeletions := scheduledDeletions.concat([ (user, timestamp) ]);
        };
        case (null) {};
      };
    };
    scheduledDeletions;
  };

  public shared ({ caller }) func permanentlyDeleteAccount(target : Principal) : async () {
    if (not callerHasAdminPermission(caller)) {
      Runtime.trap("Unauthorized: Only admins can delete accounts permanently");
    };

    switch (userProfiles.get(target)) {
      case (null) { Runtime.trap("Target user not found") };
      case (?profile) {
        userProfiles.remove(target);
        usernameToPrincipal.remove(profile.username);
        cleanUserDataAfterDeletion(target);
      };
    };
  };

  public query ({ caller }) func getTotalVideoCounts() : async (Nat, Nat) {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can view video counts");
    };

    (videoPosts.size(), videoReplies.size());
  };

  public query ({ caller }) func getUserAccountDeletionTimeRemaining(_user : Principal) : async ?Int {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can check deletion times");
    };

    switch (userProfiles.get(_user)) {
      case (null) { null };
      case (?profile) {
        switch (profile.deletionTimestamp) {
          case (null) { null };
          case (?timestamp) {
            let timeRemaining = timestamp - Time.now();
            if (timeRemaining > 0) {
              ?timeRemaining;
            } else {
              null;
            };
          };
        };
      };
    };
  };

  public query ({ caller }) func getAllDeletionTimestamps() : async [(Principal, ?Time.Time)] {
    if (not callerHasAdminPermission(caller)) {
      Runtime.trap("Unauthorized: Only admins can view deletion timestamps");
    };

    var result : [(Principal, ?Time.Time)] = [];
    for ((user, profile) in userProfiles.entries()) {
      result := result.concat([ (user, profile.deletionTimestamp) ]);
    };
    result;
  };

  public query ({ caller }) func getActiveAccountsCount() : async Nat {
    if (not callerHasAdminPermission(caller)) {
      Runtime.trap("Unauthorized: Only admins can view account counts");
    };

    var count = 0;
    for ((_, profile) in userProfiles.entries()) {
      if (profile.deletionTimestamp == null) {
        count += 1;
      };
    };
    count;
  };

  public query ({ caller }) func revalidateSession() : async Bool {
    AccessControl.hasPermission(accessControlState, caller, #user);
  };

  public query ({ caller }) func getRepliesCountForPost(videoId : Nat) : async Nat {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can view reply count");
    };

    var count = 0;
    for ((_, reply) in videoReplies.entries()) {
      if (reply.parentVideoId == videoId) {
        count += 1;
      };
    };
    count;
  };

  public query ({ caller }) func getReplySharesCount(replyId : Nat) : async Nat {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can view reply share counts");
    };

    switch (videoReplies.get(replyId)) {
      case (null) { 0 };
      case (?reply) { reply.shares };
    };
  };

  public query ({ caller }) func hasUserLikedReplyForCaller(replyId : Nat) : async Bool {
    let user = caller;
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can check like status");
    };

    switch (replyLikes.get(replyId)) {
      case (null) { false };
      case (?likesSet) { likesSet.contains(user) };
    };
  };

  public shared ({ caller }) func recordVisit() : async () {
    if (not callerHasAdminPermission(caller)) {
      Runtime.trap("Unauthorized: Only admins can track visitors");
    };

    let callerPrincipal = caller;

    let now = Time.now();

    let millisPerDay = 24 * 60 * 60 * 1000000;
    let currentDay = now / millisPerDay;

    let millisPerWeek = 7 * 24 * 60 * 60 * 1000000;
    let currentWeek = now / millisPerWeek;

    let millisPerMonth = 30 * 24 * 60 * 60 * 1000000;
    let currentMonth = (now / millisPerMonth).toNat();

    let existingDaily = switch (dailyVisitors.get(currentDay)) {
      case (null) { Set.empty<Principal>() };
      case (?visitors) { visitors };
    };

    if (not existingDaily.contains(callerPrincipal)) {
      existingDaily.add(callerPrincipal);
      dailyVisitors.add(currentDay, existingDaily);
    };

    let weeklyKey = { week = currentWeek; day = currentDay };
    let existingWeekly = switch (weeklyVisitors.get(weeklyKey)) {
      case (null) { Set.empty<Principal>() };
      case (?visitors) { visitors };
    };

    if (not existingWeekly.contains(callerPrincipal)) {
      existingWeekly.add(callerPrincipal);
      weeklyVisitors.add(weeklyKey, existingWeekly);
    };

    let existingMonthly = switch (monthlyVisitors.get(currentMonth)) {
      case (null) { Set.empty<Principal>() };
      case (?visitors) { visitors };
    };

    if (not existingMonthly.contains(callerPrincipal)) {
      existingMonthly.add(callerPrincipal);
      monthlyVisitors.add(currentMonth, existingMonthly);
    };

    if (not allTimeVisitors.contains(callerPrincipal)) {
      allTimeVisitors.add(callerPrincipal);
    };
  };

  public query ({ caller }) func getVisitorStats() : async VisitorStats {
    if (not callerHasAdminPermission(caller)) {
      Runtime.trap("Unauthorized: Only admins can view stats");
    };

    let now = Time.now();
    let millisPerDay = 24 * 60 * 60 * 1000000;
    let currentDay = now / millisPerDay;

    let millisPerWeek = 7 * 24 * 60 * 60 * 1000000;
    let currentWeek = now / millisPerWeek;

    let millisPerMonth = 30 * 24 * 60 * 60 * 1000000;
    let currentMonth = (now / millisPerMonth).toNat();

    let dailyCount = switch (dailyVisitors.get(currentDay)) {
      case (null) { 0 };
      case (?visitors) { visitors.size() };
    };

    let weeklyKey = { week = currentWeek; day = currentDay };
    let weeklyCount = switch (weeklyVisitors.get(weeklyKey)) {
      case (null) { 0 };
      case (?visitors) { visitors.size() };
    };

    let monthlyCount = switch (monthlyVisitors.get(currentMonth)) {
      case (null) { 0 };
      case (?visitors) { visitors.size() };
    };

    let allTimeCount = allTimeVisitors.size();

    {
      daily = dailyCount;
      weekly = weeklyCount;
      monthly = monthlyCount;
      allTime = allTimeCount;
    };
  };
};


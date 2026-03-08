module {
  type OldActor = {
    nextVideoPostId : Nat;
    nextVideoReplyId : Nat;
  };

  type NewActor = {
    nextVideoPostId : Nat;
    nextVideoReplyId : Nat;
    donateText : Text;
  };

  public func run(old : OldActor) : NewActor {
    let defaultText = "Support 15sec! Every contribution helps us keep the platform running and growing. We are committed to building a free, creative space for everyone. Thank you for being part of our community.";
    { old with donateText = defaultText };
  };
};

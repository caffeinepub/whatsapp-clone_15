import Map "mo:core/Map";
import Set "mo:core/Set";
import List "mo:core/List";
import Text "mo:core/Text";
import Iter "mo:core/Iter";
import Time "mo:core/Time";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";

import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";

actor {
  // Initialize the user system state
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // Types
  type UserId = Principal;
  type ConversationId = Nat;
  type MessageId = Nat;

  public type UserStatus = {
    #online;
    #offline;
    #away;
    #busy;
  };

  public type UserProfile = {
    userId : UserId;
    displayName : Text;
    avatarUrl : Text;
    status : UserStatus;
  };

  public type Message = {
    id : MessageId;
    sender : UserId;
    timestamp : Time.Time;
    content : Text;
    read : Bool;
  };

  public type Conversation = {
    id : ConversationId;
    participants : [UserId];
    isGroup : Bool;
    groupName : ?Text;
    messages : [Message];
  };

  // State
  var nextConversationId = 0;
  var nextMessageId = 0;

  let userProfiles = Map.empty<UserId, UserProfile>();
  let userContacts = Map.empty<UserId, Set.Set<UserId>>();
  let conversations = Map.empty<ConversationId, Conversation>();

  // Helper: check if caller is a registered user (has a profile)
  func isRegisteredUser(caller : UserId) : Bool {
    if (caller.isAnonymous()) return false;
    userProfiles.containsKey(caller);
  };

  // Helper: check if caller is a participant in a conversation
  func isParticipant(conversation : Conversation, caller : UserId) : Bool {
    for (p in conversation.participants.vals()) {
      if (Principal.equal(p, caller)) return true;
    };
    false;
  };

  // -----------------------------------------------------------------------
  // Required profile interface (getCallerUserProfile, saveCallerUserProfile,
  // getUserProfile) as mandated by the instructions.
  // -----------------------------------------------------------------------

  /// Get the calling user's own profile.
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not isRegisteredUser(caller)) {
      Runtime.trap("Unauthorized: Only registered users can get their profile");
    };
    userProfiles.get(caller);
  };

  /// Save (upsert) the calling user's own profile.
  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not isRegisteredUser(caller)) {
      Runtime.trap("Unauthorized: Only registered users can save their profile");
    };
    // Ensure the stored profile always reflects the real caller principal
    let stored : UserProfile = {
      userId = caller;
      displayName = profile.displayName;
      avatarUrl = profile.avatarUrl;
      status = profile.status;
    };
    userProfiles.add(caller, stored);
  };

  /// Fetch any user's profile. Accessible to registered users.
  public query ({ caller }) func getUserProfile(userId : UserId) : async UserProfile {
    if (not isRegisteredUser(caller)) {
      Runtime.trap("Unauthorized: Only registered users can view profiles");
    };
    switch (userProfiles.get(userId)) {
      case (?profile) { profile };
      case (null) { Runtime.trap("User not found") };
    };
  };

  // -----------------------------------------------------------------------
  // User Management
  // -----------------------------------------------------------------------

  /// Register a new user. Creates an initial profile; no role assignment needed
  /// since registration is gated by profile existence checks.
  public shared ({ caller }) func registerUser(displayName : Text, avatarUrl : Text) : async () {
    // Anonymous principals cannot register.
    if (caller.isAnonymous()) {
      Runtime.trap("Unauthorized: Anonymous principals cannot register");
    };
    if (userProfiles.containsKey(caller)) {
      Runtime.trap("User already registered");
    };
    let profile : UserProfile = {
      userId = caller;
      displayName;
      avatarUrl;
      status = #offline;
    };
    userProfiles.add(caller, profile);
    userContacts.add(caller, Set.empty<UserId>());
  };

  /// Update the calling user's display name and avatar URL.
  public shared ({ caller }) func updateProfile(displayName : Text, avatarUrl : Text) : async () {
    if (not isRegisteredUser(caller)) {
      Runtime.trap("Unauthorized: Only registered users can update their profile");
    };
    let existing = switch (userProfiles.get(caller)) {
      case (?profile) { profile };
      case (null) { Runtime.trap("User not registered") };
    };
    let updated : UserProfile = {
      userId = caller;
      displayName;
      avatarUrl;
      status = existing.status;
    };
    userProfiles.add(caller, updated);
  };

  /// Get the calling user's own profile (convenience alias).
  public query ({ caller }) func getMyProfile() : async UserProfile {
    if (not isRegisteredUser(caller)) {
      Runtime.trap("Unauthorized: Only registered users can view their profile");
    };
    switch (userProfiles.get(caller)) {
      case (?profile) { profile };
      case (null) { Runtime.trap("User not registered") };
    };
  };

  // -----------------------------------------------------------------------
  // Contact Management
  // -----------------------------------------------------------------------

  /// Add a contact to the caller's contact list.
  public shared ({ caller }) func addContact(contactId : UserId) : async () {
    if (not isRegisteredUser(caller)) {
      Runtime.trap("Unauthorized: Only registered users can manage contacts");
    };
    if (Principal.equal(caller, contactId)) {
      Runtime.trap("Cannot add yourself as a contact");
    };
    if (not userProfiles.containsKey(contactId)) {
      Runtime.trap("Contact does not exist");
    };
    let existing = switch (userContacts.get(caller)) {
      case (?contacts) { contacts };
      case (null) { Set.empty<UserId>() };
    };
    existing.add(contactId);
    userContacts.add(caller, existing);
  };

  /// Remove a contact from the caller's contact list.
  public shared ({ caller }) func removeContact(contactId : UserId) : async () {
    if (not isRegisteredUser(caller)) {
      Runtime.trap("Unauthorized: Only registered users can manage contacts");
    };
    let existing = switch (userContacts.get(caller)) {
      case (?contacts) { contacts };
      case (null) { Runtime.trap("No contacts found") };
    };
    existing.remove(contactId);
    userContacts.add(caller, existing);
  };

  /// Get the caller's contact list.
  public query ({ caller }) func getContacts() : async [UserId] {
    if (not isRegisteredUser(caller)) {
      Runtime.trap("Unauthorized: Only registered users can view contacts");
    };
    switch (userContacts.get(caller)) {
      case (?contacts) { contacts.toArray() };
      case (null) { [] };
    };
  };

  // -----------------------------------------------------------------------
  // Conversation & Messaging
  // -----------------------------------------------------------------------

  /// Create a new conversation. The caller is automatically added as a participant.
  public shared ({ caller }) func createConversation(participantIds : [UserId], isGroup : Bool, groupName : ?Text) : async ConversationId {
    if (not isRegisteredUser(caller)) {
      Runtime.trap("Unauthorized: Only registered users can create conversations");
    };
    if (participantIds.size() == 0) {
      Runtime.trap("At least one participant is required");
    };

    let conversationId = nextConversationId;
    nextConversationId += 1;

    let allParticipants = List.fromArray(participantIds);
    // Add caller if not already in the list
    var callerIncluded = false;
    for (p in participantIds.vals()) {
      if (Principal.equal(p, caller)) callerIncluded := true;
    };
    if (not callerIncluded) {
      allParticipants.add(caller);
    };

    let conversation : Conversation = {
      id = conversationId;
      participants = allParticipants.toArray();
      isGroup;
      groupName;
      messages = [];
    };
    conversations.add(conversationId, conversation);
    conversationId;
  };

  /// Send a message to a conversation. Caller must be a participant.
  public shared ({ caller }) func sendMessage(conversationId : ConversationId, content : Text) : async MessageId {
    if (not isRegisteredUser(caller)) {
      Runtime.trap("Unauthorized: Only registered users can send messages");
    };
    let conversation = switch (conversations.get(conversationId)) {
      case (?conv) { conv };
      case (null) { Runtime.trap("Conversation not found") };
    };
    if (not isParticipant(conversation, caller)) {
      Runtime.trap("Unauthorized: You are not a participant in this conversation");
    };

    let messageId = nextMessageId;
    nextMessageId += 1;
    let message : Message = {
      id = messageId;
      sender = caller;
      timestamp = Time.now();
      content;
      read = false;
    };

    let messagesList = List.fromArray<Message>(conversation.messages);
    messagesList.add(message : Message);
    let updatedConversation = {
      conversation with messages = messagesList.toArray();
    };
    conversations.add(conversationId, updatedConversation);
    messageId;
  };

  /// Get messages from a conversation. Caller must be a participant.
  public query ({ caller }) func getMessages(conversationId : ConversationId, limit : Nat, offset : Nat) : async [Message] {
    if (not isRegisteredUser(caller)) {
      Runtime.trap("Unauthorized: Only registered users can read messages");
    };
    let conversation = switch (conversations.get(conversationId)) {
      case (?conv) { conv };
      case (null) { Runtime.trap("Conversation not found") };
    };
    if (not isParticipant(conversation, caller)) {
      Runtime.trap("Unauthorized: You are not a participant in this conversation");
    };

    let start = offset;
    let end = if (limit + offset > conversation.messages.size()) {
      conversation.messages.size();
    } else {
      limit + offset;
    };

    if (start >= conversation.messages.size()) { return [] };

    let filteredMessages = List.fromArray<Message>(conversation.messages).toArray().sliceToArray(start, end);
    filteredMessages;
  };

  /// Mark all messages in a conversation as read for the caller. Caller must be a participant.
  public shared ({ caller }) func markMessagesRead(conversationId : ConversationId) : async () {
    if (not isRegisteredUser(caller)) {
      Runtime.trap("Unauthorized: Only registered users can mark messages as read");
    };
    let conversation = switch (conversations.get(conversationId)) {
      case (?conv) { conv };
      case (null) { Runtime.trap("Conversation not found") };
    };
    if (not isParticipant(conversation, caller)) {
      Runtime.trap("Unauthorized: You are not a participant in this conversation");
    };

    let updatedMessages = List.fromArray<Message>(conversation.messages).map<Message, Message>(
      func(message) {
        if (Principal.equal(message.sender, caller)) {
          message;
        } else {
          {
            message with
            read = true;
          };
        };
      }
    );

    let updatedConversation = {
      conversation with messages = updatedMessages.values().toArray();
    };
    conversations.add(conversationId, updatedConversation);
  };

  /// Get all conversations the caller participates in.
  public query ({ caller }) func getConversations() : async [Conversation] {
    if (not isRegisteredUser(caller)) {
      Runtime.trap("Unauthorized: Only registered users can view conversations");
    };
    let filtered = conversations.filter(func(_id, conv) { isParticipant(conv, caller) });
    filtered.values().toArray();
  };
};

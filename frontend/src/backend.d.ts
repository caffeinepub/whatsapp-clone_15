import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Conversation {
    id: ConversationId;
    participants: Array<UserId>;
    messages: Array<Message>;
    isGroup: boolean;
    groupName?: string;
}
export type UserId = Principal;
export type Time = bigint;
export type MessageId = bigint;
export interface Message {
    id: MessageId;
    content: string;
    read: boolean;
    sender: UserId;
    timestamp: Time;
}
export interface UserProfile {
    status: UserStatus;
    displayName: string;
    userId: UserId;
    avatarUrl: string;
}
export type ConversationId = bigint;
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export enum UserStatus {
    away = "away",
    busy = "busy",
    offline = "offline",
    online = "online"
}
export interface backendInterface {
    /**
     * / Add a contact to the caller's contact list.
     */
    addContact(contactId: UserId): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    /**
     * / Create a new conversation. The caller is automatically added as a participant.
     */
    createConversation(participantIds: Array<UserId>, isGroup: boolean, groupName: string | null): Promise<ConversationId>;
    /**
     * / Get the calling user's own profile.
     */
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    /**
     * / Get the caller's contact list.
     */
    getContacts(): Promise<Array<UserId>>;
    /**
     * / Get all conversations the caller participates in.
     */
    getConversations(): Promise<Array<Conversation>>;
    /**
     * / Get messages from a conversation. Caller must be a participant.
     */
    getMessages(conversationId: ConversationId, limit: bigint, offset: bigint): Promise<Array<Message>>;
    /**
     * / Get the calling user's own profile (convenience alias).
     */
    getMyProfile(): Promise<UserProfile>;
    /**
     * / Fetch any user's profile. Accessible to registered users.
     */
    getUserProfile(userId: UserId): Promise<UserProfile>;
    isCallerAdmin(): Promise<boolean>;
    /**
     * / Mark all messages in a conversation as read for the caller. Caller must be a participant.
     */
    markMessagesRead(conversationId: ConversationId): Promise<void>;
    /**
     * / Register a new user. Creates an initial profile; no role assignment needed
     * / since registration is gated by profile existence checks.
     */
    registerUser(displayName: string, avatarUrl: string): Promise<void>;
    /**
     * / Remove a contact from the caller's contact list.
     */
    removeContact(contactId: UserId): Promise<void>;
    /**
     * / Save (upsert) the calling user's own profile.
     */
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    /**
     * / Send a message to a conversation. Caller must be a participant.
     */
    sendMessage(conversationId: ConversationId, content: string): Promise<MessageId>;
    /**
     * / Update the calling user's display name and avatar URL.
     */
    updateProfile(displayName: string, avatarUrl: string): Promise<void>;
}

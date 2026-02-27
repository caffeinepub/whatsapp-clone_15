import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { UserProfile, Conversation, Message, UserId, ConversationId } from '../backend';
import { UserStatus } from '../backend';

// ─── Auth / Profile ──────────────────────────────────────────────────────────

export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();

  const query = useQuery<UserProfile | null>({
    queryKey: ['currentUserProfile'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      try {
        return await actor.getCallerUserProfile();
      } catch (err: unknown) {
        // Backend traps when the caller is not yet registered.
        // Treat this as "no profile" so the setup modal can be shown.
        const msg = err instanceof Error ? err.message : String(err);
        if (
          msg.includes('Unauthorized') ||
          msg.includes('not registered') ||
          msg.includes('Only registered users')
        ) {
          return null;
        }
        throw err;
      }
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

export function useSaveCallerUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error('Actor not available');
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

export function useRegisterUser() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ displayName, avatarUrl }: { displayName: string; avatarUrl: string }) => {
      if (!actor) throw new Error('Actor not available');
      await actor.registerUser(displayName, avatarUrl);
      // Immediately fetch the newly created profile so the cache is populated
      // and the app transitions away from the setup modal without waiting for
      // a background refetch.
      try {
        const profile = await actor.getCallerUserProfile();
        return profile;
      } catch {
        // If the fetch fails for any reason, return a minimal placeholder so
        // the modal still closes. The next background refetch will correct it.
        return { displayName, avatarUrl, userId: null, status: UserStatus.offline } as unknown as UserProfile;
      }
    },
    onSuccess: (profile) => {
      // Populate the cache directly so the modal closes immediately.
      if (profile) {
        queryClient.setQueryData(['currentUserProfile'], profile);
      }
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
    onError: () => {
      // On error, reset the query so it can be retried cleanly.
      queryClient.resetQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

export function useUpdateProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ displayName, avatarUrl }: { displayName: string; avatarUrl: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateProfile(displayName, avatarUrl);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}

export function useGetUserProfile(userId: UserId | null) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<UserProfile>({
    queryKey: ['userProfile', userId?.toString()],
    queryFn: async () => {
      if (!actor || !userId) throw new Error('Actor or userId not available');
      return actor.getUserProfile(userId);
    },
    enabled: !!actor && !actorFetching && !!userId,
    staleTime: 60_000,
  });
}

// ─── Contacts ────────────────────────────────────────────────────────────────

export function useGetContacts() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<UserId[]>({
    queryKey: ['contacts'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getContacts();
    },
    enabled: !!actor && !actorFetching,
    refetchInterval: 30_000,
  });
}

export function useAddContact() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (contactId: UserId) => {
      if (!actor) throw new Error('Actor not available');
      return actor.addContact(contactId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
    },
  });
}

export function useRemoveContact() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (contactId: UserId) => {
      if (!actor) throw new Error('Actor not available');
      return actor.removeContact(contactId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
    },
  });
}

// ─── Conversations ────────────────────────────────────────────────────────────

export function useGetConversations() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<Conversation[]>({
    queryKey: ['conversations'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getConversations();
    },
    enabled: !!actor && !actorFetching,
    refetchInterval: 3_000,
  });
}

export function useCreateConversation() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      participantIds,
      isGroup,
      groupName,
    }: {
      participantIds: UserId[];
      isGroup: boolean;
      groupName: string | null;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.createConversation(participantIds, isGroup, groupName);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}

// ─── Messages ────────────────────────────────────────────────────────────────

export function useGetMessages(conversationId: ConversationId | null) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<Message[]>({
    queryKey: ['messages', conversationId?.toString()],
    queryFn: async () => {
      if (!actor || conversationId === null) return [];
      return actor.getMessages(conversationId, BigInt(200), BigInt(0));
    },
    enabled: !!actor && !actorFetching && conversationId !== null,
    refetchInterval: 2_000,
  });
}

export function useSendMessage() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      conversationId,
      content,
    }: {
      conversationId: ConversationId;
      content: string;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.sendMessage(conversationId, content);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['messages', variables.conversationId.toString()] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}

export function useMarkMessagesRead() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (conversationId: ConversationId) => {
      if (!actor) throw new Error('Actor not available');
      return actor.markMessagesRead(conversationId);
    },
    onSuccess: (_data, conversationId) => {
      queryClient.invalidateQueries({ queryKey: ['messages', conversationId.toString()] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function formatTimestamp(timestamp: bigint): string {
  const ms = Number(timestamp) / 1_000_000;
  const date = new Date(ms);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } else if (diffDays === 1) {
    return 'Yesterday';
  } else if (diffDays < 7) {
    return date.toLocaleDateString([], { weekday: 'short' });
  } else {
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }
}

export function formatFullTimestamp(timestamp: bigint): string {
  const ms = Number(timestamp) / 1_000_000;
  const date = new Date(ms);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export { UserStatus };

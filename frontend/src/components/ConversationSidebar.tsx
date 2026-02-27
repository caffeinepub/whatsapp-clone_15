import { useState } from 'react';
import { useGetConversations, useGetUserProfile, getInitials, formatTimestamp } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import type { UserProfile, Conversation, ConversationId, UserId } from '../backend';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, Search, Settings, UserPlus, MessageSquarePlus } from 'lucide-react';
import NewGroupModal from './NewGroupModal';

interface ConversationSidebarProps {
  activeConversationId: ConversationId | null;
  onSelectConversation: (id: ConversationId) => void;
  onOpenContacts: () => void;
  onOpenProfile: () => void;
  userProfile: UserProfile | null;
}

export default function ConversationSidebar({
  activeConversationId,
  onSelectConversation,
  onOpenContacts,
  onOpenProfile,
  userProfile,
}: ConversationSidebarProps) {
  const [search, setSearch] = useState('');
  const [showNewGroup, setShowNewGroup] = useState(false);
  const { data: conversations, isLoading } = useGetConversations();
  const { identity } = useInternetIdentity();
  const myPrincipal = identity?.getPrincipal();

  const filtered = (conversations ?? []).filter((conv) => {
    if (!search.trim()) return true;
    const name = conv.isGroup
      ? (conv.groupName ?? 'Group')
      : '';
    return name.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-chat-header border-b border-chat-border">
        <button
          onClick={onOpenProfile}
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
        >
          <Avatar className="w-9 h-9">
            {userProfile?.avatarUrl && <AvatarImage src={userProfile.avatarUrl} />}
            <AvatarFallback className="bg-teal/20 text-teal text-sm font-semibold">
              {userProfile ? getInitials(userProfile.displayName) : '?'}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm font-semibold text-foreground hidden sm:block">
            {userProfile?.displayName ?? 'Me'}
          </span>
        </button>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowNewGroup(true)}
            className="w-8 h-8 text-muted-foreground hover:text-teal hover:bg-teal/10"
            title="New Group"
          >
            <Users className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onOpenContacts}
            className="w-8 h-8 text-muted-foreground hover:text-teal hover:bg-teal/10"
            title="Contacts"
          >
            <UserPlus className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onOpenProfile}
            className="w-8 h-8 text-muted-foreground hover:text-teal hover:bg-teal/10"
            title="Settings"
          >
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="px-3 py-2 bg-chat-sidebar border-b border-chat-border">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search conversations"
            className="pl-9 h-9 bg-chat-input border-chat-border text-foreground placeholder:text-muted-foreground text-sm rounded-full focus:border-teal"
          />
        </div>
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex flex-col gap-0">
            {Array.from({ length: 6 }).map((_, i) => (
              <ConversationSkeleton key={i} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 px-6 text-center">
            <MessageSquarePlus className="w-10 h-10 text-muted-foreground/40" />
            <div>
              <p className="text-sm font-medium text-foreground/60">No conversations yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                Add contacts and start chatting
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onOpenContacts}
              className="text-teal hover:text-teal hover:bg-teal/10 text-xs"
            >
              Find contacts
            </Button>
          </div>
        ) : (
          filtered.map((conv) => (
            <ConversationItem
              key={conv.id.toString()}
              conversation={conv}
              isActive={activeConversationId?.toString() === conv.id.toString()}
              myPrincipal={myPrincipal?.toString() ?? ''}
              onClick={() => onSelectConversation(conv.id)}
            />
          ))
        )}
      </div>

      {showNewGroup && (
        <NewGroupModal onClose={() => setShowNewGroup(false)} />
      )}
    </div>
  );
}

interface ConversationItemProps {
  conversation: Conversation;
  isActive: boolean;
  myPrincipal: string;
  onClick: () => void;
}

function ConversationItem({ conversation, isActive, myPrincipal, onClick }: ConversationItemProps) {
  const otherParticipant = conversation.isGroup
    ? null
    : conversation.participants.find((p) => p.toString() !== myPrincipal) ?? null;

  const { data: otherProfile } = useGetUserProfile(otherParticipant);

  const displayName = conversation.isGroup
    ? (conversation.groupName ?? 'Group')
    : (otherProfile?.displayName ?? 'Unknown');

  const avatarUrl = conversation.isGroup ? '' : (otherProfile?.avatarUrl ?? '');
  const initials = getInitials(displayName);

  const lastMessage = conversation.messages[conversation.messages.length - 1];
  const unreadCount = conversation.messages.filter(
    (m) => !m.read && m.sender.toString() !== myPrincipal
  ).length;

  return (
    <button
      onClick={onClick}
      className={`
        w-full flex items-center gap-3 px-4 py-3 text-left transition-colors
        border-b border-chat-border/50
        ${isActive ? 'bg-chat-active' : 'hover:bg-chat-hover'}
      `}
    >
      <div className="relative flex-shrink-0">
        <Avatar className="w-12 h-12">
          {avatarUrl && <AvatarImage src={avatarUrl} />}
          <AvatarFallback
            className={`text-sm font-semibold ${conversation.isGroup ? 'bg-teal/20 text-teal' : 'bg-secondary text-foreground/70'}`}
          >
            {conversation.isGroup ? <Users className="w-5 h-5" /> : initials}
          </AvatarFallback>
        </Avatar>
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full bg-teal text-white text-[10px] font-bold flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-semibold text-foreground truncate">{displayName}</span>
          {lastMessage && (
            <span className="text-[11px] text-muted-foreground flex-shrink-0">
              {formatTimestamp(lastMessage.timestamp)}
            </span>
          )}
        </div>
        <div className="flex items-center justify-between gap-2 mt-0.5">
          <p className="text-xs text-muted-foreground truncate">
            {lastMessage ? lastMessage.content : 'No messages yet'}
          </p>
          {unreadCount > 0 && (
            <span className="flex-shrink-0 w-5 h-5 rounded-full bg-teal text-white text-[10px] font-bold flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

function ConversationSkeleton() {
  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-chat-border/50">
      <Skeleton className="w-12 h-12 rounded-full bg-chat-header" />
      <div className="flex-1 flex flex-col gap-2">
        <Skeleton className="h-3.5 w-32 bg-chat-header" />
        <Skeleton className="h-3 w-48 bg-chat-header" />
      </div>
    </div>
  );
}

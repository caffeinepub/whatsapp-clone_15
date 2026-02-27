import { useEffect, useRef, useState } from 'react';
import { useGetConversations, useGetMessages, useMarkMessagesRead, useGetUserProfile } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import type { UserProfile, ConversationId } from '../backend';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Info, Users } from 'lucide-react';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';
import { getInitials } from '../hooks/useQueries';

interface MessagePanelProps {
  conversationId: ConversationId;
  onBack: () => void;
  onToggleInfo: () => void;
  showInfoPanel: boolean;
  userProfile: UserProfile | null;
}

export default function MessagePanel({
  conversationId,
  onBack,
  onToggleInfo,
  showInfoPanel,
  userProfile,
}: MessagePanelProps) {
  const { identity } = useInternetIdentity();
  const myPrincipal = identity?.getPrincipal().toString() ?? '';
  const { data: conversations } = useGetConversations();
  const { data: messages, isLoading } = useGetMessages(conversationId);
  const markRead = useMarkMessagesRead();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [prevMessageCount, setPrevMessageCount] = useState(0);

  const conversation = conversations?.find((c) => c.id.toString() === conversationId.toString());
  const otherParticipant = conversation && !conversation.isGroup
    ? conversation.participants.find((p) => p.toString() !== myPrincipal) ?? null
    : null;
  const { data: otherProfile } = useGetUserProfile(otherParticipant);

  const displayName = conversation?.isGroup
    ? (conversation.groupName ?? 'Group')
    : (otherProfile?.displayName ?? 'Unknown');

  const avatarUrl = conversation?.isGroup ? '' : (otherProfile?.avatarUrl ?? '');

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (messages && messages.length !== prevMessageCount) {
      setPrevMessageCount(messages.length);
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, prevMessageCount]);

  // Mark messages as read when conversation is opened
  useEffect(() => {
    if (conversationId !== null) {
      markRead.mutate(conversationId);
    }
  }, [conversationId, messages?.length]);

  return (
    <div className="flex flex-col h-full bg-chat-bg">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-chat-header border-b border-chat-border flex-shrink-0">
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          className="md:hidden w-8 h-8 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>

        <Avatar className="w-10 h-10 flex-shrink-0">
          {avatarUrl && <AvatarImage src={avatarUrl} />}
          <AvatarFallback className={`text-sm font-semibold ${conversation?.isGroup ? 'bg-teal/20 text-teal' : 'bg-secondary text-foreground/70'}`}>
            {conversation?.isGroup ? <Users className="w-4 h-4" /> : getInitials(displayName)}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-semibold text-foreground truncate">{displayName}</h2>
          {conversation?.isGroup && (
            <p className="text-xs text-muted-foreground">
              {conversation.participants.length} members
            </p>
          )}
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleInfo}
          className={`w-8 h-8 transition-colors ${showInfoPanel ? 'text-teal bg-teal/10' : 'text-muted-foreground hover:text-teal hover:bg-teal/10'}`}
          title="Info"
        >
          <Info className="w-4 h-4" />
        </Button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-1">
        {isLoading ? (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <MessageSkeleton key={i} isMine={i % 3 === 0} />
            ))}
          </div>
        ) : !messages || messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-2 py-16">
            <p className="text-sm text-muted-foreground">No messages yet</p>
            <p className="text-xs text-muted-foreground/60">Say hello! 👋</p>
          </div>
        ) : (
          <>
            {messages.map((message, index) => {
              const isMine = message.sender.toString() === myPrincipal;
              const prevMessage = index > 0 ? messages[index - 1] : null;
              const isGroup = conversation?.isGroup ?? false;
              const showSenderName: boolean =
                isGroup &&
                !isMine &&
                (!prevMessage || prevMessage.sender.toString() !== message.sender.toString());

              return (
                <MessageBubble
                  key={message.id.toString()}
                  message={message}
                  isMine={isMine}
                  isGroup={isGroup}
                  showSenderName={showSenderName}
                />
              );
            })}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input */}
      <MessageInput conversationId={conversationId} />
    </div>
  );
}

function MessageSkeleton({ isMine }: { isMine: boolean }) {
  return (
    <div className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
      <Skeleton
        className={`h-10 rounded-2xl bg-chat-header ${isMine ? 'w-48' : 'w-56'}`}
      />
    </div>
  );
}

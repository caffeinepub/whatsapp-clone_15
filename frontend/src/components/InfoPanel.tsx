import { useGetConversations, useGetUserProfile, getInitials } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import type { UserProfile, ConversationId } from '../backend';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { X, Users, User } from 'lucide-react';

interface InfoPanelProps {
  conversationId: ConversationId;
  userProfile: UserProfile | null;
  onClose: () => void;
}

export default function InfoPanel({ conversationId, userProfile, onClose }: InfoPanelProps) {
  const { identity } = useInternetIdentity();
  const myPrincipal = identity?.getPrincipal().toString() ?? '';
  const { data: conversations } = useGetConversations();

  const conversation = conversations?.find((c) => c.id.toString() === conversationId.toString());
  const otherParticipant = conversation && !conversation.isGroup
    ? conversation.participants.find((p) => p.toString() !== myPrincipal) ?? null
    : null;
  const { data: otherProfile } = useGetUserProfile(otherParticipant);

  const displayName = conversation?.isGroup
    ? (conversation.groupName ?? 'Group')
    : (otherProfile?.displayName ?? 'Unknown');

  const avatarUrl = conversation?.isGroup ? '' : (otherProfile?.avatarUrl ?? '');

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-chat-header border-b border-chat-border">
        <h3 className="text-sm font-semibold text-foreground">
          {conversation?.isGroup ? 'Group Info' : 'Contact Info'}
        </h3>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="w-7 h-7 text-muted-foreground hover:text-foreground"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="flex flex-col items-center gap-4 p-6">
          {/* Avatar */}
          <Avatar className="w-20 h-20">
            {avatarUrl && <AvatarImage src={avatarUrl} />}
            <AvatarFallback className={`text-xl font-bold ${conversation?.isGroup ? 'bg-teal/20 text-teal' : 'bg-secondary text-foreground/70'}`}>
              {conversation?.isGroup ? <Users className="w-8 h-8" /> : getInitials(displayName)}
            </AvatarFallback>
          </Avatar>

          <div className="text-center">
            <h2 className="text-base font-semibold text-foreground">{displayName}</h2>
            {!conversation?.isGroup && otherProfile && (
              <p className="text-xs text-muted-foreground mt-1 capitalize">
                {otherProfile.status}
              </p>
            )}
          </div>

          {/* Group members */}
          {conversation?.isGroup && (
            <div className="w-full mt-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                {conversation.participants.length} Members
              </p>
              <div className="flex flex-col gap-1">
                {conversation.participants.map((participantId) => (
                  <ParticipantRow
                    key={participantId.toString()}
                    participantId={participantId}
                    isMe={participantId.toString() === myPrincipal}
                    myProfile={userProfile}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Conversation stats */}
          {conversation && (
            <div className="w-full mt-2 p-3 rounded-xl bg-chat-header border border-chat-border">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Stats
              </p>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Messages</span>
                <span className="text-foreground font-medium">{conversation.messages.length}</span>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

interface ParticipantRowProps {
  participantId: import('../backend').UserId;
  isMe: boolean;
  myProfile: UserProfile | null;
}

function ParticipantRow({ participantId, isMe, myProfile }: ParticipantRowProps) {
  const { data: profile } = useGetUserProfile(isMe ? null : participantId);
  const displayProfile = isMe ? myProfile : profile;

  return (
    <div className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-chat-hover transition-colors">
      <Avatar className="w-8 h-8">
        {displayProfile?.avatarUrl && <AvatarImage src={displayProfile.avatarUrl} />}
        <AvatarFallback className="text-xs font-semibold bg-secondary text-foreground/70">
          {displayProfile ? getInitials(displayProfile.displayName) : <User className="w-3 h-3" />}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">
          {displayProfile?.displayName ?? 'Unknown'}
          {isMe && <span className="text-teal text-xs ml-1">(You)</span>}
        </p>
      </div>
    </div>
  );
}

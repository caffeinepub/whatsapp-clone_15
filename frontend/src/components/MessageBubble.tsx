import type { Message } from '../backend';
import { useGetUserProfile } from '../hooks/useQueries';
import { formatFullTimestamp, getInitials } from '../hooks/useQueries';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import MessageStatusIcon from './MessageStatusIcon';

interface MessageBubbleProps {
  message: Message;
  isMine: boolean;
  isGroup: boolean;
  showSenderName: boolean;
}

export default function MessageBubble({ message, isMine, isGroup, showSenderName }: MessageBubbleProps) {
  const { data: senderProfile } = useGetUserProfile(showSenderName ? message.sender : null);

  return (
    <div className={`flex items-end gap-2 animate-fade-in ${isMine ? 'justify-end' : 'justify-start'}`}>
      {/* Avatar for received group messages */}
      {isGroup && !isMine && (
        <div className="flex-shrink-0 mb-1">
          {showSenderName ? (
            <Avatar className="w-7 h-7">
              {senderProfile?.avatarUrl && <AvatarImage src={senderProfile.avatarUrl} />}
              <AvatarFallback className="text-[10px] font-semibold bg-secondary text-foreground/70">
                {senderProfile ? getInitials(senderProfile.displayName) : '?'}
              </AvatarFallback>
            </Avatar>
          ) : (
            <div className="w-7" />
          )}
        </div>
      )}

      <div className={`flex flex-col gap-0.5 max-w-[70%] ${isMine ? 'items-end' : 'items-start'}`}>
        {/* Sender name in group */}
        {showSenderName && senderProfile && (
          <span className="text-[11px] font-semibold text-teal px-1">
            {senderProfile.displayName}
          </span>
        )}

        {/* Bubble */}
        <div
          className={`
            relative px-3 py-2 rounded-2xl shadow-msg
            ${isMine
              ? 'bg-chat-sent text-white rounded-br-sm'
              : 'bg-chat-received text-foreground rounded-bl-sm'
            }
          `}
        >
          <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
            {message.content}
          </p>

          {/* Timestamp + status */}
          <div className={`flex items-center gap-1 mt-0.5 ${isMine ? 'justify-end' : 'justify-start'}`}>
            <span className={`text-[10px] ${isMine ? 'text-white/70' : 'text-muted-foreground'}`}>
              {formatFullTimestamp(message.timestamp)}
            </span>
            {isMine && <MessageStatusIcon read={message.read} />}
          </div>
        </div>
      </div>
    </div>
  );
}

import { useState, useRef } from 'react';
import { useSendMessage } from '../hooks/useQueries';
import type { ConversationId } from '../backend';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send } from 'lucide-react';
import { toast } from 'sonner';

interface MessageInputProps {
  conversationId: ConversationId;
}

export default function MessageInput({ conversationId }: MessageInputProps) {
  const [content, setContent] = useState('');
  const sendMessage = useSendMessage();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = async () => {
    const trimmed = content.trim();
    if (!trimmed || sendMessage.isPending) return;

    setContent('');
    try {
      await sendMessage.mutateAsync({ conversationId, content: trimmed });
    } catch {
      toast.error('Failed to send message');
      setContent(trimmed);
    }

    textareaRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex items-end gap-2 px-4 py-3 bg-chat-header border-t border-chat-border flex-shrink-0">
      <div className="flex-1 relative">
        <Textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message…"
          rows={1}
          className="
            resize-none bg-chat-input border-chat-border text-foreground
            placeholder:text-muted-foreground text-sm rounded-2xl
            focus:border-teal focus:ring-0 focus-visible:ring-0
            min-h-[44px] max-h-32 py-3 px-4 leading-relaxed
            scrollbar-thin
          "
          style={{ height: 'auto' }}
          onInput={(e) => {
            const target = e.target as HTMLTextAreaElement;
            target.style.height = 'auto';
            target.style.height = Math.min(target.scrollHeight, 128) + 'px';
          }}
        />
      </div>

      <Button
        onClick={handleSend}
        disabled={!content.trim() || sendMessage.isPending}
        className="
          w-11 h-11 rounded-full bg-teal hover:bg-teal-dark
          text-white border-0 flex-shrink-0 transition-all duration-150
          disabled:opacity-40 disabled:cursor-not-allowed
          shadow-msg
        "
        size="icon"
      >
        {sendMessage.isPending ? (
          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : (
          <Send className="w-4 h-4" />
        )}
      </Button>
    </div>
  );
}

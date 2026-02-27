import { Check, CheckCheck } from 'lucide-react';

interface MessageStatusIconProps {
  read: boolean;
}

export default function MessageStatusIcon({ read }: MessageStatusIconProps) {
  if (read) {
    // Double checkmark in teal = read
    return <CheckCheck className="w-3.5 h-3.5 text-teal-light flex-shrink-0" />;
  }
  // Double checkmark in white/muted = delivered (stored in backend)
  return <CheckCheck className="w-3.5 h-3.5 text-white/60 flex-shrink-0" />;
}

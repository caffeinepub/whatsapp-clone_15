import { useState } from 'react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useRegisterUser } from '../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function ProfileSetupModal() {
  const { identity } = useInternetIdentity();
  const [displayName, setDisplayName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const registerUser = useRegisterUser();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) {
      setErrorMsg('Please enter a display name');
      return;
    }
    if (!identity) {
      setErrorMsg('Not authenticated. Please log in again.');
      return;
    }

    setErrorMsg('');
    try {
      await registerUser.mutateAsync({
        displayName: displayName.trim(),
        avatarUrl: avatarUrl.trim(),
      });
      toast.success('Profile created! Welcome to ChatFlow.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create profile. Please try again.';
      setErrorMsg(msg);
      toast.error('Failed to create profile. Please try again.');
    }
  };

  return (
    <div className="flex h-full items-center justify-center bg-chat-bg">
      <div className="w-full max-w-sm mx-4">
        <div className="bg-chat-header border border-chat-border rounded-2xl p-8 shadow-msg">
          {/* Header */}
          <div className="flex flex-col items-center gap-3 mb-8">
            <div className="w-16 h-16 rounded-full bg-teal/20 flex items-center justify-center">
              <User className="w-8 h-8 text-teal" />
            </div>
            <div className="text-center">
              <h2 className="text-xl font-semibold text-foreground">Set up your profile</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Choose a display name to get started
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <Label htmlFor="displayName" className="text-sm font-medium text-foreground/80">
                Display Name *
              </Label>
              <Input
                id="displayName"
                value={displayName}
                onChange={(e) => {
                  setDisplayName(e.target.value);
                  if (errorMsg) setErrorMsg('');
                }}
                placeholder="Your name"
                maxLength={50}
                className="bg-chat-input border-chat-border text-foreground placeholder:text-muted-foreground focus:border-teal focus:ring-teal/20 h-11"
                autoFocus
                disabled={registerUser.isPending}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="avatarUrl" className="text-sm font-medium text-foreground/80">
                Avatar URL{' '}
                <span className="text-muted-foreground font-normal">(optional)</span>
              </Label>
              <Input
                id="avatarUrl"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://example.com/avatar.jpg"
                className="bg-chat-input border-chat-border text-foreground placeholder:text-muted-foreground focus:border-teal focus:ring-teal/20 h-11"
                disabled={registerUser.isPending}
              />
            </div>

            {errorMsg && (
              <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <Button
              type="submit"
              disabled={registerUser.isPending || !displayName.trim()}
              className="w-full h-11 bg-teal hover:bg-teal-dark text-white font-semibold rounded-xl border-0 mt-2"
            >
              {registerUser.isPending ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating…
                </span>
              ) : (
                'Continue'
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

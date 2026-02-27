import { useState, useEffect } from 'react';
import { useUpdateProfile } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useQueryClient } from '@tanstack/react-query';
import type { UserProfile } from '../backend';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowLeft, LogOut, Camera } from 'lucide-react';
import { getInitials } from '../hooks/useQueries';
import { toast } from 'sonner';

interface ProfileSettingsScreenProps {
  onBack: () => void;
  userProfile: UserProfile | null;
}

export default function ProfileSettingsScreen({ onBack, userProfile }: ProfileSettingsScreenProps) {
  const { clear, identity } = useInternetIdentity();
  const queryClient = useQueryClient();
  const updateProfile = useUpdateProfile();

  const [displayName, setDisplayName] = useState(userProfile?.displayName ?? '');
  const [avatarUrl, setAvatarUrl] = useState(userProfile?.avatarUrl ?? '');

  useEffect(() => {
    if (userProfile) {
      setDisplayName(userProfile.displayName);
      setAvatarUrl(userProfile.avatarUrl);
    }
  }, [userProfile]);

  const handleSave = async () => {
    if (!displayName.trim()) {
      toast.error('Display name cannot be empty');
      return;
    }
    try {
      await updateProfile.mutateAsync({
        displayName: displayName.trim(),
        avatarUrl: avatarUrl.trim(),
      });
      toast.success('Profile updated!');
    } catch {
      toast.error('Failed to update profile');
    }
  };

  const handleLogout = async () => {
    await clear();
    queryClient.clear();
  };

  const myPrincipal = identity?.getPrincipal().toString() ?? '';
  const hasChanges =
    displayName.trim() !== (userProfile?.displayName ?? '') ||
    avatarUrl.trim() !== (userProfile?.avatarUrl ?? '');

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-chat-header border-b border-chat-border">
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          className="w-8 h-8 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h2 className="text-base font-semibold text-foreground">Profile Settings</h2>
      </div>

      <ScrollArea className="flex-1">
        <div className="flex flex-col gap-6 p-6">
          {/* Avatar preview */}
          <div className="flex flex-col items-center gap-3">
            <div className="relative">
              <Avatar className="w-24 h-24">
                {avatarUrl && <AvatarImage src={avatarUrl} />}
                <AvatarFallback className="text-2xl font-bold bg-teal/20 text-teal">
                  {displayName ? getInitials(displayName) : '?'}
                </AvatarFallback>
              </Avatar>
              <div className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-teal flex items-center justify-center shadow-msg">
                <Camera className="w-3.5 h-3.5 text-white" />
              </div>
            </div>
            <p className="text-sm font-semibold text-foreground">{userProfile?.displayName}</p>
          </div>

          {/* Form */}
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="displayName" className="text-sm font-medium text-foreground/80">
                Display Name
              </Label>
              <Input
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your name"
                maxLength={50}
                className="bg-chat-input border-chat-border text-foreground placeholder:text-muted-foreground focus:border-teal h-11"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="avatarUrl" className="text-sm font-medium text-foreground/80">
                Avatar URL
              </Label>
              <Input
                id="avatarUrl"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://example.com/avatar.jpg"
                className="bg-chat-input border-chat-border text-foreground placeholder:text-muted-foreground focus:border-teal h-11"
              />
            </div>

            <Button
              onClick={handleSave}
              disabled={updateProfile.isPending || !hasChanges}
              className="w-full h-11 bg-teal hover:bg-teal-dark text-white font-semibold rounded-xl border-0 mt-2"
            >
              {updateProfile.isPending ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving…
                </span>
              ) : (
                'Save Changes'
              )}
            </Button>
          </div>

          {/* Principal ID */}
          <div className="flex flex-col gap-2 p-3 rounded-xl bg-chat-header border border-chat-border">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Your Principal ID
            </p>
            <button
              onClick={() => {
                navigator.clipboard.writeText(myPrincipal);
                toast.success('Copied to clipboard!');
              }}
              className="text-xs font-mono text-teal hover:underline text-left break-all"
            >
              {myPrincipal}
            </button>
            <p className="text-[11px] text-muted-foreground">
              Share this ID with others so they can add you as a contact
            </p>
          </div>

          {/* Logout */}
          <Button
            variant="ghost"
            onClick={handleLogout}
            className="w-full h-11 text-destructive hover:text-destructive hover:bg-destructive/10 border border-destructive/20 rounded-xl"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Log Out
          </Button>
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="px-6 py-3 border-t border-chat-border text-center">
        <p className="text-xs text-muted-foreground">
          Built with{' '}
          <span className="text-teal">♥</span>{' '}
          using{' '}
          <a
            href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname || 'chatflow-app')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-teal hover:underline"
          >
            caffeine.ai
          </a>
        </p>
      </div>
    </div>
  );
}

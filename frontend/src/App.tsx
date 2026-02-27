import { useState } from 'react';
import { useAuthFlow } from './hooks/useAuthFlow';
import LoginScreen from './components/LoginScreen';
import ProfileSetupModal from './components/ProfileSetupModal';
import ChatLayout from './components/ChatLayout';
import { Toaster } from '@/components/ui/sonner';

export default function App() {
  const { isAuthenticated, isInitializing, showProfileSetup, isReady, userProfile } = useAuthFlow();
  const [activeScreen, setActiveScreen] = useState<'chat' | 'contacts' | 'profile'>('chat');

  // Show loading splash while Internet Identity is initializing or while
  // we're waiting for the profile query to settle for an authenticated user.
  if (isInitializing || (isAuthenticated && !isReady)) {
    return (
      <div className="flex h-full items-center justify-center bg-chat-bg">
        <div className="flex flex-col items-center gap-4">
          <img
            src="/assets/generated/chatflow-logo.dim_256x256.png"
            alt="ChatFlow"
            className="w-16 h-16 rounded-2xl opacity-80 animate-pulse"
          />
          <p className="text-muted-foreground text-sm">Loading…</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <>
        <LoginScreen />
        <Toaster />
      </>
    );
  }

  if (showProfileSetup) {
    return (
      <>
        <ProfileSetupModal />
        <Toaster />
      </>
    );
  }

  return (
    <>
      <ChatLayout
        activeScreen={activeScreen}
        setActiveScreen={setActiveScreen}
        userProfile={userProfile ?? null}
      />
      <Toaster />
    </>
  );
}

import { useState } from 'react';
import type { UserProfile, ConversationId } from '../backend';
import ConversationSidebar from './ConversationSidebar';
import MessagePanel from './MessagePanel';
import InfoPanel from './InfoPanel';
import ContactsScreen from './ContactsScreen';
import ProfileSettingsScreen from './ProfileSettingsScreen';

interface ChatLayoutProps {
  activeScreen: 'chat' | 'contacts' | 'profile';
  setActiveScreen: (screen: 'chat' | 'contacts' | 'profile') => void;
  userProfile: UserProfile | null;
}

export default function ChatLayout({ activeScreen, setActiveScreen, userProfile }: ChatLayoutProps) {
  const [activeConversationId, setActiveConversationId] = useState<ConversationId | null>(null);
  const [showInfoPanel, setShowInfoPanel] = useState(false);

  const handleSelectConversation = (id: ConversationId) => {
    setActiveConversationId(id);
    setActiveScreen('chat');
  };

  return (
    <div className="flex h-full bg-chat-bg overflow-hidden">
      {/* Left Sidebar */}
      <div
        className={`
          flex-shrink-0 w-full md:w-[360px] lg:w-[380px] border-r border-chat-border
          bg-chat-sidebar flex flex-col
          ${activeConversationId && activeScreen === 'chat' ? 'hidden md:flex' : 'flex'}
        `}
      >
        {activeScreen === 'contacts' ? (
          <ContactsScreen
            onBack={() => setActiveScreen('chat')}
            onStartConversation={handleSelectConversation}
            userProfile={userProfile}
          />
        ) : activeScreen === 'profile' ? (
          <ProfileSettingsScreen
            onBack={() => setActiveScreen('chat')}
            userProfile={userProfile}
          />
        ) : (
          <ConversationSidebar
            activeConversationId={activeConversationId}
            onSelectConversation={handleSelectConversation}
            onOpenContacts={() => setActiveScreen('contacts')}
            onOpenProfile={() => setActiveScreen('profile')}
            userProfile={userProfile}
          />
        )}
      </div>

      {/* Center Panel */}
      <div
        className={`
          flex-1 flex flex-col min-w-0
          ${!activeConversationId || activeScreen !== 'chat' ? 'hidden md:flex' : 'flex'}
        `}
      >
        {activeConversationId ? (
          <MessagePanel
            conversationId={activeConversationId}
            onBack={() => setActiveConversationId(null)}
            onToggleInfo={() => setShowInfoPanel((v) => !v)}
            showInfoPanel={showInfoPanel}
            userProfile={userProfile}
          />
        ) : (
          <EmptyState />
        )}
      </div>

      {/* Right Info Panel */}
      {showInfoPanel && activeConversationId && (
        <div className="hidden lg:flex flex-shrink-0 w-[300px] border-l border-chat-border bg-chat-sidebar flex-col">
          <InfoPanel
            conversationId={activeConversationId}
            userProfile={userProfile}
            onClose={() => setShowInfoPanel(false)}
          />
        </div>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-4 bg-chat-bg">
      <div className="relative">
        <div className="absolute inset-0 rounded-3xl bg-teal opacity-10 blur-2xl scale-150" />
        <img
          src="/assets/generated/chatflow-logo.dim_256x256.png"
          alt="ChatFlow"
          className="relative w-20 h-20 rounded-2xl opacity-60"
        />
      </div>
      <div className="text-center">
        <h3 className="text-lg font-semibold text-foreground/60">ChatFlow</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Select a conversation to start messaging
        </p>
      </div>
      <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-chat-header border border-chat-border">
        <div className="w-2 h-2 rounded-full bg-teal animate-pulse" />
        <span className="text-xs text-muted-foreground">End-to-end secured</span>
      </div>
    </div>
  );
}

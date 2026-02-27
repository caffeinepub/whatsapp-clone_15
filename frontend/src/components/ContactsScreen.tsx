import { useState } from 'react';
import {
  useGetContacts,
  useAddContact,
  useRemoveContact,
  useCreateConversation,
  useGetUserProfile,
  getInitials,
} from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import type { UserProfile, ConversationId, UserId } from '../backend';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Search, UserPlus, UserMinus, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Principal } from '@dfinity/principal';

interface ContactsScreenProps {
  onBack: () => void;
  onStartConversation: (id: ConversationId) => void;
  userProfile: UserProfile | null;
}

export default function ContactsScreen({ onBack, onStartConversation, userProfile }: ContactsScreenProps) {
  const [search, setSearch] = useState('');
  const [addPrincipal, setAddPrincipal] = useState('');
  const { data: contactIds, isLoading } = useGetContacts();
  const addContact = useAddContact();
  const { identity } = useInternetIdentity();

  const handleAddByPrincipal = async () => {
    const trimmed = addPrincipal.trim();
    if (!trimmed) return;
    try {
      const principal = Principal.fromText(trimmed);
      await addContact.mutateAsync(principal);
      setAddPrincipal('');
      toast.success('Contact added!');
    } catch (err) {
      toast.error('Invalid principal ID or user not found');
    }
  };

  const myPrincipal = identity?.getPrincipal().toString() ?? '';

  const filteredContacts = (contactIds ?? []).filter((id) => id.toString() !== myPrincipal);

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
        <h2 className="text-base font-semibold text-foreground">Contacts</h2>
      </div>

      <ScrollArea className="flex-1">
        <div className="flex flex-col gap-4 p-4">
          {/* Add contact by principal */}
          <div className="flex flex-col gap-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Add Contact
            </p>
            <div className="flex gap-2">
              <Input
                value={addPrincipal}
                onChange={(e) => setAddPrincipal(e.target.value)}
                placeholder="Paste principal ID…"
                className="flex-1 h-9 bg-chat-input border-chat-border text-foreground placeholder:text-muted-foreground text-xs"
                onKeyDown={(e) => e.key === 'Enter' && handleAddByPrincipal()}
              />
              <Button
                onClick={handleAddByPrincipal}
                disabled={!addPrincipal.trim() || addContact.isPending}
                size="sm"
                className="bg-teal hover:bg-teal-dark text-white border-0 h-9 px-3"
              >
                {addContact.isPending ? (
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <UserPlus className="w-4 h-4" />
                )}
              </Button>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Your principal ID:{' '}
              <button
                onClick={() => {
                  navigator.clipboard.writeText(myPrincipal);
                  toast.success('Copied to clipboard!');
                }}
                className="text-teal hover:underline font-mono text-[10px]"
              >
                {myPrincipal.slice(0, 20)}…
              </button>
            </p>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search contacts"
              className="pl-9 h-9 bg-chat-input border-chat-border text-foreground placeholder:text-muted-foreground text-sm rounded-full"
            />
          </div>

          {/* Contact list */}
          <div className="flex flex-col gap-0">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              My Contacts ({filteredContacts.length})
            </p>
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 py-3 border-b border-chat-border/50">
                  <Skeleton className="w-10 h-10 rounded-full bg-chat-header" />
                  <div className="flex-1 flex flex-col gap-1.5">
                    <Skeleton className="h-3.5 w-28 bg-chat-header" />
                    <Skeleton className="h-3 w-40 bg-chat-header" />
                  </div>
                </div>
              ))
            ) : filteredContacts.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-8 text-center">
                <UserPlus className="w-8 h-8 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">No contacts yet</p>
                <p className="text-xs text-muted-foreground/60">
                  Add contacts using their principal ID
                </p>
              </div>
            ) : (
              filteredContacts.map((contactId) => (
                <ContactListItem
                  key={contactId.toString()}
                  contactId={contactId}
                  search={search}
                  onStartConversation={onStartConversation}
                />
              ))
            )}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}

interface ContactListItemProps {
  contactId: UserId;
  search: string;
  onStartConversation: (id: ConversationId) => void;
}

function ContactListItem({ contactId, search, onStartConversation }: ContactListItemProps) {
  const { data: profile, isLoading } = useGetUserProfile(contactId);
  const removeContact = useRemoveContact();
  const createConversation = useCreateConversation();

  if (isLoading) {
    return (
      <div className="flex items-center gap-3 py-3 border-b border-chat-border/50">
        <Skeleton className="w-10 h-10 rounded-full bg-chat-header" />
        <Skeleton className="h-3.5 w-28 bg-chat-header" />
      </div>
    );
  }

  if (!profile) return null;

  if (search && !profile.displayName.toLowerCase().includes(search.toLowerCase())) {
    return null;
  }

  const handleStartConversation = async () => {
    try {
      const convId = await createConversation.mutateAsync({
        participantIds: [contactId],
        isGroup: false,
        groupName: null,
      });
      onStartConversation(convId);
    } catch {
      toast.error('Failed to start conversation');
    }
  };

  const handleRemove = async () => {
    try {
      await removeContact.mutateAsync(contactId);
      toast.success('Contact removed');
    } catch {
      toast.error('Failed to remove contact');
    }
  };

  return (
    <div className="flex items-center gap-3 py-3 border-b border-chat-border/50 group">
      <Avatar className="w-10 h-10 flex-shrink-0">
        {profile.avatarUrl && <AvatarImage src={profile.avatarUrl} />}
        <AvatarFallback className="text-sm font-semibold bg-secondary text-foreground/70">
          {getInitials(profile.displayName)}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground truncate">{profile.displayName}</p>
        <p className="text-xs text-muted-foreground capitalize">{profile.status}</p>
      </div>

      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleStartConversation}
          disabled={createConversation.isPending}
          className="w-8 h-8 text-teal hover:bg-teal/10"
          title="Message"
        >
          {createConversation.isPending ? (
            <span className="w-3.5 h-3.5 border-2 border-teal/30 border-t-teal rounded-full animate-spin" />
          ) : (
            <MessageCircle className="w-4 h-4" />
          )}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleRemove}
          disabled={removeContact.isPending}
          className="w-8 h-8 text-destructive hover:bg-destructive/10"
          title="Remove"
        >
          {removeContact.isPending ? (
            <span className="w-3.5 h-3.5 border-2 border-destructive/30 border-t-destructive rounded-full animate-spin" />
          ) : (
            <UserMinus className="w-4 h-4" />
          )}
        </Button>
      </div>
    </div>
  );
}

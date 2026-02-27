import { useState } from 'react';
import { useGetContacts, useGetUserProfile, useCreateConversation, getInitials } from '../hooks/useQueries';
import type { UserId } from '../backend';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Users } from 'lucide-react';
import { toast } from 'sonner';

interface NewGroupModalProps {
  onClose: () => void;
}

export default function NewGroupModal({ onClose }: NewGroupModalProps) {
  const [groupName, setGroupName] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const { data: contactIds } = useGetContacts();
  const createConversation = useCreateConversation();

  const toggleContact = (id: UserId) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id.toString())) {
        next.delete(id.toString());
      } else {
        next.add(id.toString());
      }
      return next;
    });
  };

  const handleCreate = async () => {
    if (!groupName.trim()) {
      toast.error('Please enter a group name');
      return;
    }
    if (selectedIds.size === 0) {
      toast.error('Please select at least one contact');
      return;
    }

    const participantIds = (contactIds ?? []).filter((id) => selectedIds.has(id.toString()));

    try {
      await createConversation.mutateAsync({
        participantIds,
        isGroup: true,
        groupName: groupName.trim(),
      });
      toast.success(`Group "${groupName}" created!`);
      onClose();
    } catch {
      toast.error('Failed to create group');
    }
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-chat-header border-chat-border text-foreground max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <Users className="w-5 h-5 text-teal" />
            New Group
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="groupName" className="text-sm text-foreground/80">
              Group Name
            </Label>
            <Input
              id="groupName"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Enter group name…"
              className="bg-chat-input border-chat-border text-foreground placeholder:text-muted-foreground h-10"
              autoFocus
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label className="text-sm text-foreground/80">
              Add Participants ({selectedIds.size} selected)
            </Label>
            <ScrollArea className="h-48 rounded-lg border border-chat-border bg-chat-bg">
              {!contactIds || contactIds.length === 0 ? (
                <div className="flex items-center justify-center h-full py-8">
                  <p className="text-sm text-muted-foreground">No contacts to add</p>
                </div>
              ) : (
                <div className="flex flex-col">
                  {contactIds.map((contactId) => (
                    <ContactCheckItem
                      key={contactId.toString()}
                      contactId={contactId}
                      isSelected={selectedIds.has(contactId.toString())}
                      onToggle={() => toggleContact(contactId)}
                    />
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="ghost"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            disabled={createConversation.isPending || !groupName.trim() || selectedIds.size === 0}
            className="bg-teal hover:bg-teal-dark text-white border-0"
          >
            {createConversation.isPending ? (
              <span className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Creating…
              </span>
            ) : (
              'Create Group'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface ContactCheckItemProps {
  contactId: UserId;
  isSelected: boolean;
  onToggle: () => void;
}

function ContactCheckItem({ contactId, isSelected, onToggle }: ContactCheckItemProps) {
  const { data: profile } = useGetUserProfile(contactId);

  if (!profile) return null;

  return (
    <button
      onClick={onToggle}
      className={`
        flex items-center gap-3 px-3 py-2.5 text-left transition-colors border-b border-chat-border/50
        ${isSelected ? 'bg-teal/10' : 'hover:bg-chat-hover'}
      `}
    >
      <Checkbox
        checked={isSelected}
        className="border-chat-border data-[state=checked]:bg-teal data-[state=checked]:border-teal"
        onCheckedChange={onToggle}
      />
      <Avatar className="w-8 h-8">
        {profile.avatarUrl && <AvatarImage src={profile.avatarUrl} />}
        <AvatarFallback className="text-xs font-semibold bg-secondary text-foreground/70">
          {getInitials(profile.displayName)}
        </AvatarFallback>
      </Avatar>
      <span className="text-sm font-medium text-foreground">{profile.displayName}</span>
    </button>
  );
}

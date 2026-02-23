import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, Loader2 } from 'lucide-react';
import { useJournal } from '@/hooks/useJournal';
import { useToast } from '@/hooks/use-toast';
import AddJournalDialog from './AddJournalDialog';
import JournalEntryCard from './JournalEntryCard';
import type { JournalEntry } from '@/types/journal';

export default function MemoryJournal() {
  const { toast } = useToast();
  const { entries, loading, addEntry, updateEntry, deleteEntry, uploadImage, uploadAudio } = useJournal();
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleSave = async (params: {
    title: string;
    content?: string;
    image_urls?: string[];
    audio_url?: string;
    tags?: string[];
  }) => {
    try {
      if (editingEntry) {
        await updateEntry(editingEntry.id, params);
        toast({ title: 'Entry updated', description: 'Your journal entry has been updated.' });
      } else {
        await addEntry(params);
        toast({ title: 'Entry added', description: 'Your journal entry has been saved.' });
      }
      setEditingEntry(null);
    } catch (e) {
      console.error(e);
      toast({
        title: 'Could not save entry',
        description: e instanceof Error ? e.message : 'Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (entry: JournalEntry) => {
    setEditingEntry(entry);
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteEntry(id);
      toast({ title: 'Entry deleted', description: 'Your journal entry has been deleted.' });
    } catch (e) {
      console.error(e);
      toast({ title: 'Delete failed', variant: 'destructive' });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Memory journal
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="animate-fade-in">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Memory journal
            </CardTitle>
            <CardDescription>
              Store notes, photos, and voice recordings to help you remember important moments and information.
            </CardDescription>
          </div>
          <AddJournalDialog
            onSave={(params) => {
              return handleSave(params).then(() => {
                setEditingEntry(null);
                setDialogOpen(false);
              });
            }}
            onUploadImage={uploadImage}
            onUploadAudio={uploadAudio}
            editingEntry={editingEntry}
            open={dialogOpen}
            onOpenChange={(open) => {
              setDialogOpen(open);
              if (!open) setEditingEntry(null);
            }}
            triggerLabel="Add entry"
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {entries.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-sm">No journal entries yet</p>
            <p className="text-xs mt-2">Start documenting your memories, notes, and important moments</p>
            <div className="mt-4">
              <AddJournalDialog
                onSave={(params) => {
                  return handleSave(params).then(() => setDialogOpen(false));
                }}
                onUploadImage={uploadImage}
                onUploadAudio={uploadAudio}
                open={dialogOpen && !editingEntry}
                onOpenChange={setDialogOpen}
                triggerLabel="Add your first entry"
              />
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {entries.map((entry) => (
              <JournalEntryCard
                key={entry.id}
                entry={entry}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

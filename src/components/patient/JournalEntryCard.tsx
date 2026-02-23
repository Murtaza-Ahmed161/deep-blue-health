import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trash2, Edit2, Image as ImageIcon, Mic, Play, Pause, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import type { JournalEntry } from '@/types/journal';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface JournalEntryCardProps {
  entry: JournalEntry;
  onEdit: (entry: JournalEntry) => void;
  onDelete: (id: string) => void;
}

export default function JournalEntryCard({ entry, onEdit, onDelete }: JournalEntryCardProps) {
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);

  const toggleAudio = () => {
    if (audioElement) {
      if (audioPlaying) {
        audioElement.pause();
        setAudioPlaying(false);
      } else {
        audioElement.play();
        setAudioPlaying(true);
      }
    } else if (entry.audio_url) {
      const audio = new Audio(entry.audio_url);
      audio.onended = () => setAudioPlaying(false);
      audio.onpause = () => setAudioPlaying(false);
      setAudioElement(audio);
      audio.play();
      setAudioPlaying(true);
    }
  };

  return (
    <Card className="animate-fade-in">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg mb-1">{entry.title}</h3>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
              <Calendar className="h-3 w-3" />
              {format(new Date(entry.created_at), 'PPP')}
            </div>
          </div>
          <div className="flex gap-1 shrink-0">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(entry)}>
              <Edit2 className="h-4 w-4" />
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete journal entry?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete &quot;{entry.title}&quot; and all associated images/audio. This cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    onClick={() => onDelete(entry.id)}
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        {entry.content && (
          <p className="text-sm text-foreground whitespace-pre-wrap">{entry.content}</p>
        )}

        {entry.image_urls && entry.image_urls.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <ImageIcon className="h-3 w-3" />
              <span>{entry.image_urls.length} image{entry.image_urls.length !== 1 ? 's' : ''}</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {entry.image_urls.map((url, idx) => (
                <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-border bg-muted">
                  <img src={url} alt={`${entry.title} - Image ${idx + 1}`} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>
        )}

        {entry.audio_url && (
          <div className="flex items-center gap-2 p-2 rounded-lg bg-muted border border-border">
            <Button variant="outline" size="sm" onClick={toggleAudio} className="shrink-0">
              {audioPlaying ? (
                <>
                  <Pause className="h-4 w-4 mr-2" />
                  Pause
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Play
                </>
              )}
            </Button>
            <div className="flex items-center gap-1 text-xs text-muted-foreground flex-1">
              <Mic className="h-3 w-3" />
              <span>Voice recording</span>
            </div>
          </div>
        )}

        {entry.tags && entry.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {entry.tags.map((tag, idx) => (
              <Badge key={idx} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

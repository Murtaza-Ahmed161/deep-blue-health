import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Plus, Image as ImageIcon, Mic, X, Loader2, Play, Square } from 'lucide-react';
import type { JournalEntry } from '@/types/journal';

interface AddJournalDialogProps {
  onSave: (params: {
    title: string;
    content?: string;
    image_urls?: string[];
    audio_url?: string;
    tags?: string[];
  }) => Promise<unknown>;
  onUploadImage?: (file: File) => Promise<string>;
  onUploadAudio?: (file: File) => Promise<string>;
  editingEntry?: JournalEntry | null;
  disabled?: boolean;
  triggerLabel?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export default function AddJournalDialog({
  onSave,
  onUploadImage,
  onUploadAudio,
  editingEntry,
  disabled,
  triggerLabel = 'Add entry',
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: AddJournalDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = controlledOnOpenChange || setInternalOpen;
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [recording, setRecording] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      if (editingEntry) {
        setTitle(editingEntry.title);
        setContent(editingEntry.content || '');
        setTags(editingEntry.tags?.join(', ') || '');
        setImageUrls(editingEntry.image_urls || []);
        setAudioUrl(editingEntry.audio_url || null);
        setImages([]);
        setAudioBlob(null);
      } else {
        resetForm();
      }
    }
  }, [editingEntry, open]);

  const resetForm = () => {
    setTitle('');
    setContent('');
    setTags('');
    setImages([]);
    setImageUrls([]);
    setAudioBlob(null);
    setAudioUrl(null);
    setRecording(false);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setImages((prev) => [...prev, ...files]);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) {
          setImageUrls((prev) => [...prev, ev.target!.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
    e.target.value = ''; // Allow selecting the same file again
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setImageUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
      alert('Could not access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    setUploadingImages(true);
    try {
      let finalImageUrls = editingEntry?.image_urls || [];
      if (images.length > 0 && onUploadImage) {
        const uploadPromises = images.map((file) => onUploadImage(file));
        const uploadedUrls = await Promise.all(uploadPromises);
        finalImageUrls = [...finalImageUrls, ...uploadedUrls];
      }
      let finalAudioUrl = editingEntry?.audio_url || null;
      if (audioBlob && !editingEntry?.audio_url && onUploadAudio) {
        const file = new File([audioBlob], 'recording.webm', { type: 'audio/webm' });
        finalAudioUrl = await onUploadAudio(file);
      }
      const tagArray = tags.split(',').map((t) => t.trim()).filter(Boolean);
      await onSave({
        title: title.trim(),
        content: content.trim() || undefined,
        image_urls: finalImageUrls.length > 0 ? finalImageUrls : undefined,
        audio_url: finalAudioUrl || undefined,
        tags: tagArray.length > 0 ? tagArray : undefined,
      });
      resetForm();
      setOpen(false);
    } catch (error) {
      console.error('Error saving entry:', error);
      alert(error instanceof Error ? error.message : 'Failed to save entry');
    } finally {
      setSaving(false);
      setUploadingImages(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" disabled={disabled}>
          <Plus className="h-4 w-4 mr-2" />
          {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingEntry ? 'Edit journal entry' : 'Add journal entry'}</DialogTitle>
          <DialogDescription>
            Store notes, photos, and voice recordings to help you remember important moments and information.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="journal-title">Title</Label>
            <Input
              id="journal-title"
              placeholder="e.g. Doctor visit, Family gathering"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="journal-content">Notes</Label>
            <Textarea
              id="journal-content"
              placeholder="Write your notes here..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
              className="resize-none"
            />
          </div>
          <div className="space-y-2">
            <Label>Images</Label>
            <div className="flex items-center gap-2">
              <Input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageSelect}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
              >
                <ImageIcon className="h-4 w-4 mr-2" />
                Add photos
              </Button>
            </div>
            {imageUrls.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mt-2">
                {imageUrls.map((url, idx) => (
                  <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-border">
                    <img src={url} alt={`Preview ${idx + 1}`} className="w-full h-full object-cover" />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-1 right-1 h-6 w-6"
                      onClick={() => removeImage(idx)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="space-y-2">
            <Label>Voice recording</Label>
            <div className="flex items-center gap-2">
              {!recording && !audioUrl ? (
                <Button type="button" variant="outline" size="sm" onClick={startRecording}>
                  <Mic className="h-4 w-4 mr-2" />
                  Start recording
                </Button>
              ) : recording ? (
                <Button type="button" variant="destructive" size="sm" onClick={stopRecording}>
                  <Square className="h-4 w-4 mr-2" />
                  Stop recording
                </Button>
              ) : (
                <div className="flex items-center gap-2 flex-1">
                  <Button type="button" variant="outline" size="sm" onClick={() => {
                    const audio = new Audio(audioUrl!);
                    audio.play();
                  }}>
                    <Play className="h-4 w-4 mr-2" />
                    Play
                  </Button>
                  <Button type="button" variant="ghost" size="sm" onClick={() => {
                    setAudioUrl(null);
                    setAudioBlob(null);
                  }}>
                    Remove
                  </Button>
                </div>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="journal-tags">Tags (comma-separated)</Label>
            <Input
              id="journal-tags"
              placeholder="e.g. family, medical, important"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
            />
          </div>
          <Button type="submit" className="w-full" disabled={saving || uploadingImages}>
            {saving || uploadingImages ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {uploadingImages ? 'Uploading...' : 'Saving...'}
              </>
            ) : (
              editingEntry ? 'Update entry' : 'Save entry'
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

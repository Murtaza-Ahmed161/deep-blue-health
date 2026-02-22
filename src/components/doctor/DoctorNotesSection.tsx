import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { FileText, Save, Clock, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface DoctorNote {
  id: string;
  doctor_id: string;
  patient_id: string;
  note: string;
  created_at: string;
  updated_at: string;
  doctor_name?: string;
  doctor_specialty?: string;
}

interface DoctorNotesSectionProps {
  patientId: string;
  isDoctor: boolean;
}

const DoctorNotesSection = ({ patientId, isDoctor }: DoctorNotesSectionProps) => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [notes, setNotes] = useState<DoctorNote[]>([]);
  const [newNote, setNewNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchNotes();
  }, [patientId]);

  const fetchNotes = async () => {
    try {
      setLoading(true);
      
      // Fetch notes with doctor information
      const { data: notesData, error: notesError } = await supabase
        .from('consultations')
        .select(`
          id,
          doctor_id,
          patient_id,
          doctor_notes,
          created_at,
          updated_at
        `)
        .eq('patient_id', patientId)
        .not('doctor_notes', 'is', null)
        .order('created_at', { ascending: false });

      if (notesError) throw notesError;

      // Fetch doctor profiles for the notes
      if (notesData && notesData.length > 0) {
        const doctorIds = [...new Set(notesData.map(n => n.doctor_id).filter(Boolean))];
        
        const { data: doctorsData, error: doctorsError } = await supabase
          .from('profiles')
          .select('id, full_name, specialty')
          .in('id', doctorIds);

        if (doctorsError) throw doctorsError;

        // Combine notes with doctor info
        const notesWithDoctors = notesData.map(note => ({
          id: note.id,
          doctor_id: note.doctor_id || '',
          patient_id: note.patient_id,
          note: note.doctor_notes || '',
          created_at: note.created_at,
          updated_at: note.updated_at,
          doctor_name: doctorsData?.find(d => d.id === note.doctor_id)?.full_name || 'Unknown Doctor',
          doctor_specialty: doctorsData?.find(d => d.id === note.doctor_id)?.specialty || undefined
        }));

        setNotes(notesWithDoctors);
      } else {
        setNotes([]);
      }
    } catch (error) {
      console.error('Error fetching notes:', error);
      toast({
        title: 'Error',
        description: 'Failed to load doctor notes',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNote = async () => {
    if (!user || !isDoctor || !newNote.trim()) return;

    try {
      setSaving(true);

      // Create a new consultation entry with doctor notes
      const { error } = await supabase
        .from('consultations')
        .insert({
          patient_id: patientId,
          doctor_id: user.id,
          consultation_type: 'note',
          status: 'completed',
          doctor_notes: newNote.trim()
        });

      if (error) throw error;

      toast({
        title: 'Note Saved',
        description: 'Your note has been added to the patient record'
      });

      setNewNote('');
      fetchNotes(); // Refresh notes list
    } catch (error) {
      console.error('Error saving note:', error);
      toast({
        title: 'Error',
        description: 'Failed to save note',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Doctor Notes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="animate-fade-in">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Doctor Notes
        </CardTitle>
        <CardDescription>
          {isDoctor 
            ? 'Add notes and observations for this patient'
            : 'Notes and recommendations from your healthcare provider'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add New Note (Doctor Only) */}
        {isDoctor && (
          <div className="space-y-3 p-4 bg-muted rounded-lg">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Add New Note</h4>
              <Badge variant="outline">
                <User className="h-3 w-3 mr-1" />
                {profile?.full_name || 'Doctor'}
              </Badge>
            </div>
            <Textarea
              placeholder="Enter your clinical notes, observations, or recommendations..."
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              rows={4}
              className="resize-none"
            />
            <div className="flex justify-end">
              <Button
                onClick={handleSaveNote}
                disabled={!newNote.trim() || saving}
                size="sm"
                className="btn-press"
              >
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : 'Save Note'}
              </Button>
            </div>
          </div>
        )}

        {/* Notes List */}
        {notes.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-sm">No doctor notes yet</p>
            {isDoctor && (
              <p className="text-xs mt-2">Add your first note above</p>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {notes.map((note, index) => (
              <div key={note.id} className="animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                {index > 0 && <Separator className="my-4" />}
                <div className="space-y-2">
                  {/* Note Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{note.doctor_name}</p>
                        {note.doctor_specialty && (
                          <p className="text-xs text-muted-foreground">{note.doctor_specialty}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {format(new Date(note.created_at), 'MMM dd, yyyy HH:mm')}
                    </div>
                  </div>

                  {/* Note Content */}
                  <div className="pl-10">
                    <p className="text-sm whitespace-pre-wrap">{note.note}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DoctorNotesSection;

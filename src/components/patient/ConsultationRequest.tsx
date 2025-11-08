import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, Video, MessageSquare, Phone, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ConsultationRequest = () => {
  const [consultationType, setConsultationType] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [consultations, setConsultations] = useState<any[]>([]);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!consultationType || !notes.trim()) {
      toast({
        title: "Missing information",
        description: "Please select a consultation type and add notes",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('consultations')
        .insert({
          patient_id: user.id,
          consultation_type: consultationType,
          patient_notes: notes,
          status: 'pending'
        });

      if (error) throw error;

      toast({
        title: "Consultation requested",
        description: "A doctor will review your request soon",
      });

      setNotes('');
      setConsultationType('');
      loadConsultations();
    } catch (error: any) {
      console.error('Error requesting consultation:', error);
      toast({
        title: "Request failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadConsultations = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('consultations')
      .select('*')
      .eq('patient_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5);

    if (!error && data) {
      setConsultations(data);
    }
  };

  useState(() => {
    loadConsultations();
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'video': return <Video className="h-4 w-4" />;
      case 'phone': return <Phone className="h-4 w-4" />;
      case 'chat': return <MessageSquare className="h-4 w-4" />;
      default: return <User className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'default';
      case 'completed': return 'success';
      case 'cancelled': return 'destructive';
      default: return 'secondary';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          Doctor Consultation
        </CardTitle>
        <CardDescription>Request a consultation with a healthcare provider</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Consultation Type</label>
          <Select value={consultationType} onValueChange={setConsultationType}>
            <SelectTrigger>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="video">
                <div className="flex items-center gap-2">
                  <Video className="h-4 w-4" />
                  Video Call
                </div>
              </SelectItem>
              <SelectItem value="phone">
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Phone Call
                </div>
              </SelectItem>
              <SelectItem value="chat">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Chat
                </div>
              </SelectItem>
              <SelectItem value="in_person">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  In-Person
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Your Concerns/Questions</label>
          <Textarea
            placeholder="Describe your symptoms, concerns, or questions..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
          />
        </div>

        <Button 
          onClick={handleSubmit} 
          disabled={loading || !consultationType || !notes.trim()}
          className="w-full"
        >
          {loading ? 'Submitting...' : 'Request Consultation'}
        </Button>

        {consultations.length > 0 && (
          <div className="space-y-2 pt-4 border-t">
            <h4 className="text-sm font-medium">Recent Requests</h4>
            {consultations.map((consultation) => (
              <div
                key={consultation.id}
                className="flex items-center justify-between p-3 border border-border rounded-lg"
              >
                <div className="flex items-center gap-3 flex-1">
                  {getTypeIcon(consultation.consultation_type)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium capitalize">{consultation.consultation_type}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(consultation.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <Badge variant={getStatusColor(consultation.status) as any}>
                  {consultation.status}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ConsultationRequest;
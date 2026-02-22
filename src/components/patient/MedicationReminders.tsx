import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Pill, Plus, Clock, Check, X, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface MedicationReminder {
  id: string;
  medication_name: string;
  dosage: string;
  frequency: string;
  time_of_day: string;
  notes: string | null;
  is_active: boolean;
  created_at: string;
}

interface MedicationLog {
  id: string;
  reminder_id: string;
  scheduled_time: string;
  taken_at: string | null;
  status: 'pending' | 'taken' | 'skipped' | 'missed';
  medication_name?: string;
}

const MedicationReminders = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [reminders, setReminders] = useState<MedicationReminder[]>([]);
  const [todayLogs, setTodayLogs] = useState<MedicationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  
  // Form state
  const [medicationName, setMedicationName] = useState('');
  const [dosage, setDosage] = useState('');
  const [frequency, setFrequency] = useState('daily');
  const [timeOfDay, setTimeOfDay] = useState('09:00');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (user) {
      fetchReminders();
      fetchTodayLogs();
    }
  }, [user]);

  const fetchReminders = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('medication_reminders')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('time_of_day', { ascending: true });

      if (error) throw error;
      setReminders(data || []);
    } catch (error) {
      console.error('Error fetching reminders:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTodayLogs = async () => {
    if (!user) return;

    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const { data, error } = await supabase
        .from('medication_logs')
        .select('*')
        .eq('user_id', user.id)
        .gte('scheduled_time', today.toISOString())
        .order('scheduled_time', { ascending: true });

      if (error) throw error;
      setTodayLogs(data || []);
    } catch (error) {
      console.error('Error fetching logs:', error);
    }
  };

  const handleAddReminder = async () => {
    if (!user || !medicationName || !dosage) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in medication name and dosage',
        variant: 'destructive'
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('medication_reminders')
        .insert({
          user_id: user.id,
          medication_name: medicationName,
          dosage,
          frequency,
          time_of_day: timeOfDay,
          notes: notes || null
        });

      if (error) throw error;

      toast({
        title: 'Reminder Added',
        description: `${medicationName} reminder has been set`
      });

      // Reset form
      setMedicationName('');
      setDosage('');
      setFrequency('daily');
      setTimeOfDay('09:00');
      setNotes('');
      setDialogOpen(false);

      fetchReminders();
    } catch (error) {
      console.error('Error adding reminder:', error);
      toast({
        title: 'Error',
        description: 'Failed to add reminder',
        variant: 'destructive'
      });
    }
  };

  const handleMarkAsTaken = async (reminderId: string, medicationName: string) => {
    if (!user) return;

    try {
      const now = new Date();
      
      const { error } = await supabase
        .from('medication_logs')
        .insert({
          reminder_id: reminderId,
          user_id: user.id,
          scheduled_time: now.toISOString(),
          taken_at: now.toISOString(),
          status: 'taken'
        });

      if (error) throw error;

      toast({
        title: 'Marked as Taken',
        description: `${medicationName} logged successfully`
      });

      fetchTodayLogs();
    } catch (error) {
      console.error('Error logging medication:', error);
    }
  };

  const handleDeleteReminder = async (id: string, name: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('medication_reminders')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Reminder Removed',
        description: `${name} reminder has been removed`
      });

      fetchReminders();
    } catch (error) {
      console.error('Error deleting reminder:', error);
    }
  };

  const getFrequencyLabel = (freq: string) => {
    const labels: Record<string, string> = {
      daily: 'Daily',
      twice_daily: 'Twice Daily',
      three_times_daily: '3x Daily',
      weekly: 'Weekly',
      as_needed: 'As Needed'
    };
    return labels[freq] || freq;
  };

  const getDosesForFrequency = (frequency: string): number => {
    const dosesMap: Record<string, number> = {
      daily: 1,
      twice_daily: 2,
      three_times_daily: 3,
      weekly: 1,
      as_needed: 0 // No fixed count
    };
    return dosesMap[frequency] || 1;
  };

  const getTakenCount = (reminderId: string): number => {
    return todayLogs.filter(log => log.reminder_id === reminderId && log.status === 'taken').length;
  };

  const isFullyTakenToday = (reminderId: string, frequency: string): boolean => {
    if (frequency === 'as_needed') return false; // Never fully taken for as-needed
    const requiredDoses = getDosesForFrequency(frequency);
    const takenCount = getTakenCount(reminderId);
    return takenCount >= requiredDoses;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Medication Reminders</CardTitle>
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
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Pill className="h-5 w-5" />
              Medication Reminders
            </CardTitle>
            <CardDescription>Manage your medication schedule</CardDescription>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Reminder
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Medication Reminder</DialogTitle>
                <DialogDescription>Set up a new medication reminder</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="medication">Medication Name</Label>
                  <Input
                    id="medication"
                    placeholder="e.g., Aspirin"
                    value={medicationName}
                    onChange={(e) => setMedicationName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dosage">Dosage</Label>
                  <Input
                    id="dosage"
                    placeholder="e.g., 100mg"
                    value={dosage}
                    onChange={(e) => setDosage(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="frequency">Frequency</Label>
                  <Select value={frequency} onValueChange={setFrequency}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="twice_daily">Twice Daily</SelectItem>
                      <SelectItem value="three_times_daily">3x Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="as_needed">As Needed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="time">Time</Label>
                  <Input
                    id="time"
                    type="time"
                    value={timeOfDay}
                    onChange={(e) => setTimeOfDay(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    placeholder="e.g., Take with food"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={2}
                  />
                </div>
                <Button onClick={handleAddReminder} className="w-full">
                  Add Reminder
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {reminders.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Pill className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-sm">No medication reminders set</p>
            <p className="text-xs mt-2">Add your first reminder to get started</p>
          </div>
        ) : (
          <div className="space-y-3">
            {reminders.map((reminder, index) => {
              const requiredDoses = getDosesForFrequency(reminder.frequency);
              const takenCount = getTakenCount(reminder.id);
              const fullyTaken = isFullyTakenToday(reminder.id, reminder.frequency);
              const isAsNeeded = reminder.frequency === 'as_needed';
              
              return (
                <div
                  key={reminder.id}
                  className="flex items-center justify-between p-4 rounded-lg border border-border bg-background card-hover animate-fade-in"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium">{reminder.medication_name}</p>
                      <Badge variant="outline" className="text-xs">
                        {reminder.dosage}
                      </Badge>
                      {!isAsNeeded && takenCount > 0 && (
                        <Badge 
                          variant={fullyTaken ? "default" : "secondary"} 
                          className={fullyTaken ? "text-xs bg-green-500" : "text-xs"}
                        >
                          {fullyTaken ? (
                            <>
                              <Check className="h-3 w-3 mr-1" />
                              Complete
                            </>
                          ) : (
                            `${takenCount}/${requiredDoses} taken`
                          )}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {reminder.time_of_day}
                      </span>
                      <span>{getFrequencyLabel(reminder.frequency)}</span>
                    </div>
                    {reminder.notes && (
                      <p className="text-xs text-muted-foreground mt-1">{reminder.notes}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {(!fullyTaken || isAsNeeded) && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="btn-press"
                        onClick={() => handleMarkAsTaken(reminder.id, reminder.medication_name)}
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Take
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="btn-press"
                      onClick={() => handleDeleteReminder(reminder.id, reminder.medication_name)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MedicationReminders;

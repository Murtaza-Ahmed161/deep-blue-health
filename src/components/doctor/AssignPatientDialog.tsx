import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Search, User, UserPlus, Loader2 } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { useToast } from "@/hooks/use-toast";
import { AssignPatientDialogProps } from '@/types/doctor';

interface AvailablePatient {
  id: string;
  name: string;
  email: string;
  hasActiveAssignment: boolean; // Should always be false for unassigned patients
}

const AssignPatientDialog: React.FC<AssignPatientDialogProps> = ({
  open,
  onClose,
  onAssign,
  availablePatients: propPatients
}) => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);
  const [availablePatients, setAvailablePatients] = useState<AvailablePatient[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch available patients when dialog opens
  useEffect(() => {
    if (open) {
      fetchAvailablePatients();
    }
  }, [open]);

  const fetchAvailablePatients = async () => {
    try {
      setLoading(true);

      // Get all patients
      const { data: patientRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'patient');

      if (rolesError) {
        console.error('Error fetching patient roles:', rolesError);
        toast({
          title: "Error",
          description: "Failed to load patient roles",
          variant: "destructive"
        });
        return;
      }

      const patientIds = (patientRoles || []).map(r => r.user_id);

      if (patientIds.length === 0) {
        setAvailablePatients([]);
        return;
      }

      // Get patient profiles
      const { data: patientProfiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', patientIds);

      if (profilesError) {
        console.error('Error fetching patient profiles:', profilesError);
        toast({
          title: "Error",
          description: "Failed to load patient profiles",
          variant: "destructive"
        });
        return;
      }

      // Get current active assignments to filter out assigned patients
      const { data: assignments, error: assignmentError } = await supabase
        .from('patient_doctor_assignments')
        .select('patient_id')
        .eq('status', 'active');

      if (assignmentError) {
        console.error('Error fetching assignments:', assignmentError);
        // Don't return here - we can still show patients even if assignment check fails
      }

      // Create set of assigned patient IDs for quick lookup
      const assignedPatientIds = new Set((assignments || []).map(a => a.patient_id));

      // Filter to only unassigned patients
      const unassignedPatients: AvailablePatient[] = (patientProfiles || [])
        .filter(profile => !assignedPatientIds.has(profile.id))
        .map(profile => ({
          id: profile.id,
          name: profile.full_name || 'Unknown Patient',
          email: profile.email,
          hasActiveAssignment: false // These are all unassigned
        }));

      setAvailablePatients(unassignedPatients);
      setAvailablePatients(unassignedPatients);

    } catch (error) {
      console.error('Error fetching available patients:', error);
      toast({
        title: "Error",
        description: "Failed to load available patients",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredPatients = availablePatients.filter(patient =>
    patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAssign = async () => {
    if (!selectedPatientId) {
      toast({
        title: "Validation Error",
        description: "Please select a patient to assign",
        variant: "destructive"
      });
      return;
    }

    setIsAssigning(true);
    try {
      await onAssign(selectedPatientId, notes.trim() || undefined);
      
      toast({
        title: "Patient Assigned",
        description: "Patient has been successfully assigned to you",
      });

      // Reset form
      setSelectedPatientId('');
      setNotes('');
      setSearchTerm('');
      onClose();
    } catch (error) {
      console.error('Error assigning patient:', error);
      toast({
        title: "Assignment Failed",
        description: error instanceof Error ? error.message : "Failed to assign patient",
        variant: "destructive"
      });
    } finally {
      setIsAssigning(false);
    }
  };

  const selectedPatient = availablePatients.find(p => p.id === selectedPatientId);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Assign Patient
          </DialogTitle>
          <DialogDescription>
            Select an unassigned patient to assign to your care. You can add notes about the assignment.
            <br />
            <span className="text-xs text-muted-foreground">
              Only showing patients who are not currently assigned to any doctor.
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Search */}
          <div className="space-y-2">
            <Label htmlFor="search">Search Patients</Label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="search"
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Patient List */}
          <div className="space-y-2">
            <Label>Available Patients</Label>
            <div className="border rounded-lg max-h-60 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span className="ml-2">Loading patients...</span>
                </div>
              ) : filteredPatients.length === 0 ? (
                <div className="text-center p-8 text-muted-foreground">
                  <User className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">
                    {searchTerm ? 'No unassigned patients match your search' : 'No unassigned patients available'}
                  </p>
                  <p className="text-xs mt-1">
                    All patients may already be assigned to doctors
                  </p>
                </div>
              ) : (
                <div className="space-y-1 p-2">
                  {filteredPatients.map((patient) => (
                    <div
                      key={patient.id}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedPatientId === patient.id
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:bg-muted'
                      }`}
                      onClick={() => setSelectedPatientId(patient.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium">{patient.name}</p>
                            <Badge variant="outline" className="text-xs">
                              Unassigned
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{patient.email}</p>
                        </div>
                        <div className="ml-4">
                          <div className={`w-4 h-4 rounded-full border-2 ${
                            selectedPatientId === patient.id
                              ? 'border-primary bg-primary'
                              : 'border-muted-foreground'
                          }`} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Selected Patient Info */}
          {selectedPatient && (
            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-medium mb-2">Selected Patient</h4>
              <div className="space-y-1 text-sm">
                <p><strong>Name:</strong> {selectedPatient.name}</p>
                <p><strong>Email:</strong> {selectedPatient.email}</p>
                <p className="text-green-600">
                  <strong>Status:</strong> Available for assignment
                </p>
              </div>
            </div>
          )}

          {/* Assignment Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Assignment Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Add any notes about this assignment..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={onClose} disabled={isAssigning}>
            Cancel
          </Button>
          <Button 
            onClick={handleAssign} 
            disabled={!selectedPatientId || isAssigning}
          >
            {isAssigning ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Assigning...
              </>
            ) : (
              <>
                <UserPlus className="mr-2 h-4 w-4" />
                Assign Patient
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AssignPatientDialog;
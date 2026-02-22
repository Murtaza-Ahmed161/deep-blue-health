import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertTriangle, Save, Phone, Mail, User, CheckCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from '@/integrations/supabase/client';
import { useToast } from "@/hooks/use-toast";

const EmergencyContactSettings = () => {
  const { profile, refreshProfile } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    emergency_contact_name: profile?.emergency_contact_name || '',
    emergency_contact_phone: profile?.emergency_contact_phone || '',
    emergency_contact_relationship: profile?.emergency_contact_relationship || ''
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    if (!profile?.id) return;

    // Validation
    if (!formData.emergency_contact_name.trim()) {
      toast({
        title: "Validation Error",
        description: "Emergency contact name is required.",
        variant: "destructive"
      });
      return;
    }

    if (!formData.emergency_contact_phone.trim()) {
      toast({
        title: "Validation Error", 
        description: "Emergency contact phone number is required.",
        variant: "destructive"
      });
      return;
    }

    // Basic phone validation
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    if (!phoneRegex.test(formData.emergency_contact_phone.replace(/[\s\-\(\)]/g, ''))) {
      toast({
        title: "Validation Error",
        description: "Please enter a valid phone number.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          emergency_contact_name: formData.emergency_contact_name.trim(),
          emergency_contact_phone: formData.emergency_contact_phone.trim(),
          emergency_contact_relationship: formData.emergency_contact_relationship.trim() || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', profile.id);

      if (error) {
        throw error;
      }

      // Refresh profile to get updated data
      await refreshProfile();

      toast({
        title: "Settings Saved",
        description: "Emergency contact information updated successfully.",
      });

    } catch (error) {
      console.error('Error updating emergency contact:', error);
      toast({
        title: "Save Failed",
        description: "Failed to update emergency contact information. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const hasChanges = 
    formData.emergency_contact_name !== (profile?.emergency_contact_name || '') ||
    formData.emergency_contact_phone !== (profile?.emergency_contact_phone || '') ||
    formData.emergency_contact_relationship !== (profile?.emergency_contact_relationship || '');

  const isComplete = formData.emergency_contact_name.trim() && formData.emergency_contact_phone.trim();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-destructive" />
          Emergency Contact Settings
        </CardTitle>
        <CardDescription>
          Configure who to notify in case of a medical emergency. This person will receive immediate alerts when you trigger an emergency.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Status Indicator */}
        <div className={`p-4 rounded-lg border ${
          isComplete ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'
        }`}>
          <div className="flex items-center gap-2">
            {isComplete ? (
              <CheckCircle className="h-5 w-5 text-green-600" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
            )}
            <span className={`font-medium ${
              isComplete ? 'text-green-800' : 'text-yellow-800'
            }`}>
              {isComplete ? 'Emergency contact configured' : 'Emergency contact setup required'}
            </span>
          </div>
          {!isComplete && (
            <p className="text-sm text-yellow-700 mt-1">
              You must configure an emergency contact before using the emergency alert system.
            </p>
          )}
        </div>

        {/* Form Fields */}
        <div className="grid gap-4">
          <div className="space-y-2">
            <Label htmlFor="emergency_contact_name" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Emergency Contact Name *
            </Label>
            <Input
              id="emergency_contact_name"
              placeholder="e.g., John Smith, Mom, Dr. Johnson"
              value={formData.emergency_contact_name}
              onChange={(e) => handleInputChange('emergency_contact_name', e.target.value)}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="emergency_contact_phone" className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              Phone Number *
            </Label>
            <Input
              id="emergency_contact_phone"
              type="tel"
              placeholder="e.g., +1 (555) 123-4567"
              value={formData.emergency_contact_phone}
              onChange={(e) => handleInputChange('emergency_contact_phone', e.target.value)}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="emergency_contact_relationship" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Relationship (Optional)
            </Label>
            <Input
              id="emergency_contact_relationship"
              placeholder="e.g., Spouse, Parent, Doctor, Friend"
              value={formData.emergency_contact_relationship}
              onChange={(e) => handleInputChange('emergency_contact_relationship', e.target.value)}
              className="w-full"
            />
          </div>
        </div>

        {/* Current Contact Info */}
        {profile?.emergency_contact_name && (
          <div className="bg-muted p-4 rounded-lg">
            <h4 className="font-medium mb-2">Current Emergency Contact</h4>
            <div className="space-y-1 text-sm">
              <p><strong>Name:</strong> {profile.emergency_contact_name}</p>
              {profile.emergency_contact_phone && (
                <p><strong>Phone:</strong> {profile.emergency_contact_phone}</p>
              )}
              {profile.emergency_contact_relationship && (
                <p><strong>Relationship:</strong> {profile.emergency_contact_relationship}</p>
              )}
              <p><strong>Email:</strong> {profile.email} (your account email will be used)</p>
            </div>
          </div>
        )}

        {/* Important Notice */}
        <div className="bg-blue-50 border border-blue-200 dark:bg-blue-950 dark:border-blue-800 p-4 rounded-lg">
          <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Pakistan Emergency Services</h4>
          <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
            <li>• <strong>115</strong> - National Ambulance Service</li>
            <li>• <strong>1122</strong> - Rescue Services (Punjab, KP, Balochistan)</li>
            <li>• <strong>1021</strong> - Edhi Ambulance (Nationwide 24/7)</li>
          </ul>
        </div>

        <div className="bg-destructive/10 border border-destructive/20 p-4 rounded-lg">
          <h4 className="font-medium text-destructive mb-2">Important Notice</h4>
          <ul className="text-sm text-destructive space-y-1">
            <li>• Emergency alerts are sent via email to your account email address</li>
            <li>• This system does NOT contact emergency services directly</li>
            <li>• For life-threatening emergencies, call 115 (Ambulance) or 1122 (Rescue) first</li>
            <li>• Make sure your emergency contact knows they may receive these alerts</li>
          </ul>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button 
            onClick={handleSave}
            disabled={!hasChanges || isLoading}
            className="min-w-[120px]"
          >
            <Save className="mr-2 h-4 w-4" />
            {isLoading ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default EmergencyContactSettings;
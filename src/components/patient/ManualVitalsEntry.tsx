import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Plus, Heart, Activity, Thermometer, Droplet, Wind } from 'lucide-react';
import { ManualVitalsInput } from '@/hooks/useVitals';

interface ManualVitalsEntryProps {
  onSubmit: (vitals: ManualVitalsInput) => Promise<boolean>;
  saving?: boolean;
}

// Medical validation ranges
const VITALS_RANGES = {
  heartRate: { min: 30, max: 220, label: 'Heart Rate' },
  bloodPressureSystolic: { min: 70, max: 250, label: 'Systolic BP' },
  bloodPressureDiastolic: { min: 40, max: 150, label: 'Diastolic BP' },
  oxygenSaturation: { min: 70, max: 100, label: 'SpO₂' },
  temperature: { min: 95, max: 108, label: 'Temperature' },
  respiratoryRate: { min: 8, max: 40, label: 'Respiratory Rate' },
};

const ManualVitalsEntry = ({ onSubmit, saving }: ManualVitalsEntryProps) => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState<ManualVitalsInput>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateField = (field: keyof typeof VITALS_RANGES, value: number | undefined): string | null => {
    if (value === undefined || value === null) return null;
    const range = VITALS_RANGES[field];
    if (value < range.min || value > range.max) {
      return `${range.label} must be between ${range.min} and ${range.max}`;
    }
    return null;
  };

  const handleInputChange = (field: keyof ManualVitalsInput, value: string) => {
    const numValue = value === '' ? undefined : parseFloat(value);
    setFormData(prev => ({ ...prev, [field]: numValue }));
    
    // Validate on change
    if (field in VITALS_RANGES) {
      const error = validateField(field as keyof typeof VITALS_RANGES, numValue);
      setErrors(prev => {
        const newErrors = { ...prev };
        if (error) {
          newErrors[field] = error;
        } else {
          delete newErrors[field];
        }
        return newErrors;
      });
    }
  };

  const handleSubmit = async () => {
    // Validate all fields
    const newErrors: Record<string, string> = {};
    Object.entries(formData).forEach(([key, value]) => {
      if (key in VITALS_RANGES) {
        const error = validateField(key as keyof typeof VITALS_RANGES, value as number);
        if (error) newErrors[key] = error;
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast({
        title: 'Validation Error',
        description: 'Please correct the highlighted fields',
        variant: 'destructive',
      });
      return;
    }

    // Require at least one vital
    const hasVitals = Object.values(formData).some(v => v !== undefined && v !== null);
    if (!hasVitals) {
      toast({
        title: 'No Data',
        description: 'Please enter at least one vital measurement',
        variant: 'destructive',
      });
      return;
    }

    const success = await onSubmit(formData);
    if (success) {
      toast({
        title: 'Vitals Saved',
        description: 'Your vitals have been recorded and sent for AI analysis',
      });
      setFormData({});
      setErrors({});
      setOpen(false);
    }
  };

  const resetForm = () => {
    setFormData({});
    setErrors({});
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen);
      if (!isOpen) resetForm();
    }}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Add Vitals
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Manual Vitals Entry</DialogTitle>
          <DialogDescription>
            Enter your current vital signs. All fields are optional.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Heart Rate */}
          <div className="grid gap-2">
            <Label htmlFor="heartRate" className="flex items-center gap-2">
              <Heart className="h-4 w-4 text-destructive" />
              Heart Rate (bpm)
            </Label>
            <Input
              id="heartRate"
              type="number"
              placeholder="72"
              value={formData.heartRate ?? ''}
              onChange={(e) => handleInputChange('heartRate', e.target.value)}
              className={errors.heartRate ? 'border-destructive' : ''}
            />
            {errors.heartRate && (
              <p className="text-xs text-destructive">{errors.heartRate}</p>
            )}
          </div>

          {/* Blood Pressure */}
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="systolic" className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary" />
                Systolic (mmHg)
              </Label>
              <Input
                id="systolic"
                type="number"
                placeholder="120"
                value={formData.bloodPressureSystolic ?? ''}
                onChange={(e) => handleInputChange('bloodPressureSystolic', e.target.value)}
                className={errors.bloodPressureSystolic ? 'border-destructive' : ''}
              />
              {errors.bloodPressureSystolic && (
                <p className="text-xs text-destructive">{errors.bloodPressureSystolic}</p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="diastolic">Diastolic (mmHg)</Label>
              <Input
                id="diastolic"
                type="number"
                placeholder="80"
                value={formData.bloodPressureDiastolic ?? ''}
                onChange={(e) => handleInputChange('bloodPressureDiastolic', e.target.value)}
                className={errors.bloodPressureDiastolic ? 'border-destructive' : ''}
              />
              {errors.bloodPressureDiastolic && (
                <p className="text-xs text-destructive">{errors.bloodPressureDiastolic}</p>
              )}
            </div>
          </div>

          {/* Oxygen Saturation */}
          <div className="grid gap-2">
            <Label htmlFor="oxygen" className="flex items-center gap-2">
              <Droplet className="h-4 w-4 text-secondary" />
              SpO₂ (%)
            </Label>
            <Input
              id="oxygen"
              type="number"
              placeholder="98"
              value={formData.oxygenSaturation ?? ''}
              onChange={(e) => handleInputChange('oxygenSaturation', e.target.value)}
              className={errors.oxygenSaturation ? 'border-destructive' : ''}
            />
            {errors.oxygenSaturation && (
              <p className="text-xs text-destructive">{errors.oxygenSaturation}</p>
            )}
          </div>

          {/* Temperature */}
          <div className="grid gap-2">
            <Label htmlFor="temperature" className="flex items-center gap-2">
              <Thermometer className="h-4 w-4 text-warning" />
              Temperature (°F)
            </Label>
            <Input
              id="temperature"
              type="number"
              step="0.1"
              placeholder="98.6"
              value={formData.temperature ?? ''}
              onChange={(e) => handleInputChange('temperature', e.target.value)}
              className={errors.temperature ? 'border-destructive' : ''}
            />
            {errors.temperature && (
              <p className="text-xs text-destructive">{errors.temperature}</p>
            )}
          </div>

          {/* Respiratory Rate */}
          <div className="grid gap-2">
            <Label htmlFor="respiratoryRate" className="flex items-center gap-2">
              <Wind className="h-4 w-4 text-muted-foreground" />
              Respiratory Rate (breaths/min)
            </Label>
            <Input
              id="respiratoryRate"
              type="number"
              placeholder="16"
              value={formData.respiratoryRate ?? ''}
              onChange={(e) => handleInputChange('respiratoryRate', e.target.value)}
              className={errors.respiratoryRate ? 'border-destructive' : ''}
            />
            {errors.respiratoryRate && (
              <p className="text-xs text-destructive">{errors.respiratoryRate}</p>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? 'Saving...' : 'Save Vitals'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ManualVitalsEntry;

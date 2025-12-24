import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Activity, Heart, Droplet, Thermometer } from "lucide-react";

interface PatientCardProps {
  patient: {
    id: number;
    name: string;
    age: number;
    condition: string;
    status: "normal" | "warning" | "critical";
    lastReading: string;
    vitals: {
      heartRate: number | null;
      bloodPressure: string;
      temperature: number | null;
      oxygen: number | null;
    };
  };
  onClick?: () => void;
}

const PatientCard = ({ patient, onClick }: PatientCardProps) => {
  const statusColors = {
    normal: "success",
    warning: "default",
    critical: "destructive",
  } as const;

  return (
    <Card className="p-4 hover:shadow-card-hover transition-all duration-300">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-semibold text-lg">{patient.name}</h3>
          <p className="text-sm text-muted-foreground">
            {patient.age} years • {patient.condition}
          </p>
        </div>
        <Badge variant={statusColors[patient.status]}>
          {patient.status}
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="flex items-center gap-2 p-2 rounded-lg bg-muted">
          <Heart className="h-4 w-4 text-destructive" />
          <div>
            <p className="text-xs text-muted-foreground">Heart Rate</p>
            <p className="text-sm font-medium">{patient.vitals.heartRate !== null ? `${patient.vitals.heartRate} bpm` : 'N/A'}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 p-2 rounded-lg bg-muted">
          <Activity className="h-4 w-4 text-primary" />
          <div>
            <p className="text-xs text-muted-foreground">BP</p>
            <p className="text-sm font-medium">{patient.vitals.bloodPressure || 'N/A'}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 p-2 rounded-lg bg-muted">
          <Thermometer className="h-4 w-4 text-warning" />
          <div>
            <p className="text-xs text-muted-foreground">Temp</p>
            <p className="text-sm font-medium">{patient.vitals.temperature !== null ? `${patient.vitals.temperature}°F` : 'N/A'}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 p-2 rounded-lg bg-muted">
          <Droplet className="h-4 w-4 text-secondary" />
          <div>
            <p className="text-xs text-muted-foreground">SpO2</p>
            <p className="text-sm font-medium">{patient.vitals.oxygen !== null ? `${patient.vitals.oxygen}%` : 'N/A'}</p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          Last reading: {patient.lastReading}
        </p>
        <Button size="sm" variant="outline" onClick={onClick}>
          View Details
        </Button>
      </div>
    </Card>
  );
};

export default PatientCard;

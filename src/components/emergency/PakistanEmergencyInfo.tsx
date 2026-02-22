import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Phone, Ambulance, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const PakistanEmergencyInfo = () => {
  const emergencyNumbers = [
    {
      number: "115",
      service: "Ambulance Service",
      description: "National ambulance emergency number",
      icon: Ambulance,
      color: "text-red-600"
    },
    {
      number: "1122",
      service: "Rescue Services",
      description: "Available in Punjab, KP, Balochistan",
      icon: AlertCircle,
      color: "text-orange-600"
    },
    {
      number: "1021",
      service: "Edhi Ambulance",
      description: "Nationwide 24/7 ambulance service",
      icon: Phone,
      color: "text-blue-600"
    }
  ];

  return (
    <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-blue-900 dark:text-blue-100">
          <Phone className="h-5 w-5" />
          Pakistan Emergency Services
        </CardTitle>
        <CardDescription className="text-blue-700 dark:text-blue-300">
          Important emergency contact numbers for immediate medical assistance
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {emergencyNumbers.map((emergency) => {
          const Icon = emergency.icon;
          return (
            <div 
              key={emergency.number}
              className="flex items-start gap-3 p-3 bg-white dark:bg-gray-900 rounded-lg border border-blue-200 dark:border-blue-800"
            >
              <Icon className={`h-6 w-6 mt-1 ${emergency.color}`} />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline" className="font-mono text-lg font-bold">
                    {emergency.number}
                  </Badge>
                  <span className="font-semibold text-gray-900 dark:text-gray-100">
                    {emergency.service}
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {emergency.description}
                </p>
              </div>
            </div>
          );
        })}
        
        <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <p className="text-sm text-yellow-900 dark:text-yellow-100 font-medium">
            ⚠️ In case of life-threatening emergency, call these numbers directly. The NeuralTrace emergency button notifies your emergency contact only.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default PakistanEmergencyInfo;

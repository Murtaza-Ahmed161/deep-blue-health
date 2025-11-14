import { Wifi, WifiOff } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";

const OfflineIndicator = () => {
  const { isOnline, wasOffline } = useOnlineStatus();

  if (isOnline && !wasOffline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 p-2">
      <Alert 
        variant={isOnline ? "default" : "destructive"}
        className="max-w-md mx-auto"
      >
        {isOnline ? (
          <>
            <Wifi className="h-4 w-4" />
            <AlertDescription>
              Connection restored. Syncing data...
            </AlertDescription>
          </>
        ) : (
          <>
            <WifiOff className="h-4 w-4" />
            <AlertDescription>
              You're offline. Changes will sync when connection returns.
            </AlertDescription>
          </>
        )}
      </Alert>
    </div>
  );
};

export default OfflineIndicator;

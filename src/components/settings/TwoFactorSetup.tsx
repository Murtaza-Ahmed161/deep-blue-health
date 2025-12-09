import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, ShieldCheck, ShieldOff, Loader2, Copy, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

const TwoFactorSetup = () => {
  const { user, role } = useAuth();
  const { toast } = useToast();
  const [isEnabled, setIsEnabled] = useState(false);
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [loading, setLoading] = useState(true);
  const [factorId, setFactorId] = useState<string | null>(null);
  
  // Enrollment state
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [verifyCode, setVerifyCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [copied, setCopied] = useState(false);

  // Check if user is doctor or admin
  const canEnable2FA = role === 'doctor' || role === 'admin';

  useEffect(() => {
    checkMFAStatus();
  }, []);

  const checkMFAStatus = async () => {
    try {
      const { data, error } = await supabase.auth.mfa.listFactors();
      
      if (error) throw error;
      
      const totpFactor = data.totp.find(f => f.status === 'verified');
      if (totpFactor) {
        setIsEnabled(true);
        setFactorId(totpFactor.id);
      } else {
        setIsEnabled(false);
        setFactorId(null);
      }
    } catch (error) {
      console.error('Error checking MFA status:', error);
    } finally {
      setLoading(false);
    }
  };

  const startEnrollment = async () => {
    setIsEnrolling(true);
    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        friendlyName: 'Authenticator App'
      });

      if (error) throw error;

      setQrCode(data.totp.qr_code);
      setSecret(data.totp.secret);
      setFactorId(data.id);
    } catch (error: any) {
      toast({
        title: "Error setting up 2FA",
        description: error.message || "Failed to start enrollment",
        variant: "destructive",
      });
      setIsEnrolling(false);
    }
  };

  const verifyAndEnable = async () => {
    if (!factorId || verifyCode.length !== 6) return;
    
    setVerifying(true);
    try {
      const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId,
      });

      if (challengeError) throw challengeError;

      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challengeData.id,
        code: verifyCode,
      });

      if (verifyError) throw verifyError;

      setIsEnabled(true);
      setIsEnrolling(false);
      setQrCode(null);
      setSecret(null);
      setVerifyCode("");

      toast({
        title: "2FA Enabled",
        description: "Two-factor authentication has been successfully enabled.",
      });
    } catch (error: any) {
      toast({
        title: "Verification failed",
        description: error.message || "Invalid code. Please try again.",
        variant: "destructive",
      });
    } finally {
      setVerifying(false);
    }
  };

  const disable2FA = async () => {
    if (!factorId) return;
    
    try {
      const { error } = await supabase.auth.mfa.unenroll({
        factorId,
      });

      if (error) throw error;

      setIsEnabled(false);
      setFactorId(null);

      toast({
        title: "2FA Disabled",
        description: "Two-factor authentication has been disabled.",
      });
    } catch (error: any) {
      toast({
        title: "Error disabling 2FA",
        description: error.message || "Failed to disable 2FA",
        variant: "destructive",
      });
    }
  };

  const cancelEnrollment = async () => {
    if (factorId && !isEnabled) {
      try {
        await supabase.auth.mfa.unenroll({ factorId });
      } catch (error) {
        // Ignore error, just reset state
      }
    }
    setIsEnrolling(false);
    setQrCode(null);
    setSecret(null);
    setVerifyCode("");
    setFactorId(null);
  };

  const copySecret = () => {
    if (secret) {
      navigator.clipboard.writeText(secret);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!canEnable2FA) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Two-Factor Authentication
          </CardTitle>
          <CardDescription>
            2FA is available for doctors and administrators
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              Two-factor authentication is currently only available for doctor and admin accounts.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              {isEnabled ? (
                <ShieldCheck className="h-5 w-5 text-green-500" />
              ) : (
                <Shield className="h-5 w-5" />
              )}
              Two-Factor Authentication
            </CardTitle>
            <CardDescription>
              Add an extra layer of security to your account
            </CardDescription>
          </div>
          {isEnabled && (
            <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
              Enabled
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isEnabled && !isEnrolling && (
          <>
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                Protect your account with TOTP-based two-factor authentication using apps like 
                Google Authenticator, Authy, or 1Password.
              </AlertDescription>
            </Alert>
            <Button onClick={startEnrollment} className="w-full">
              <Shield className="mr-2 h-4 w-4" />
              Enable Two-Factor Authentication
            </Button>
          </>
        )}

        {isEnrolling && qrCode && (
          <div className="space-y-4">
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                Scan the QR code below with your authenticator app, then enter the 6-digit code to verify.
              </AlertDescription>
            </Alert>

            <div className="flex justify-center p-4 bg-background rounded-lg border">
              <img src={qrCode} alt="2FA QR Code" className="w-48 h-48" />
            </div>

            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">
                Can't scan? Enter this code manually:
              </Label>
              <div className="flex items-center gap-2">
                <code className="flex-1 px-3 py-2 bg-muted rounded text-sm font-mono break-all">
                  {secret}
                </code>
                <Button variant="outline" size="icon" onClick={copySecret}>
                  {copied ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="verify-code">Enter verification code</Label>
              <Input
                id="verify-code"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                placeholder="000000"
                value={verifyCode}
                onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="text-center text-2xl tracking-widest font-mono"
              />
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={cancelEnrollment}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={verifyAndEnable}
                disabled={verifyCode.length !== 6 || verifying}
                className="flex-1"
              >
                {verifying ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  "Verify & Enable"
                )}
              </Button>
            </div>
          </div>
        )}

        {isEnabled && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <ShieldCheck className="h-8 w-8 text-green-600 dark:text-green-400" />
              <div>
                <p className="font-medium text-green-800 dark:text-green-300">
                  Two-factor authentication is active
                </p>
                <p className="text-sm text-green-700 dark:text-green-400">
                  Your account is protected with an authenticator app
                </p>
              </div>
            </div>

            <Button
              variant="destructive"
              onClick={disable2FA}
              className="w-full"
            >
              <ShieldOff className="mr-2 h-4 w-4" />
              Disable Two-Factor Authentication
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TwoFactorSetup;

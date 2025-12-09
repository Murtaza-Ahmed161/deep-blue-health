import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Ticket, ArrowRight, CheckCircle2, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface BetaInviteFormProps {
  onValidCode: (code: string) => void;
  onSkip?: () => void;
}

export const BetaInviteForm = ({ onValidCode, onSkip }: BetaInviteFormProps) => {
  const [code, setCode] = useState("");
  const [validating, setValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validated, setValidated] = useState(false);

  const handleValidate = async () => {
    if (!code.trim()) {
      setError("Please enter an invite code");
      return;
    }

    setValidating(true);
    setError(null);

    const { data, error: queryError } = await supabase
      .from("beta_invite_codes")
      .select("*")
      .eq("code", code.toUpperCase())
      .eq("is_active", true)
      .maybeSingle();

    if (queryError) {
      setError("Error validating code. Please try again.");
      setValidating(false);
      return;
    }

    if (!data) {
      setError("Invalid invite code. Please check and try again.");
      setValidating(false);
      return;
    }

    // Check if expired
    if (data.expires_at && new Date(data.expires_at) < new Date()) {
      setError("This invite code has expired.");
      setValidating(false);
      return;
    }

    // Check if max uses reached
    if (data.current_uses >= data.max_uses) {
      setError("This invite code has reached its usage limit.");
      setValidating(false);
      return;
    }

    // Valid code!
    setValidated(true);
    setValidating(false);
    
    // Increment usage count
    await supabase
      .from("beta_invite_codes")
      .update({ current_uses: data.current_uses + 1 })
      .eq("id", data.id);

    setTimeout(() => {
      onValidCode(code.toUpperCase());
    }, 1000);
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
          <Ticket className="h-6 w-6 text-primary" />
        </div>
        <CardTitle>Welcome to NeuralTrace Beta</CardTitle>
        <CardDescription>
          Enter your invite code to join the beta program and get early access to AI-powered health monitoring.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {validated ? (
          <div className="text-center py-6">
            <div className="mx-auto w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4">
              <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <p className="text-lg font-medium text-green-600 dark:text-green-400">
              Code Validated!
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Redirecting to registration...
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-2">
              <Label htmlFor="invite-code">Invite Code</Label>
              <Input
                id="invite-code"
                placeholder="NEURAL-XXXXXX"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value.toUpperCase());
                  setError(null);
                }}
                className="font-mono text-center text-lg tracking-wider"
              />
              {error && (
                <div className="flex items-center gap-2 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  {error}
                </div>
              )}
            </div>

            <Button
              className="w-full"
              onClick={handleValidate}
              disabled={validating || !code.trim()}
            >
              {validating ? "Validating..." : "Continue"}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>

            {onSkip && (
              <div className="text-center pt-2">
                <Button variant="link" onClick={onSkip} className="text-muted-foreground">
                  I don't have an invite code
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

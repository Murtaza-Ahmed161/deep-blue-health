import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, UserCircle, Lock, Stethoscope, Heart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ForgotPasswordDialog } from "@/components/auth/ForgotPasswordDialog";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";
import TwoFactorVerify from "@/components/auth/TwoFactorVerify";
import { BetaInviteForm } from "@/components/auth/BetaInviteForm";

const Auth = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { user, role, loading } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [userType, setUserType] = useState<"doctor" | "patient">("patient");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showResetForm, setShowResetForm] = useState(false);
  
  // 2FA state
  const [show2FA, setShow2FA] = useState(false);
  const [mfaFactorId, setMfaFactorId] = useState<string | null>(null);

  // Beta invite state
  const [showBetaInvite, setShowBetaInvite] = useState(false);
  const [validatedInviteCode, setValidatedInviteCode] = useState<string | null>(null);

  // Check for password reset flow
  useEffect(() => {
    const isReset = searchParams.get('reset') === 'true';
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const type = hashParams.get('type');
    
    if (isReset || type === 'recovery') {
      setShowResetForm(true);
    }
  }, [searchParams]);

  // Redirect if already authenticated
  useEffect(() => {
    if (!loading && user && role) {
      if (role === 'doctor') {
        navigate('/dashboard');
      } else if (role === 'patient') {
        navigate('/patient-dashboard');
      } else if (role === 'admin') {
        navigate('/admin');
      }
    }
  }, [user, role, loading, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Check if MFA is required
      const { data: factorsData } = await supabase.auth.mfa.listFactors();
      const verifiedFactor = factorsData?.totp?.find(f => f.status === 'verified');
      
      if (verifiedFactor) {
        // User has 2FA enabled, show verification screen
        setMfaFactorId(verifiedFactor.id);
        setShow2FA(true);
        return;
      }

      toast({
        title: "Login successful",
        description: "Welcome back to NeuralTrace!",
      });

      // Navigation handled by useEffect based on role
    } catch (error: any) {
      console.error('Login error:', error);
      toast({
        title: "Login failed",
        description: error.message || "Please check your credentials.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handle2FASuccess = () => {
    setShow2FA(false);
    setMfaFactorId(null);
    toast({
      title: "Login successful",
      description: "Welcome back to NeuralTrace!",
    });
    // Navigation handled by useEffect based on role
  };

  const handle2FACancel = async () => {
    await supabase.auth.signOut();
    setShow2FA(false);
    setMfaFactorId(null);
    setPassword("");
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Validate required fields
      if (!email || !password || !fullName) {
        throw new Error("Please fill in all required fields");
      }

      if (userType === 'doctor' && (!specialty || !licenseNumber)) {
        throw new Error("Doctors must provide specialty and license number");
      }

      const metadata: any = {
        full_name: fullName,
        phone,
        role: userType,
      };

      if (userType === 'doctor') {
        metadata.specialty = specialty;
        metadata.license_number = licenseNumber;
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata,
          emailRedirectTo: `${window.location.origin}/`,
        },
      });

      if (error) throw error;

      toast({
        title: "Account created successfully",
        description: `Welcome to NeuralTrace! You can now log in as a ${userType}.`,
      });

      // Switch to login tab
      setIsLogin(true);
      setEmail("");
      setPassword("");
      setFullName("");
      setPhone("");
      setSpecialty("");
      setLicenseNumber("");
    } catch (error: any) {
      console.error('Signup error:', error);
      toast({
        title: "Signup failed",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show reset password form if in recovery mode
  if (showResetForm) {
    return (
      <div className="min-h-screen bg-muted flex items-center justify-center p-4">
        <ResetPasswordForm />
      </div>
    );
  }

  // Show 2FA verification if needed
  if (show2FA && mfaFactorId) {
    return (
      <div className="min-h-screen bg-muted flex items-center justify-center p-4">
        <TwoFactorVerify
          factorId={mfaFactorId}
          onSuccess={handle2FASuccess}
          onCancel={handle2FACancel}
        />
      </div>
    );
  }

  // Show beta invite form when switching to signup (for new users)
  const handleTabChange = (value: string) => {
    const goingToSignup = value === "signup";
    setIsLogin(!goingToSignup);
    
    // Show beta invite form for new signups (skip if already validated)
    if (goingToSignup && !validatedInviteCode) {
      setShowBetaInvite(true);
    }
  };

  const handleBetaCodeValidated = (code: string) => {
    setValidatedInviteCode(code);
    setShowBetaInvite(false);
  };

  const handleSkipBetaInvite = () => {
    setShowBetaInvite(false);
    setValidatedInviteCode("SKIPPED");
  };

  // Show beta invite form
  if (showBetaInvite && !isLogin) {
    return (
      <div className="min-h-screen bg-muted flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Button
            variant="ghost"
            onClick={() => {
              setShowBetaInvite(false);
              setIsLogin(true);
            }}
            className="mb-6"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Login
          </Button>
          <BetaInviteForm 
            onValidCode={handleBetaCodeValidated}
            onSkip={handleSkipBetaInvite}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Button>

        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">NeuralTrace</CardTitle>
            <CardDescription>
              {isLogin ? "Sign in to access your dashboard" : "Create your account"}
              {validatedInviteCode && validatedInviteCode !== "SKIPPED" && !isLogin && (
                <span className="block mt-1 text-xs text-primary">
                  Beta Access: {validatedInviteCode}
                </span>
              )}
            </CardDescription>
          </CardHeader>

          <Tabs value={isLogin ? "login" : "signup"} onValueChange={handleTabChange}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleLogin}>
                <CardContent className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <div className="relative">
                      <UserCircle className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="your-email@example.com"
                        className="pl-10"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="login-password">Password</Label>
                      <ForgotPasswordDialog onOtpSent={(email) => setEmail(email)} />
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="login-password"
                        type="password"
                        placeholder="••••••••"
                        className="pl-10"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? "Signing in..." : "Sign In"}
                  </Button>
                </CardContent>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignup}>
                <CardContent className="space-y-4 pt-4">
                  {/* User Type Selection */}
                  <div className="space-y-2">
                    <Label>I am a</Label>
                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        type="button"
                        variant={userType === "patient" ? "default" : "outline"}
                        className="h-20 flex flex-col items-center justify-center gap-2"
                        onClick={() => setUserType("patient")}
                      >
                        <Heart className="h-6 w-6" />
                        <span>Patient</span>
                      </Button>
                      <Button
                        type="button"
                        variant={userType === "doctor" ? "default" : "outline"}
                        className="h-20 flex flex-col items-center justify-center gap-2"
                        onClick={() => setUserType("doctor")}
                      >
                        <Stethoscope className="h-6 w-6" />
                        <span>Doctor</span>
                      </Button>
                    </div>
                  </div>

                  {/* Common Fields */}
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">Full Name *</Label>
                    <Input
                      id="signup-name"
                      type="text"
                      placeholder="Dr. John Smith"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email *</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="your-email@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-phone">Phone</Label>
                    <Input
                      id="signup-phone"
                      type="tel"
                      placeholder="+1 (555) 123-4567"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>

                  {/* Doctor-specific Fields */}
                  {userType === "doctor" && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="signup-specialty">Specialty *</Label>
                        <Select value={specialty} onValueChange={setSpecialty} required>
                          <SelectTrigger>
                            <SelectValue placeholder="Select specialty" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="cardiology">Cardiology</SelectItem>
                            <SelectItem value="internal_medicine">Internal Medicine</SelectItem>
                            <SelectItem value="emergency_medicine">Emergency Medicine</SelectItem>
                            <SelectItem value="family_medicine">Family Medicine</SelectItem>
                            <SelectItem value="neurology">Neurology</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="signup-license">Medical License Number *</Label>
                        <Input
                          id="signup-license"
                          type="text"
                          placeholder="MD-123456"
                          value={licenseNumber}
                          onChange={(e) => setLicenseNumber(e.target.value)}
                          required={userType === "doctor"}
                        />
                      </div>
                    </>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password *</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                    />
                  </div>

                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? "Creating account..." : "Create Account"}
                  </Button>

                  <p className="text-xs text-muted-foreground text-center">
                    By signing up, you agree to our Terms of Service and Privacy Policy
                  </p>
                </CardContent>
              </form>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
};

export default Auth;

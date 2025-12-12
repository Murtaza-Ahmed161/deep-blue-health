import { useState, useEffect } from "react";
import { Brain, Activity, Shield, HeartPulse } from "lucide-react";
import { cn } from "@/lib/utils";

interface SplashScreenProps {
  onComplete: () => void;
  minDuration?: number;
}

const SplashScreen = ({ onComplete, minDuration = 2500 }: SplashScreenProps) => {
  const [progress, setProgress] = useState(0);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + 2;
      });
    }, minDuration / 50);

    const timer = setTimeout(() => {
      setFadeOut(true);
      setTimeout(onComplete, 500);
    }, minDuration);

    return () => {
      clearInterval(progressInterval);
      clearTimeout(timer);
    };
  }, [onComplete, minDuration]);

  return (
    <div
      className={cn(
        "fixed inset-0 z-[100] flex flex-col items-center justify-center bg-medical-gradient transition-opacity duration-500",
        fadeOut && "opacity-0 pointer-events-none"
      )}
    >
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-white/5 animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 rounded-full bg-white/5 animate-pulse delay-300" />
        <div className="absolute top-1/2 right-1/3 w-32 h-32 rounded-full bg-white/5 animate-pulse delay-500" />
      </div>

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center gap-8">
        {/* Logo with animation */}
        <div className="relative">
          <div className="absolute inset-0 bg-white/20 rounded-full blur-2xl animate-pulse" />
          <div className="relative bg-white/10 backdrop-blur-sm rounded-full p-6 border border-white/20">
            <Brain className="h-16 w-16 md:h-20 md:w-20 text-white animate-pulse" />
          </div>
        </div>

        {/* App name */}
        <div className="text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">
            NeuralTrace
          </h1>
          <p className="text-white/80 text-lg">
            AI-Powered Health Monitoring
          </p>
        </div>

        {/* Loading indicators */}
        <div className="flex items-center gap-6 mt-4">
          <div className="flex flex-col items-center gap-2 animate-bounce" style={{ animationDelay: "0ms" }}>
            <Activity className="h-6 w-6 text-white/80" />
            <span className="text-xs text-white/60">Vitals</span>
          </div>
          <div className="flex flex-col items-center gap-2 animate-bounce" style={{ animationDelay: "150ms" }}>
            <HeartPulse className="h-6 w-6 text-white/80" />
            <span className="text-xs text-white/60">Monitoring</span>
          </div>
          <div className="flex flex-col items-center gap-2 animate-bounce" style={{ animationDelay: "300ms" }}>
            <Shield className="h-6 w-6 text-white/80" />
            <span className="text-xs text-white/60">Secure</span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-64 md:w-80 mt-6">
          <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-white rounded-full transition-all duration-100 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-white/60 text-sm text-center mt-3">
            Initializing secure connection...
          </p>
        </div>
      </div>

      {/* Version */}
      <div className="absolute bottom-8 text-white/40 text-sm">
        Version 1.0.0 Beta
      </div>
    </div>
  );
};

export default SplashScreen;

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Activity, Brain, Users, Shield, HeartPulse, UserCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import heroImage from "@/assets/hero-medical.jpg";

const Index = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: Activity,
      title: "Continuous Monitoring",
      description: "Real-time vital sign tracking with AI-powered anomaly detection",
    },
    {
      icon: Brain,
      title: "AI Health Assistant",
      description: "Memory support and health insights powered by advanced AI",
    },
    {
      icon: UserCheck,
      title: "Doctor Integration",
      description: "Seamless connection with verified healthcare professionals",
    },
    {
      icon: HeartPulse,
      title: "Emergency Response",
      description: "Automated alerts and emergency orchestration",
    },
    {
      icon: Users,
      title: "Caregiver Dashboard",
      description: "Keep loved ones informed and connected",
    },
    {
      icon: Shield,
      title: "HIPAA Compliant",
      description: "Enterprise-grade security and privacy protection",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold text-primary">NeuralTrace</span>
          </div>
          <Button onClick={() => navigate('/auth')} variant="default">
            Doctor Login
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-medical-gradient opacity-10" />
        <div className="container mx-auto px-4 py-20 md:py-32">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h1 className="text-4xl md:text-6xl font-bold text-foreground leading-tight">
                AI-Powered Health Monitoring for Better Care
              </h1>
              <p className="text-lg text-muted-foreground">
                Continuous health tracking, memory assistance, and direct connection with verified 
                doctors. NeuralTrace brings together cutting-edge AI and human expertise.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" onClick={() => navigate('/auth')} className="text-lg">
                  For Healthcare Providers
                </Button>
                <Button size="lg" variant="outline" className="text-lg">
                  Learn More
                </Button>
              </div>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-medical-gradient opacity-20 rounded-2xl blur-3xl" />
              <img 
                src={heroImage} 
                alt="Modern healthcare technology" 
                className="relative rounded-2xl shadow-card-hover w-full"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Comprehensive Healthcare Platform
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Combining AI intelligence with human medical expertise for optimal patient care
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <Card 
              key={index} 
              className="p-6 hover:shadow-card-hover transition-all duration-300 border-border"
            >
              <feature.icon className="h-12 w-12 text-secondary mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">
                {feature.title}
              </h3>
              <p className="text-muted-foreground">
                {feature.description}
              </p>
            </Card>
          ))}
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-muted py-20">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-primary mb-2">24/7</div>
              <div className="text-muted-foreground">Continuous Monitoring</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-success mb-2">98%</div>
              <div className="text-muted-foreground">Accuracy Rate</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-secondary mb-2">&lt;2min</div>
              <div className="text-muted-foreground">Emergency Response</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">HIPAA</div>
              <div className="text-muted-foreground">Compliant</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <Card className="p-12 bg-medical-gradient text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Transform Patient Care?
          </h2>
          <p className="text-white/90 text-lg mb-8 max-w-2xl mx-auto">
            Join healthcare professionals using NeuralTrace to provide better, more responsive care.
          </p>
          <Button 
            size="lg" 
            variant="secondary"
            onClick={() => navigate('/auth')}
            className="text-lg"
          >
            Get Started Today
          </Button>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-muted-foreground">
              &copy; 2024 NeuralTrace. HIPAA Compliant Healthcare Technology.
            </p>
            <div className="flex items-center gap-6">
              <button 
                onClick={() => navigate('/about')} 
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                About
              </button>
              <button 
                onClick={() => navigate('/support')} 
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                Support
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;

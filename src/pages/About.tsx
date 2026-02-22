import { Brain, Shield, Heart, Award, Users, Globe, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useNavigate } from "react-router-dom";

const About = () => {
  const navigate = useNavigate();

  const values = [
    {
      icon: Shield,
      title: "Security First",
      description: "HIPAA-compliant infrastructure with end-to-end encryption protecting all patient data.",
    },
    {
      icon: Heart,
      title: "Patient-Centered",
      description: "Every feature designed with patient outcomes and comfort as the primary focus.",
    },
    {
      icon: Award,
      title: "Clinical Excellence",
      description: "AI models trained and validated by healthcare professionals for accuracy.",
    },
    {
      icon: Users,
      title: "Collaborative Care",
      description: "Seamless connection between patients, doctors, and caregivers.",
    },
  ];

  const stats = [
    { value: "99.9%", label: "Uptime Guarantee" },
    { value: "24/7", label: "Monitoring" },
    { value: "<1s", label: "Alert Latency" },
    { value: "256-bit", label: "Encryption" },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Brain className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold text-primary">NeuralTrace</span>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-16 md:py-24">
        <div className="absolute inset-0 bg-medical-gradient opacity-5" />
        <div className="container mx-auto px-4 text-center relative">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
            <Globe className="h-4 w-4" />
            Trusted by Healthcare Professionals Worldwide
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            About NeuralTrace
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            NeuralTrace is an AI-powered continuous health monitoring platform designed to 
            bridge the gap between patients and healthcare providers through real-time 
            vital sign tracking, intelligent alerts, and seamless communication. Developed 
            as a Final Year Project to address healthcare challenges in Pakistan.
          </p>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
              Our Mission
            </h2>
            <p className="text-lg text-muted-foreground">
              To empower patients and healthcare providers in Pakistan with AI-driven insights 
              that enable proactive, personalized care. We believe that continuous monitoring 
              combined with human expertise leads to better health outcomes, especially in 
              resource-constrained healthcare systems.
            </p>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground text-center mb-12">
            Our Core Values
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, index) => (
              <Card key={index} className="p-6 text-center hover:shadow-lg transition-shadow">
                <div className="inline-flex p-3 rounded-full bg-primary/10 mb-4">
                  <value.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {value.title}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {value.description}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-medical-gradient">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {stats.map((stat, index) => (
              <div key={index}>
                <div className="text-3xl md:text-4xl font-bold text-white mb-2">
                  {stat.value}
                </div>
                <div className="text-white/80">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Technology Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground text-center mb-8">
              Technology & Compliance
            </h2>
            <div className="space-y-6">
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Pakistan Emergency Integration
                </h3>
                <p className="text-muted-foreground">
                  Integrated with Pakistan's emergency services including 115 (Ambulance), 
                  1122 (Rescue Services), and Edhi Ambulance (1021) for rapid emergency response.
                </p>
              </Card>
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  HIPAA Compliant
                </h3>
                <p className="text-muted-foreground">
                  All data is encrypted in transit and at rest using AES-256 encryption. 
                  Our infrastructure meets the highest standards for healthcare data protection.
                </p>
              </Card>
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  AI-Powered Analysis
                </h3>
                <p className="text-muted-foreground">
                  Our machine learning models are trained on anonymized medical data and 
                  validated by healthcare professionals to ensure clinical accuracy.
                </p>
              </Card>
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Real-Time Monitoring
                </h3>
                <p className="text-muted-foreground">
                  Integration with leading wearable devices enables continuous vital sign 
                  tracking with sub-second latency for critical alerts.
                </p>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Version Info */}
      <section className="py-8 border-t border-border">
        <div className="container mx-auto px-4 text-center">
          <p className="text-muted-foreground">
            NeuralTrace v1.0.0 Beta - Final Year Project
          </p>
          <p className="text-sm text-muted-foreground/70 mt-1">
            Developed for healthcare monitoring in Pakistan
          </p>
          <p className="text-sm text-muted-foreground/70 mt-1">
            © 2024 NeuralTrace. All rights reserved.
          </p>
        </div>
      </section>
    </div>
  );
};

export default About;

import { useState } from "react";
import {
  Brain,
  ArrowLeft,
  MessageCircle,
  Mail,
  Phone,
  FileQuestion,
  ChevronDown,
  ExternalLink,
  Send,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const faqs = [
  {
    question: "How do I connect my smartwatch?",
    answer:
      "Go to Settings > Device Integration and follow the prompts to connect your Google Fit or Apple HealthKit account. Ensure your smartwatch is syncing with these services first.",
  },
  {
    question: "What do I do if I receive an emergency alert?",
    answer:
      "If the alert is accurate, the system will automatically notify your designated caregivers and healthcare provider. If it's a false alarm, tap 'Cancel Alert' within 60 seconds to dismiss.",
  },
  {
    question: "How accurate is the AI health analysis?",
    answer:
      "Our AI models achieve 98% accuracy in detecting anomalies in vital signs. However, AI analysis is meant to assist, not replace, professional medical judgment. Always consult your doctor for medical decisions.",
  },
  {
    question: "Is my health data secure?",
    answer:
      "Yes. All data is encrypted using AES-256 encryption both in transit and at rest. We are fully HIPAA compliant and undergo regular security audits.",
  },
  {
    question: "Can I use NeuralTrace without a doctor?",
    answer:
      "Yes! You can use our AI Assistant Only mode for personal health monitoring. However, for the full experience with personalized medical guidance, we recommend connecting with a healthcare provider.",
  },
  {
    question: "How do I invite my doctor to NeuralTrace?",
    answer:
      "Go to Settings > Doctor Connection and enter your doctor's email address. They will receive an invitation to create an account and connect with you.",
  },
];

const Support = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    category: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate submission
    await new Promise((resolve) => setTimeout(resolve, 1000));

    toast({
      title: "Support Request Submitted",
      description: "We'll get back to you within 24 hours.",
    });

    setFormData({ name: "", email: "", category: "", message: "" });
    setIsSubmitting(false);
  };

  const contactMethods = [
    {
      icon: Mail,
      title: "Email Support",
      description: "support@neuraltrace.health",
      action: "mailto:support@neuraltrace.health",
    },
    {
      icon: Phone,
      title: "Phone Support",
      description: "1-800-NEURAL (Mon-Fri, 9AM-6PM EST)",
      action: "tel:1-800-638725",
    },
    {
      icon: MessageCircle,
      title: "Live Chat",
      description: "Available 24/7 for urgent issues",
      action: "#",
    },
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

      {/* Hero */}
      <section className="py-12 md:py-16 border-b border-border">
        <div className="container mx-auto px-4 text-center">
          <div className="inline-flex p-3 rounded-full bg-primary/10 mb-4">
            <FileQuestion className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            How Can We Help?
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Get answers to common questions or reach out to our support team.
          </p>
        </div>
      </section>

      {/* Contact Methods */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {contactMethods.map((method, index) => (
              <Card
                key={index}
                className="p-6 text-center hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => window.open(method.action, "_blank")}
              >
                <div className="inline-flex p-3 rounded-full bg-secondary/10 mb-4">
                  <method.icon className="h-6 w-6 text-secondary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {method.title}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {method.description}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-12 bg-muted/50">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground text-center mb-8">
            Frequently Asked Questions
          </h2>
          <div className="max-w-3xl mx-auto">
            <Accordion type="single" collapsible className="space-y-4">
              {faqs.map((faq, index) => (
                <AccordionItem
                  key={index}
                  value={`item-${index}`}
                  className="bg-background rounded-lg border border-border px-6"
                >
                  <AccordionTrigger className="text-left hover:no-underline">
                    <span className="font-medium text-foreground">
                      {faq.question}
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>

      {/* Contact Form */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground text-center mb-8">
              Send Us a Message
            </h2>
            <Card className="p-6 md:p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      placeholder="Your name"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="your@email.com"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) =>
                      setFormData({ ...formData, category: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="technical">Technical Issue</SelectItem>
                      <SelectItem value="account">Account & Billing</SelectItem>
                      <SelectItem value="feature">Feature Request</SelectItem>
                      <SelectItem value="security">Security Concern</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    placeholder="Describe your issue or question..."
                    rows={5}
                    value={formData.message}
                    onChange={(e) =>
                      setFormData({ ...formData, message: e.target.value })
                    }
                    required
                  />
                </div>

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? (
                    "Sending..."
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Send Message
                    </>
                  )}
                </Button>
              </form>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <section className="py-8 border-t border-border">
        <div className="container mx-auto px-4 text-center">
          <p className="text-muted-foreground">
            Response times: Standard - 24 hours | Urgent - 4 hours
          </p>
          <p className="text-sm text-muted-foreground/70 mt-1">
            For medical emergencies, please call your local emergency services.
          </p>
        </div>
      </section>
    </div>
  );
};

export default Support;

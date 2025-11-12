import { useState } from "react";
import { Button } from "@/components/ui/button";
import { MessageSquare } from "lucide-react";
import FeedbackDialog from "./FeedbackDialog";

interface FeedbackButtonProps {
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
}

const FeedbackButton = ({ variant = "ghost", size = "sm" }: FeedbackButtonProps) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={() => setOpen(true)}
        className="gap-2"
      >
        <MessageSquare className="h-4 w-4" />
        {size !== "icon" && "Feedback"}
      </Button>
      <FeedbackDialog open={open} onOpenChange={setOpen} />
    </>
  );
};

export default FeedbackButton;
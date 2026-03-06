import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Link } from "@tanstack/react-router";
import { Bot, ChevronDown, FileText, Film, Heart, Send, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

// ─── AI Assistant Types & Logic ────────────────────────────────────────────

interface ChatMessage {
  id: number;
  role: "user" | "assistant";
  text: string;
}

function getAIResponse(message: string): string {
  const msg = message.toLowerCase().trim();

  // Upload / how to upload
  if (
    msg.includes("upload") ||
    msg.includes("how to start") ||
    msg.includes("submit video") ||
    msg.includes("send video")
  ) {
    return "To upload a video on Videro:\n\n1. Log in with your email and password.\n2. Go to the Submit Video page.\n3. Choose the video type — Small, Medium, or Long.\n4. Upload your Source Video (the one to be edited).\n5. Upload a Reference Video (optional, for style guidance).\n6. Complete the payment.\n\nOnce submitted, our team will edit it and send it back to you!";
  }

  // Pricing
  if (
    msg.includes("price") ||
    msg.includes("pricing") ||
    msg.includes("cost") ||
    msg.includes("charge") ||
    msg.includes("fee") ||
    msg.includes("how much") ||
    msg.includes("₹") ||
    msg.includes("rupee") ||
    msg.includes("money")
  ) {
    return "Videro's editing prices are:\n\n• Small Video — ₹100\n• Medium Video — ₹500\n• Long Video — ₹2,000\n\nPricing is based on the video length you select when submitting. Payment is collected before editing begins.";
  }

  // Payment methods
  if (
    msg.includes("payment") ||
    msg.includes("pay") ||
    msg.includes("google pay") ||
    msg.includes("gpay") ||
    msg.includes("phonepe") ||
    msg.includes("upi") ||
    msg.includes("stripe") ||
    msg.includes("card")
  ) {
    return "We accept the following payment methods:\n\n• Google Pay (UPI: vijayanr07051998@oksbi)\n• PhonePe (UPI: vijayanr07051998@oksbi)\n• Credit / Debit Card via Stripe\n\nAfter uploading your videos, you'll see a payment step. Choose your preferred method and complete the payment to confirm your order.";
  }

  // Editing process
  if (
    msg.includes("edit") ||
    msg.includes("editing") ||
    msg.includes("how does editing") ||
    msg.includes("editor") ||
    msg.includes("process")
  ) {
    return "Here's how the editing process works:\n\n1. You upload your source video and a reference video.\n2. You complete the payment.\n3. Our admin assigns the job to a professional editor.\n4. The editor downloads your videos and applies the edits.\n5. The admin reviews and approves the final edit.\n6. The edited video is sent back to you via your dashboard.\n\nMost edits are delivered within the agreed timeline.";
  }

  // Getting edited video back / delivery
  if (
    msg.includes("receive") ||
    msg.includes("get back") ||
    msg.includes("download") ||
    msg.includes("delivered") ||
    msg.includes("final video") ||
    msg.includes("edited video") ||
    msg.includes("when will")
  ) {
    return "Once your video is edited and approved by our admin, it will appear in your dashboard under the 'Edited Videos Ready' section.\n\nSimply log in, go to My Videos, and click the Download button next to your completed job. You'll be notified on your dashboard when the video is ready.";
  }

  // Admin related
  if (
    msg.includes("admin") ||
    msg.includes("administrator") ||
    msg.includes("manage") ||
    msg.includes("supervision")
  ) {
    return "Videro's admin oversees all video editing jobs:\n\n• Admins review submitted videos and assign them to editors.\n• After editing, the admin reviews the final video before sending it back to the uploader.\n• Admins can also manage payments and track revenue.\n\nUploaders do not have direct access to the admin section — this ensures quality control for every project.";
  }

  // Refund
  if (
    msg.includes("refund") ||
    msg.includes("cancel") ||
    msg.includes("money back")
  ) {
    return "Refund Policy:\n\nOnce editing has begun, refunds are not typically available. However, if there is a technical issue or the video was not delivered, please contact us through the platform.\n\nFor payment disputes, reach out to us directly and we will review your case within 2–3 business days.";
  }

  // Account / login
  if (
    msg.includes("login") ||
    msg.includes("log in") ||
    msg.includes("sign in") ||
    msg.includes("account") ||
    msg.includes("register") ||
    msg.includes("sign up") ||
    msg.includes("password")
  ) {
    return "To use Videro:\n\n1. Click 'Submit Video' or 'Get Started' on the home page.\n2. Create an account with your email and password.\n3. Log in whenever you return to track your videos and downloads.\n\nYour account keeps all your uploaded and edited videos in one place.";
  }

  // Reference video
  if (msg.includes("reference") || msg.includes("style guide")) {
    return "A reference video is an optional video you can upload to show the style, effect, or look you want for your edited video.\n\nFor example: if you want your video edited with a cinematic color grade, you can upload a sample clip showing that style. Our editors use it as a visual guide to match your expectations.";
  }

  // Contact / support
  if (
    msg.includes("contact") ||
    msg.includes("support") ||
    msg.includes("help") ||
    msg.includes("issue") ||
    msg.includes("problem")
  ) {
    return "For support, you can:\n\n• Check your dashboard for job status updates.\n• Review the Terms & Conditions (link in the footer) for policy details.\n• If you have a payment or delivery issue, log in and check the 'My Videos' section — status updates are shown there.\n\nWe aim to resolve all issues promptly.";
  }

  // Greeting
  if (
    msg.includes("hello") ||
    msg.includes("hi") ||
    msg.includes("hey") ||
    msg.includes("good") ||
    msg.includes("greet")
  ) {
    return "Hi there! 👋 I'm the Videro assistant. I can help you with:\n\n• How to upload videos\n• Pricing & payment methods\n• How the editing process works\n• Getting your edited video back\n• Account & login help\n\nWhat would you like to know?";
  }

  // Fallback
  return "I'm not sure about that specific topic. Here are some things I can help with:\n\n• Uploading videos\n• Pricing (Small ₹100 / Medium ₹500 / Long ₹2,000)\n• Payment methods (Google Pay, PhonePe, Card)\n• Editing process & delivery\n• Account & login\n\nTry asking about one of those topics!";
}

// ─── Conditions Content ─────────────────────────────────────────────────────

const CONDITIONS_SECTIONS = [
  {
    title: "1. Service Description",
    content:
      "Videro is a professional video editing platform that connects clients (uploaders) with skilled video editors supervised by an admin. Clients upload source and reference videos; editors process them and return the finished product via the platform.",
  },
  {
    title: "2. Payment Terms",
    content:
      "All payments are collected before editing begins. Pricing tiers are:\n• Small Video — ₹100\n• Medium Video — ₹500\n• Long Video — ₹2,000\n\nPayment methods accepted: Google Pay, PhonePe (UPI: vijayanr07051998@oksbi), and Credit/Debit Card via Stripe. Payment confirmation is required for the job to be assigned to an editor.",
  },
  {
    title: "3. Video Upload Policy",
    content:
      "By uploading content to Videro, you confirm that:\n• You own or have the rights to the video content.\n• The content does not violate any laws or third-party intellectual property rights.\n• The content is not offensive, harmful, or illegal.\n\nVidero reserves the right to decline or remove content that violates these guidelines. Maximum upload size is 100 GB per video.",
  },
  {
    title: "4. Editing & Delivery",
    content:
      "Once payment is confirmed, the admin assigns your job to a qualified editor. The editor uses your source and reference videos to produce the final edit. All edits are reviewed by the admin before delivery. Delivery timelines vary by video complexity and queue length. Completed videos are made available for download in the client's dashboard.",
  },
  {
    title: "5. Refund Policy",
    content:
      "Refunds are not available once editing has commenced. If the edited video is not delivered within a reasonable timeframe, or if there is a technical failure preventing delivery, the client may request a review. Refund decisions are at the discretion of the admin and will be communicated within 2–3 business days.",
  },
  {
    title: "6. Privacy",
    content:
      "Videro stores uploaded videos and account information securely on the Internet Computer network. Your videos are only accessible to you, the assigned editor, and the admin. We do not share your personal data or video content with third parties. By using Videro, you consent to this data handling.",
  },
  {
    title: "7. Intellectual Property",
    content:
      "You retain full ownership of your source video content. By using Videro, you grant us a limited license to process your videos solely for the purpose of providing the editing service. Edited videos remain the property of the client. Videro does not claim any ownership over client content.",
  },
  {
    title: "8. Disclaimer",
    content:
      "Videro is provided 'as is' without warranties of any kind. We are not responsible for technical interruptions, data loss due to unforeseen circumstances, or dissatisfaction with creative output beyond reasonable standards. We recommend keeping backups of your original videos. Use of the platform constitutes acceptance of these terms.",
  },
];

// ─── Component ──────────────────────────────────────────────────────────────

export function Footer() {
  const year = new Date().getFullYear();
  // AI Assistant state
  const [aiOpen, setAiOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 0,
      role: "assistant",
      text: "Hi! I'm the Videro assistant. Ask me anything about uploading videos, pricing, payments, or how editing works.",
    },
  ]);
  const msgIdRef = useRef(1);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Conditions state
  const [conditionsOpen, setConditionsOpen] = useState(false);

  // Auto-scroll chat to bottom whenever messages change
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  });

  function handleSend() {
    const text = inputValue.trim();
    if (!text) return;

    const userMsgId = msgIdRef.current++;
    setMessages((prev) => [...prev, { id: userMsgId, role: "user", text }]);
    setInputValue("");
    setIsTyping(true);

    // Simulate a short delay for assistant response
    setTimeout(() => {
      const response = getAIResponse(text);
      const assistantMsgId = msgIdRef.current++;
      setMessages((prev) => [
        ...prev,
        { id: assistantMsgId, role: "assistant", text: response },
      ]);
      setIsTyping(false);
    }, 700);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <footer className="border-t border-border/50 bg-card/50 py-8 mt-auto">
      <div className="container mx-auto px-4">
        {/* Main row */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Brand */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Film className="w-4 h-4 text-primary" />
            <span className="font-display font-semibold text-foreground">
              Videro
            </span>
          </div>

          {/* Attribution */}
          <p className="text-xs text-muted-foreground text-center">
            © {year} Videro. All rights reserved.
          </p>

          {/* Footer links */}
          <div className="flex items-center gap-4">
            {/* AI Assistant trigger */}
            <button
              type="button"
              data-ocid="footer.ai_assistant.button"
              onClick={() => setAiOpen(true)}
              className="flex items-center gap-1.5 text-xs text-muted-foreground/70 hover:text-primary transition-colors"
            >
              <Bot className="w-3.5 h-3.5" />
              AI Assistant
            </button>

            <span className="text-muted-foreground/30 text-xs">|</span>

            {/* Conditions trigger */}
            <button
              type="button"
              data-ocid="footer.conditions.button"
              onClick={() => setConditionsOpen(true)}
              className="flex items-center gap-1.5 text-xs text-muted-foreground/70 hover:text-primary transition-colors"
            >
              <FileText className="w-3.5 h-3.5" />
              Conditions
            </button>

            <span className="text-muted-foreground/30 text-xs">|</span>

            {/* Admin link */}
            <Link
              to="/admin-login"
              data-ocid="footer.admin_login.link"
              className="text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors"
            >
              Admin
            </Link>
          </div>
        </div>
      </div>

      {/* ── AI Assistant Modal ─────────────────────────────────────────── */}
      <Dialog open={aiOpen} onOpenChange={setAiOpen}>
        <DialogContent
          data-ocid="footer.ai_assistant.dialog"
          className="sm:max-w-[440px] p-0 gap-0 overflow-hidden"
        >
          {/* Header */}
          <DialogHeader className="px-5 pt-5 pb-4 border-b border-border/50 bg-primary/5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <DialogTitle className="text-sm font-semibold leading-none">
                    Videro Assistant
                  </DialogTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Ask me anything about Videro
                  </p>
                </div>
              </div>
              <button
                type="button"
                data-ocid="footer.ai_assistant.close_button"
                onClick={() => setAiOpen(false)}
                className="text-muted-foreground hover:text-foreground transition-colors rounded-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                aria-label="Close AI assistant"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </DialogHeader>

          {/* Messages */}
          <div
            ref={scrollRef}
            className="flex flex-col gap-3 px-4 py-4 h-80 overflow-y-auto"
          >
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
              >
                {msg.role === "assistant" && (
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="w-3 h-3 text-primary" />
                  </div>
                )}
                <div
                  className={`max-w-[78%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed whitespace-pre-line ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground rounded-tr-sm"
                      : "bg-muted text-foreground rounded-tl-sm"
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {isTyping && (
              <div className="flex gap-2.5">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="w-3 h-3 text-primary" />
                </div>
                <div className="bg-muted rounded-2xl rounded-tl-sm px-3.5 py-3 flex gap-1 items-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:0ms]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:150ms]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:300ms]" />
                </div>
              </div>
            )}
          </div>

          {/* Input row */}
          <div className="px-4 pb-4 pt-2 border-t border-border/50 flex gap-2">
            <Input
              data-ocid="footer.ai_assistant.input"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask a question..."
              className="text-xs h-9"
              disabled={isTyping}
            />
            <Button
              data-ocid="footer.ai_assistant.submit_button"
              size="icon"
              className="h-9 w-9 shrink-0"
              onClick={handleSend}
              disabled={!inputValue.trim() || isTyping}
              aria-label="Send message"
            >
              <Send className="w-3.5 h-3.5" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Conditions Modal ──────────────────────────────────────────── */}
      <Dialog open={conditionsOpen} onOpenChange={setConditionsOpen}>
        <DialogContent
          data-ocid="footer.conditions.dialog"
          className="sm:max-w-[560px] p-0 gap-0 overflow-hidden max-h-[90vh] flex flex-col"
        >
          {/* Header */}
          <DialogHeader className="px-5 pt-5 pb-4 border-b border-border/50 shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <FileText className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <DialogTitle className="text-sm font-semibold leading-none">
                    Terms & Conditions
                  </DialogTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Videro Platform — Please read carefully
                  </p>
                </div>
              </div>
              <button
                type="button"
                data-ocid="footer.conditions.close_button"
                onClick={() => setConditionsOpen(false)}
                className="text-muted-foreground hover:text-foreground transition-colors rounded-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                aria-label="Close conditions"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </DialogHeader>

          {/* Scrollable content */}
          <ScrollArea className="flex-1 px-5 py-4">
            <div className="space-y-5 pb-2">
              {CONDITIONS_SECTIONS.map((section) => (
                <div key={section.title}>
                  <h3 className="text-xs font-semibold text-foreground mb-1.5 uppercase tracking-wide">
                    {section.title}
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-line">
                    {section.content}
                  </p>
                </div>
              ))}

              <div className="pt-2 border-t border-border/50">
                <p className="text-[11px] text-muted-foreground/60 italic">
                  Last updated: March 2026. By using Videro, you agree to these
                  Terms & Conditions. Videro reserves the right to update these
                  terms at any time.
                </p>
              </div>
            </div>
          </ScrollArea>

          {/* Footer action */}
          <div className="px-5 py-3 border-t border-border/50 shrink-0 flex items-center justify-between">
            <div className="flex items-center gap-1 text-xs text-muted-foreground/60">
              <ChevronDown className="w-3 h-3" />
              Scroll to read all sections
            </div>
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs"
              onClick={() => setConditionsOpen(false)}
            >
              I understand
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </footer>
  );
}

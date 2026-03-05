import { Button } from "@/components/ui/button";
import { useNavigate } from "@tanstack/react-router";
import { Home, ShieldX } from "lucide-react";
import { motion } from "motion/react";

export function AccessDenied() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="text-center max-w-md"
      >
        <div className="w-20 h-20 rounded-full bg-destructive/10 border-2 border-destructive/30 flex items-center justify-center mx-auto mb-6">
          <ShieldX className="w-10 h-10 text-destructive" />
        </div>
        <h1 className="font-display text-3xl font-black tracking-tight mb-3">
          Access Denied
        </h1>
        <p className="text-muted-foreground mb-8 leading-relaxed">
          You don't have permission to view this page. Please sign in with the
          appropriate account.
        </p>
        <Button
          data-ocid="access.home_button"
          onClick={() => navigate({ to: "/" })}
          className="bg-primary text-primary-foreground hover:bg-primary/90 font-display font-bold gap-2"
        >
          <Home className="w-4 h-4" />
          Go Home
        </Button>
      </motion.div>
    </div>
  );
}

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  CheckCircle2,
  CreditCard,
  Eye,
  EyeOff,
  Info,
  Loader2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  useIsStripeConfigured,
  useSetStripeConfiguration,
} from "../../hooks/useQueries";

export function StripeSetup() {
  const { data: isConfigured, isLoading } = useIsStripeConfigured();
  const setStripeConfiguration = useSetStripeConfiguration();

  const [secretKey, setSecretKey] = useState("");
  const [countryCodes, setCountryCodes] = useState("US, CA, GB");
  const [showKey, setShowKey] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!secretKey.trim()) {
      toast.error("Please enter your Stripe secret key.");
      return;
    }
    const allowedCountries = countryCodes
      .split(",")
      .map((c) => c.trim().toUpperCase())
      .filter(Boolean);

    try {
      await setStripeConfiguration.mutateAsync({
        secretKey: secretKey.trim(),
        allowedCountries,
      });
      toast.success("Stripe configured successfully!");
      setSecretKey("");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to configure Stripe.",
      );
    }
  };

  if (isLoading) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="pt-8 pb-8 text-center">
          <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-border max-w-xl">
      <CardHeader>
        <CardTitle className="font-display text-lg flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-primary" />
          Stripe Configuration
        </CardTitle>
        <CardDescription>
          Configure Stripe to enable payment processing for editing jobs.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isConfigured ? (
          <div className="flex items-center gap-3 p-4 rounded-lg border border-[oklch(0.68_0.18_148/0.3)] bg-[oklch(0.68_0.18_148/0.05)]">
            <CheckCircle2 className="w-5 h-5 text-[oklch(0.75_0.18_148)] flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-[oklch(0.75_0.18_148)] font-display">
                Stripe is configured
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Payments are live. You can update the configuration below.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-3 p-4 rounded-lg border border-destructive/30 bg-destructive/5 mb-6">
            <Info className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
            <p className="text-xs text-destructive/80">
              Stripe is not yet configured. Clients won't be able to complete
              payment until you set it up.
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5 mt-4">
          <div className="space-y-2">
            <Label htmlFor="stripe-key" className="font-display font-medium">
              Stripe Secret Key
            </Label>
            <div className="relative">
              <Input
                id="stripe-key"
                data-ocid="admin.stripe.input"
                type={showKey ? "text" : "password"}
                placeholder="sk_live_..."
                value={secretKey}
                onChange={(e) => setSecretKey(e.target.value)}
                className="bg-input pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showKey ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              Find this in your Stripe Dashboard → Developers → API Keys.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="countries" className="font-display font-medium">
              Allowed Countries
            </Label>
            <Input
              id="countries"
              data-ocid="admin.stripe.countries_input"
              placeholder="US, CA, GB, AU"
              value={countryCodes}
              onChange={(e) => setCountryCodes(e.target.value)}
              className="bg-input"
            />
            <p className="text-xs text-muted-foreground">
              Comma-separated ISO 3166-1 alpha-2 country codes.
            </p>
          </div>

          <Button
            data-ocid="admin.stripe.submit_button"
            type="submit"
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-display font-bold gap-2"
            disabled={setStripeConfiguration.isPending || !secretKey.trim()}
          >
            {setStripeConfiguration.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving…
              </>
            ) : isConfigured ? (
              "Update Stripe Configuration"
            ) : (
              "Configure Stripe"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

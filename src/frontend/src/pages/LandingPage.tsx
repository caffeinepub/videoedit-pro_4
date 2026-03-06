import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  CheckCircle,
  Clock,
  Download,
  Film,
  Scissors,
  Shield,
  Star,
  Upload,
  Zap,
} from "lucide-react";
import { motion } from "motion/react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.1, ease: "easeOut" as const },
  }),
};

const STEPS = [
  {
    number: "01",
    icon: Upload,
    title: "Upload Your Videos",
    description:
      "Upload your source video and a reference video showing the style or effect you want. Add notes for the editors.",
  },
  {
    number: "02",
    icon: Scissors,
    title: "Expert Editors at Work",
    description:
      "Our admin assigns your job to a vetted professional editor who brings your vision to life using industry tools.",
  },
  {
    number: "03",
    icon: Download,
    title: "Receive Your Edit",
    description:
      "Once complete, your edited video is delivered directly to your account. Download and enjoy.",
  },
];

const FEATURES = [
  { icon: Star, text: "Professional-grade editing" },
  { icon: Clock, text: "Fast turnaround" },
  { icon: Shield, text: "Secure file handling" },
  { icon: CheckCircle, text: "Admin-supervised quality" },
];

export function LandingPage() {
  const { identity } = useInternetIdentity();
  const isAuthenticated = !!identity;

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden pt-32 pb-20 px-4">
        {/* Background image */}
        <div className="absolute inset-0 z-0">
          <img
            src="/assets/generated/hero-videoedit.dim_1600x700.jpg"
            alt=""
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/80 to-background" />
          <div className="absolute inset-0 bg-gradient-to-r from-background/40 via-transparent to-background/40" />
        </div>

        {/* Amber accent line */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent z-10" />

        <div className="container mx-auto relative z-10">
          <div className="max-w-4xl">
            <motion.div
              initial="hidden"
              animate="visible"
              custom={0}
              variants={fadeUp}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-primary text-xs font-mono font-medium mb-6 tracking-wider"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              PROFESSIONAL VIDEO EDITING ON DEMAND
            </motion.div>

            <motion.h1
              initial="hidden"
              animate="visible"
              custom={1}
              variants={fadeUp}
              className="font-display text-5xl md:text-7xl font-black leading-[0.95] tracking-tight mb-6"
            >
              Your vision.
              <br />
              <span className="text-gradient-amber">Expertly edited.</span>
              <br />
              Delivered.
            </motion.h1>

            <motion.p
              initial="hidden"
              animate="visible"
              custom={2}
              variants={fadeUp}
              className="text-lg md:text-xl text-muted-foreground max-w-2xl leading-relaxed mb-10"
            >
              Upload your raw footage with a reference video, and our supervised
              team of professional editors will transform it into exactly what
              you imagined. Starting at just{" "}
              <span className="text-primary font-semibold">₹100</span>.
            </motion.p>

            <motion.div
              initial="hidden"
              animate="visible"
              custom={3}
              variants={fadeUp}
              className="flex flex-wrap items-center gap-4"
            >
              {isAuthenticated ? (
                <Button
                  data-ocid="hero.primary_button"
                  asChild
                  size="lg"
                  className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2 font-display font-bold text-base px-8 amber-glow"
                >
                  <Link to="/client/submit">
                    Submit a Job
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </Button>
              ) : (
                <Button
                  data-ocid="hero.primary_button"
                  asChild
                  size="lg"
                  className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2 font-display font-bold text-base px-8 amber-glow"
                >
                  <Link to="/">
                    Get Started
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </Button>
              )}
              <Button
                variant="ghost"
                size="lg"
                className="text-muted-foreground hover:text-foreground"
                asChild
              >
                <a href="#how-it-works">How it works →</a>
              </Button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Feature pills */}
      <section className="py-8 border-y border-border/50 bg-card/30">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap items-center justify-center gap-6">
            {FEATURES.map(({ icon: Icon, text }) => (
              <div
                key={text}
                className="flex items-center gap-2 text-sm text-muted-foreground"
              >
                <Icon className="w-4 h-4 text-primary flex-shrink-0" />
                {text}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-24 px-4">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-16"
          >
            <p className="text-xs font-mono text-primary tracking-widest mb-3">
              THE PROCESS
            </p>
            <h2 className="font-display text-4xl md:text-5xl font-black tracking-tight">
              How it works
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Connector line */}
            <div className="hidden md:block absolute top-12 left-1/3 right-1/3 h-px bg-gradient-to-r from-transparent via-border to-transparent" />

            {STEPS.map(({ number, icon: Icon, title, description }, i) => (
              <motion.div
                key={number}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.15 }}
                className="relative group"
              >
                <div className="card-glass rounded-xl p-8 h-full group-hover:shadow-card-hover transition-all duration-300">
                  <div className="flex items-start gap-4 mb-6">
                    <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <Icon className="w-6 h-6 text-primary" />
                    </div>
                    <span className="font-mono text-4xl font-black text-border/60 mt-1">
                      {number}
                    </span>
                  </div>
                  <h3 className="font-display text-xl font-bold mb-3">
                    {title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed text-sm">
                    {description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section
        id="pricing"
        className="py-24 px-4 bg-card/30 border-y border-border/50"
      >
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <p className="text-xs font-mono text-primary tracking-widest mb-3">
              PRICING
            </p>
            <h2 className="font-display text-4xl md:text-5xl font-black tracking-tight mb-4">
              Simple, flat-rate pricing
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto">
              No hidden fees. Pay once, get your video edited by a professional.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {/* Small Video Card */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <div className="card-glass rounded-2xl p-8 h-full relative overflow-hidden border border-blue-500/20 hover:border-blue-500/40 transition-colors duration-300 flex flex-col">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-60" />

                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/15 flex items-center justify-center">
                    <Zap className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-lg">
                      Small Video
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Short clips up to ~5 minutes
                    </p>
                  </div>
                </div>

                <div className="flex items-end gap-1 mb-6">
                  <span className="font-display text-5xl font-black text-blue-300">
                    ₹100
                  </span>
                  <span className="text-sm text-muted-foreground mb-1.5 font-mono">
                    /video
                  </span>
                </div>

                <ul className="space-y-2.5 mb-8 flex-1">
                  {[
                    "Upload source + reference video",
                    "Professional editor assigned",
                    "Admin-supervised quality",
                    "Delivered to your account",
                  ].map((item) => (
                    <li
                      key={item}
                      className="flex items-center gap-2.5 text-sm"
                    >
                      <CheckCircle className="w-4 h-4 text-blue-400 flex-shrink-0" />
                      <span className="text-muted-foreground">{item}</span>
                    </li>
                  ))}
                </ul>

                {isAuthenticated ? (
                  <Button
                    data-ocid="pricing.small_video.button"
                    asChild
                    size="lg"
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-display font-bold"
                  >
                    <Link to="/client/submit">Submit Small Video</Link>
                  </Button>
                ) : (
                  <p className="text-sm text-muted-foreground text-center">
                    Sign in to get started →
                  </p>
                )}
              </div>
            </motion.div>

            {/* Medium Video Card */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <div className="card-glass rounded-2xl p-8 h-full relative overflow-hidden border border-amber-500/20 hover:border-amber-500/40 transition-colors duration-300 flex flex-col">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-amber-500 to-transparent opacity-60" />

                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/15 flex items-center justify-center">
                    <Film className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-lg">
                      Medium Video
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      5–20 minute videos
                    </p>
                  </div>
                </div>

                <div className="flex items-end gap-1 mb-6">
                  <span className="font-display text-5xl font-black text-amber-300">
                    ₹500
                  </span>
                  <span className="text-sm text-muted-foreground mb-1.5 font-mono">
                    /video
                  </span>
                </div>

                <ul className="space-y-2.5 mb-8 flex-1">
                  {[
                    "Upload source + reference video",
                    "Professional editor assigned",
                    "Admin-supervised quality",
                    "Delivered to your account",
                  ].map((item) => (
                    <li
                      key={item}
                      className="flex items-center gap-2.5 text-sm"
                    >
                      <CheckCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                      <span className="text-muted-foreground">{item}</span>
                    </li>
                  ))}
                </ul>

                {isAuthenticated ? (
                  <Button
                    data-ocid="pricing.medium_video.button"
                    asChild
                    size="lg"
                    className="w-full bg-amber-600 hover:bg-amber-500 text-white font-display font-bold"
                  >
                    <Link to="/client/submit">Submit Medium Video</Link>
                  </Button>
                ) : (
                  <p className="text-sm text-muted-foreground text-center">
                    Sign in to get started →
                  </p>
                )}
              </div>
            </motion.div>

            {/* Long Video Card */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <div className="card-glass rounded-2xl p-8 h-full relative overflow-hidden border border-purple-500/20 hover:border-purple-500/40 transition-colors duration-300 flex flex-col">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-purple-500 to-transparent opacity-60" />

                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/15 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-lg">
                      Long Video
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Full-length videos & feature edits
                    </p>
                  </div>
                </div>

                <div className="flex items-end gap-1 mb-6">
                  <span className="font-display text-5xl font-black text-purple-300">
                    ₹2,000
                  </span>
                  <span className="text-sm text-muted-foreground mb-1.5 font-mono">
                    /video
                  </span>
                </div>

                <ul className="space-y-2.5 mb-8 flex-1">
                  {[
                    "Upload source + reference video",
                    "Senior editor assigned",
                    "Admin-supervised quality",
                    "Delivered to your account",
                  ].map((item) => (
                    <li
                      key={item}
                      className="flex items-center gap-2.5 text-sm"
                    >
                      <CheckCircle className="w-4 h-4 text-purple-400 flex-shrink-0" />
                      <span className="text-muted-foreground">{item}</span>
                    </li>
                  ))}
                </ul>

                {isAuthenticated ? (
                  <Button
                    data-ocid="pricing.long_video.button"
                    asChild
                    size="lg"
                    className="w-full bg-purple-700 hover:bg-purple-600 text-white font-display font-bold"
                  >
                    <Link to="/client/submit">Submit Long Video</Link>
                  </Button>
                ) : (
                  <p className="text-sm text-muted-foreground text-center">
                    Sign in to get started →
                  </p>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-4">
        <div className="container mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="font-display text-4xl md:text-5xl font-black tracking-tight mb-4">
              Ready to transform <br />
              <span className="text-gradient-amber">your footage?</span>
            </h2>
            <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
              Join videru today. Sign in and submit your first video in minutes.
            </p>
            <Button
              data-ocid="hero.primary_button"
              size="lg"
              className="bg-primary text-primary-foreground hover:bg-primary/90 font-display font-bold gap-2 px-10 amber-glow"
              asChild
            >
              <Link to={isAuthenticated ? "/client/submit" : "/"}>
                Start Now
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>
    </div>
  );
}

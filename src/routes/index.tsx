import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { Activity, Footprints, Dumbbell, Flame, ArrowRight, Sparkles } from "lucide-react";
import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import heroImg from "@/assets/hero-fitness.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "FitTrack Pro — Transform Your Fitness Journey" },
      { name: "description", content: "Track workouts, monitor calories, count steps, hit your goals — all in one premium fitness app." },
      { property: "og:title", content: "FitTrack Pro" },
      { property: "og:description", content: "Your premium fitness companion." },
    ],
  }),
  component: Landing,
});

function Landing() {
  const { user } = useAuth();
  const router = useRouter();
  useEffect(() => { if (user) router.navigate({ to: "/dashboard" }); }, [user, router]);

  const features = [
    { icon: Footprints, title: "Step Tracking", desc: "Count every step toward your daily goal with live progress.", color: "text-primary" },
    { icon: Dumbbell, title: "Workout Monitoring", desc: "Log sessions, duration, and calories burned effortlessly.", color: "text-secondary" },
    { icon: Flame, title: "Calorie Counter", desc: "Track meals and stay on top of your nutrition.", color: "text-accent" },
  ];

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      {/* Hero background */}
      <div className="absolute inset-0">
        <img src={heroImg} alt="Fitness hero" width={1536} height={1024} className="h-full w-full object-cover" />
        <div className="absolute inset-0" style={{ background: "var(--gradient-hero)" }} />
      </div>

      <div className="relative z-10">
        {/* Header */}
        <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
          <div className="flex items-center gap-2">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-[image:var(--gradient-primary)] glow-primary animate-pulse-glow">
              <Activity className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-display text-xl font-bold">FitTrack <span className="gradient-text">Pro</span></span>
          </div>
          <Link to="/auth" className="rounded-xl glass px-4 py-2 text-sm font-medium hover:bg-white/10 transition">Sign in</Link>
        </header>

        {/* Hero content */}
        <section className="mx-auto max-w-5xl px-6 pt-20 pb-16 text-center md:pt-32">
          <div className="animate-fade-up inline-flex items-center gap-2 rounded-full glass px-4 py-1.5 text-xs font-medium text-primary">
            <Sparkles className="h-3.5 w-3.5" /> Your premium fitness companion
          </div>
          <h1 className="animate-fade-up mt-6 font-display text-5xl font-bold leading-[1.05] tracking-tight md:text-7xl">
            Transform Your<br /><span className="gradient-text">Fitness Journey</span>
          </h1>
          <p className="animate-fade-up mx-auto mt-6 max-w-2xl text-base text-muted-foreground md:text-lg" style={{ animationDelay: "0.1s" }}>
            Track workouts, monitor calories, achieve goals, and stay healthy every day with a beautiful, motivating experience.
          </p>

          <div className="animate-fade-up mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row" style={{ animationDelay: "0.2s" }}>
            <Link to="/auth"
              className="group inline-flex items-center gap-2 rounded-2xl bg-[image:var(--gradient-primary)] px-8 py-4 text-base font-bold text-primary-foreground glow-primary transition-transform hover:scale-105 animate-pulse-glow">
              Get Started
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>
            <a href="#features" className="rounded-2xl glass px-8 py-4 text-base font-medium hover:bg-white/10 transition">Learn more</a>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="mx-auto grid max-w-6xl gap-6 px-6 pb-24 md:grid-cols-3">
          {features.map((f, i) => (
            <div key={f.title}
              className="glass-card group animate-fade-up rounded-3xl p-6 transition-all hover:-translate-y-2 hover:border-primary/40"
              style={{ animationDelay: `${0.3 + i * 0.1}s` }}>
              <div className={`mb-4 inline-grid h-14 w-14 place-items-center rounded-2xl bg-white/5 ${f.color} transition-transform group-hover:scale-110`}>
                <f.icon className="h-7 w-7" />
              </div>
              <h3 className="font-display text-xl font-bold">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </section>

        <footer className="border-t border-white/5 py-6 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} FitTrack Pro. Built for movement.
        </footer>
      </div>
    </div>
  );
}

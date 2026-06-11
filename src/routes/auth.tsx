import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Activity, Mail, Lock, User as UserIcon, Loader2 } from "lucide-react";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  sendPasswordResetEmail,
} from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/integrations/firebase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { lovable } from "@/integrations/lovable";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Sign in — FitTrack Pro" }, { name: "description", content: "Sign in or create your FitTrack Pro account." }] }),
  component: AuthPage,
});

type Tab = "signin" | "signup";

function AuthPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>("signin");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });

  useEffect(() => { if (user) router.navigate({ to: "/dashboard" }); }, [user, router]);

  const upd = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: e.target.value });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (tab === "signin") {
        await signInWithEmailAndPassword(auth, form.email, form.password);
        toast.success("Welcome back!");
        router.navigate({ to: "/dashboard" });
      } else {
        if (form.password !== form.confirm) throw new Error("Passwords don't match");
        const credential = await createUserWithEmailAndPassword(auth, form.email, form.password);
        // Update display name
        if (form.name && credential.user) {
          await updateProfile(credential.user, { displayName: form.name });
        }
        // Create profile document in Firestore
        await setDoc(doc(db, "profiles", credential.user.uid), {
          id: credential.user.uid,
          email: form.email,
          full_name: form.name || null,
          daily_step_goal: 10000,
          daily_calorie_goal: 2000,
          daily_water_goal: 8,
          created_at: serverTimestamp(),
          updated_at: serverTimestamp(),
        });
        toast.success("Account created!");
        router.navigate({ to: "/dashboard" });
      }
    } catch (err: any) {
      const code = err?.code ?? '';
      const msg: Record<string, string> = {
        'auth/email-already-in-use': 'This email is already registered. Try signing in.',
        'auth/weak-password': 'Password must be at least 6 characters.',
        'auth/invalid-email': 'Please enter a valid email address.',
        'auth/user-not-found': 'No account found with this email.',
        'auth/wrong-password': 'Incorrect password. Please try again.',
        'auth/invalid-credential': 'Invalid email or password.',
        'auth/too-many-requests': 'Too many attempts. Please try again later.',
        'auth/operation-not-allowed': 'Email/Password sign-in is not enabled. Enable it in Firebase Console.',
      };
      toast.error(msg[code] ?? err.message ?? 'Something went wrong');
    } finally { setLoading(false); }
  }

  async function onGoogle() {
    try {
      const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/dashboard" });
      if (result.error) { toast.error("Google sign-in failed"); return; }
      if (result.redirected) return;
      router.navigate({ to: "/dashboard" });
    } catch { toast.error("Google sign-in failed"); }
  }

  async function onForgot() {
    if (!form.email) { toast.error("Enter your email first"); return; }
    try {
      await sendPasswordResetEmail(auth, form.email, { url: window.location.origin + "/auth" });
      toast.success("Check your email for reset link");
    } catch (err: any) {
      toast.error(err.message ?? "Failed to send reset email");
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-background px-4 py-10">
      {/* Ambient glow */}
      <div className="pointer-events-none absolute -top-32 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-primary/20 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-96 w-96 rounded-full bg-secondary/15 blur-3xl" />

      <div className="relative mx-auto max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-[image:var(--gradient-primary)] glow-primary animate-pulse-glow">
            <Activity className="h-7 w-7 text-primary-foreground" />
          </div>
          <h1 className="font-display text-3xl font-bold">FitTrack <span className="gradient-text">Pro</span></h1>
          <p className="mt-1 text-sm text-muted-foreground">Your fitness journey starts here</p>
        </div>

        <div className="glass-card animate-scale-in rounded-3xl p-6">
          {/* Tabs */}
          <div className="relative mb-6 grid grid-cols-2 rounded-2xl bg-white/5 p-1">
            <div className={`absolute inset-y-1 w-[calc(50%-4px)] rounded-xl bg-[image:var(--gradient-primary)] transition-transform duration-300 ${tab === "signup" ? "translate-x-[calc(100%+8px)]" : "translate-x-1"}`} />
            {(["signin", "signup"] as const).map((t) => (
              <button suppressHydrationWarning key={t} type="button" onClick={() => setTab(t)}
                className={`relative z-10 py-2.5 text-sm font-semibold transition ${tab === t ? "text-primary-foreground" : "text-muted-foreground"}`}>
                {t === "signin" ? "Sign In" : "Sign Up"}
              </button>
            ))}
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            {tab === "signup" && (
              <Field icon={UserIcon} placeholder="Full name" value={form.name} onChange={upd("name")} required />
            )}
            <Field icon={Mail} type="email" placeholder="Email" value={form.email} onChange={upd("email")} required />
            <Field icon={Lock} type="password" placeholder="Password" value={form.password} onChange={upd("password")} required minLength={6} />
            {tab === "signup" && (
              <Field icon={Lock} type="password" placeholder="Confirm password" value={form.confirm} onChange={upd("confirm")} required minLength={6} />
            )}

            {tab === "signin" && (
              <button suppressHydrationWarning type="button" onClick={onForgot} className="block w-full text-right text-xs text-secondary hover:underline">
                Forgot password?
              </button>
            )}

            <button suppressHydrationWarning type="submit" disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[image:var(--gradient-primary)] py-3.5 font-semibold text-primary-foreground glow-primary transition hover:scale-[1.02] disabled:opacity-60">
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {tab === "signin" ? "Sign In" : "Create Account"}
            </button>
          </form>

          <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
            <div className="h-px flex-1 bg-white/10" /> OR <div className="h-px flex-1 bg-white/10" />
          </div>

          <button suppressHydrationWarning onClick={onGoogle}
            className="flex w-full items-center justify-center gap-3 rounded-2xl glass py-3 text-sm font-medium hover:bg-white/10 transition">
            <GoogleIcon /> Continue with Google
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ icon: Icon, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { icon: React.ComponentType<any> }) {
  return (
    <div className="group relative">
      <Icon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition group-focus-within:text-primary" />
      <input suppressHydrationWarning {...props}
        className="w-full rounded-2xl border border-white/10 bg-white/5 py-3.5 pl-11 pr-4 text-sm outline-none transition placeholder:text-muted-foreground focus:border-primary/50 focus:bg-white/10 focus:ring-2 focus:ring-primary/30" />
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.4 29.3 35.5 24 35.5c-6.4 0-11.5-5.1-11.5-11.5S17.6 12.5 24 12.5c2.9 0 5.6 1.1 7.7 2.9l5.7-5.7C33.9 6.5 29.2 4.5 24 4.5 13.2 4.5 4.5 13.2 4.5 24S13.2 43.5 24 43.5 43.5 34.8 43.5 24c0-1.2-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8c1.8-3.5 5.4-6 9.6-6 2.9 0 5.6 1.1 7.7 2.9l5.7-5.7C33.9 6.5 29.2 4.5 24 4.5 16.3 4.5 9.7 8.9 6.3 14.7z"/><path fill="#4CAF50" d="M24 43.5c5.1 0 9.8-2 13.3-5.2l-6.1-5c-2 1.4-4.5 2.2-7.2 2.2-5.3 0-9.7-3.1-11.3-7.5l-6.5 5C9.6 39.1 16.2 43.5 24 43.5z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.2-4.2 5.5l6.1 5c-.4.4 6.8-5 6.8-14.5 0-1.2-.1-2.4-.4-3.5z"/></svg>
  );
}

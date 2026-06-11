import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { ProgressRing } from "@/components/ProgressRing";
import { db } from "@/integrations/firebase/client";
import { useAuth } from "@/hooks/use-auth";
import { collection, doc, getDoc, getDocs, setDoc, updateDoc, query, where, serverTimestamp } from "firebase/firestore";
import { Footprints, Award, Plus, Minus, Droplets } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import type { FitnessData, Profile } from "@/integrations/firebase/types";

export const Route = createFileRoute("/steps")({
  head: () => ({ meta: [{ title: "Steps — FitTrack Pro" }, { name: "description", content: "Track your daily steps and water intake." }] }),
  component: StepsPage,
});

function StepsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const today = format(new Date(), "yyyy-MM-dd");
  const [steps, setSteps] = useState(0);
  const [water, setWater] = useState(0);

  const { data } = useQuery({
    queryKey: ["fitness-today", user?.uid, today],
    enabled: !!user,
    queryFn: async () => {
      const q = query(
        collection(db, "fitness_data"),
        where("user_id", "==", user!.uid),
        where("log_date", "==", today)
      );
      const snapshot = await getDocs(q);
      if (snapshot.empty) return null;
      const docSnap = snapshot.docs[0];
      return { id: docSnap.id, ...docSnap.data() } as FitnessData;
    },
  });

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.uid], enabled: !!user,
    queryFn: async () => {
      const docRef = doc(db, "profiles", user!.uid);
      const docSnap = await getDoc(docRef);
      return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } as Profile : null;
    },
  });

  useEffect(() => {
    if (data) { setSteps(data.steps ?? 0); setWater(data.water_intake ?? 0); }
  }, [data]);

  const goal = profile?.daily_step_goal ?? 10000;
  const waterGoal = profile?.daily_water_goal ?? 8;

  async function persist(newSteps: number, newWater: number) {
    if (!user) return;
    // Find existing fitness data for today or create new
    const q = query(
      collection(db, "fitness_data"),
      where("user_id", "==", user.uid),
      where("log_date", "==", today)
    );
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      // Create new document
      const newDocRef = doc(collection(db, "fitness_data"));
      await setDoc(newDocRef, {
        id: newDocRef.id,
        user_id: user.uid,
        log_date: today,
        steps: newSteps,
        water_intake: newWater,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
      });
    } else {
      // Update existing document
      const docRef = snapshot.docs[0].ref;
      await updateDoc(docRef, {
        steps: newSteps,
        water_intake: newWater,
        updated_at: serverTimestamp(),
      });
    }
    qc.invalidateQueries({ queryKey: ["fitness-today"] });
  }

  async function setStepCount(v: number) {
    const n = Math.max(0, v);
    setSteps(n);
    await persist(n, water);
  }
  async function bumpWater(d: number) {
    const n = Math.max(0, water + d);
    setWater(n);
    await persist(steps, n);
    if (d > 0) toast.success("Water logged 💧");
  }

  const badges = [
    { goal: 5000, label: "5K Steps" },
    { goal: 10000, label: "10K Steps" },
    { goal: 15000, label: "15K Steps" },
  ];

  return (
    <AppShell>
      <div className="space-y-6">
        <section className="glass-card animate-fade-up rounded-3xl p-8 text-center">
          <div className="flex justify-center">
            <ProgressRing value={steps} max={goal} size={260} stroke={20} color="var(--color-primary)"
              label={steps.toLocaleString()} sub={`of ${goal.toLocaleString()} steps`} />
          </div>
          <div className="mx-auto mt-6 flex max-w-xs items-center justify-center gap-3">
            <button onClick={() => setStepCount(steps - 500)} className="rounded-2xl glass p-3 hover:bg-white/10"><Minus className="h-5 w-5" /></button>
            <input type="number" value={steps} onChange={(e) => setStepCount(Number(e.target.value))}
              className="flex-1 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-center font-display text-lg font-bold outline-none focus:border-primary/50" />
            <button onClick={() => setStepCount(steps + 500)} className="rounded-2xl glass p-3 hover:bg-white/10"><Plus className="h-5 w-5" /></button>
          </div>
          <p className="mt-3 text-xs text-muted-foreground"><Footprints className="mr-1 inline h-3 w-3" /> Update your step count manually</p>
        </section>

        <section>
          <h3 className="mb-3 font-display text-lg font-bold flex items-center gap-2"><Award className="h-5 w-5 text-accent" /> Achievement Badges</h3>
          <div className="grid grid-cols-3 gap-3">
            {badges.map((b, i) => {
              const achieved = steps >= b.goal;
              return (
                <div key={b.label}
                  className={`glass-card animate-fade-up rounded-3xl p-5 text-center transition ${achieved ? "border-primary/40 glow-primary" : "opacity-50"}`}
                  style={{ animationDelay: `${i * 0.05}s` }}>
                  <div className={`mx-auto grid h-12 w-12 place-items-center rounded-2xl ${achieved ? "bg-[image:var(--gradient-primary)]" : "bg-white/5"}`}>
                    <Award className={`h-6 w-6 ${achieved ? "text-primary-foreground" : "text-muted-foreground"}`} />
                  </div>
                  <div className="mt-2 font-display text-sm font-bold">{b.label}</div>
                  <div className="text-[10px] text-muted-foreground">{achieved ? "Unlocked!" : "Locked"}</div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="glass-card animate-fade-up rounded-3xl p-6">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-lg font-bold flex items-center gap-2"><Droplets className="h-5 w-5 text-secondary" /> Water Intake</h3>
            <span className="text-sm font-semibold">{water} / {waterGoal} cups</span>
          </div>
          <div className="mt-4 grid grid-cols-8 gap-2">
            {Array.from({ length: waterGoal }).map((_, i) => (
              <button key={i} onClick={() => bumpWater(i < water ? -(water - i) : 1 + (i - water))}
                className={`aspect-square rounded-xl transition ${i < water ? "bg-[image:var(--gradient-primary)] glow-blue" : "bg-white/5 hover:bg-white/10"}`}>
                <Droplets className={`mx-auto h-5 w-5 ${i < water ? "text-primary-foreground" : "text-muted-foreground"}`} />
              </button>
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
}

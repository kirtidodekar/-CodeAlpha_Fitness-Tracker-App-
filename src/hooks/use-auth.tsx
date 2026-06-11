import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { onAuthStateChanged, signOut as firebaseSignOut, type User } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/integrations/firebase/client";

interface AuthCtx {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const Ctx = createContext<AuthCtx>({ user: null, loading: true, signOut: async () => {} });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      // Set user immediately so the app doesn't block on Firestore writes
      setUser(firebaseUser);
      setLoading(false);

      // Write profile doc in the background (fire-and-forget)
      if (firebaseUser) {
        const profileRef = doc(db, "profiles", firebaseUser.uid);
        setDoc(profileRef, {
          id: firebaseUser.uid,
          email: firebaseUser.email,
          full_name: firebaseUser.displayName || null,
          updated_at: serverTimestamp(),
        }, { merge: true }).catch((err) => {
          console.error("[Auth] Failed to write profile document:", err);
        });
      }
    });
    return () => unsubscribe();
  }, []);

  return (
    <Ctx.Provider value={{ user, loading, signOut: async () => { await firebaseSignOut(auth); } }}>
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => useContext(Ctx);

import { useState, useEffect } from "react";
import { supabase } from "./supabase";
import Auth from "./components/Auth";
import Dashboard from "./components/Dashboard";

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) return (
    <div style={{
      minHeight: "100vh", background: "#1a1a1a",
      display: "flex", alignItems: "center", justifyContent: "center",
      color: "#ffa116", fontSize: "14px", fontFamily: "sans-serif",
    }}>
      Loading…
    </div>
  );

  return user ? <Dashboard user={user} /> : <Auth />;
}
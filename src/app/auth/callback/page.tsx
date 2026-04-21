"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function Callback() {
  const router = useRouter();

  useEffect(() => {
    // 1. Create a function to handle the logic
    const handleAuth = async (user: any) => {
      // Check if profile exists
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      if (!profile) {
        // Fallback for new users
        await supabase.from("profiles").insert({
          id: user.id,
          role: "guardian",
          full_name: user.user_metadata?.full_name || user.user_metadata?.name || "Unknown",
        });
        router.push("/dashboard");
      } else {
        // Redirect based on role
        if (profile.role === "admin") router.push("/admin");
        else if (profile.role === "finance") router.push("/finance");
        else router.push("/dashboard");
      }
    };

    // 2. Listen for the INITIAL session or an AUTH STATE CHANGE
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session) {
        await handleAuth(session.user);
      } else if (event === "INITIAL_SESSION" && !session) {
        // Only redirect to login if we are absolutely sure there is no session coming
        // Give it a tiny delay to be safe
        setTimeout(() => {
           // We check one last time before giving up
           supabase.auth.getSession().then(({data}) => {
             if (!data.session) router.push("/login");
           });
        }, 1500);
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  return (
    <div className="p-10 flex flex-col items-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mb-4"></div>
      <p>Finalizing your sign-in...</p>
    </div>
  );
}

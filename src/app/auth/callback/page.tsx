"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const processAuth = async () => {
      // 1. Give the Supabase library a moment to parse the fragment
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error || !session) {
        // If we still don't have a session, wait a brief moment and retry once
        setTimeout(async () => {
          const { data: { session: retrySession } } = await supabase.auth.getSession();
          if (retrySession) {
            handleRedirect(retrySession.user);
          } else {
            router.push("/login?error=session_not_found");
          }
        }, 1500);
        return;
      }

      handleRedirect(session.user);
    };

    const handleRedirect = async (user: any) => {
      // 2. Fetch the profile to know where to send them
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      if (!profile) {
        // Create the profile if it doesn't exist (First time Google users)
        await supabase.from("profiles").insert({
          id: user.id,
          role: "guardian",
          full_name: user.user_metadata?.full_name || "New User",
        });
        router.push("/dashboard");
      } else {
        // Redirect based on role
        if (profile.role === "admin") router.push("/admin");
        else if (profile.role === "finance") router.push("/finance");
        else router.push("/dashboard");
      }
    };

    processAuth();
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
        <p className="text-lg">Finalizing your login...</p>
      </div>
    </div>
  );
}

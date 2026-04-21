"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function Callback() {
  const router = useRouter();
  const processed = useRef(false); // Prevent double-running

  useEffect(() => {
    const handleCallback = async () => {
      if (processed.current) return;

      // 1. Give the Supabase client a moment to parse the URL hash
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        console.error("Auth error:", error.message);
        router.push("/login");
        return;
      }

      if (session) {
        processed.current = true;
        const user = session.user;

        // 2. Fetch the profile
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .maybeSingle();

        if (!profile) {
          // Create profile if missing
          await supabase.from("profiles").insert({
            id: user.id,
            role: "guardian",
            full_name: user.user_metadata?.full_name || user.user_metadata?.name || "New User",
          });
          router.push("/dashboard");
        } else {
          // Role-based redirect
          if (profile.role === "admin") router.push("/admin");
          else if (profile.role === "finance") router.push("/finance");
          else router.push("/dashboard");
        }
      } else {
        // 3. If no session yet, wait a bit. OAuth redirects can be slow.
        setTimeout(async () => {
          const { data: { session: retrySession } } = await supabase.auth.getSession();
          if (!retrySession) router.push("/login");
          else handleCallback(); // Recurse once if session found
        }, 2000);
      }
    };

    handleCallback();
  }, [router]);

  return (
    <div className="p-10 flex flex-col items-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mb-4"></div>
      <p>Verifying credentials...</p>
    </div>
  );
}

"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface UserProfile {
  role: "admin" | "operator";
  konterId: string | null; // null untuk admin
  namaLengkap: string;
}

export function useUserProfile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function ambil() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from("user_profiles")
        .select("role, konter_id, nama_lengkap")
        .eq("id", user.id)
        .single();

      if (data) {
        setProfile({
          role: data.role,
          konterId: data.konter_id,
          namaLengkap: data.nama_lengkap,
        });
      }
      setLoading(false);
    }
    ambil();
  }, []);

  return { profile, loading };
}

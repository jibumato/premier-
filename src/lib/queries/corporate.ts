"use client";

import { useMutation } from "@tanstack/react-query";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

/** Capture a corporate advertising lead (self-serve; review is automated). */
export function useSubmitCorporateLead() {
  return useMutation({
    mutationFn: async ({
      company,
      email,
      plan,
      message,
    }: {
      company: string;
      email: string;
      plan?: string;
      message?: string;
    }) => {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase
        .from("corporate_leads")
        .insert({ company, email, plan: plan || null, message: message || null });
      if (error) throw error;
    },
  });
}

"use client";

import { useRouter } from "../AppRouter";
import { AppBar } from "../ui";
import { TermsContent } from "../TermsContent";

export function TermsScreen() {
  const { back } = useRouter();
  return (
    <div style={{ paddingBottom: 30 }}>
      <AppBar title="利用規約・ガイドライン" onBack={back} />
      <div style={{ padding: "10px 22px 0" }}>
        <TermsContent />
      </div>
    </div>
  );
}

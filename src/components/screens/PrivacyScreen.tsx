"use client";

import { useRouter } from "../AppRouter";
import { AppBar } from "../ui";
import { PrivacyContent } from "../PrivacyContent";

export function PrivacyScreen() {
  const { back } = useRouter();
  return (
    <div style={{ paddingBottom: 30 }}>
      <AppBar title="プライバシーポリシー" onBack={back} />
      <div style={{ padding: "10px 22px 0" }}>
        <PrivacyContent />
      </div>
    </div>
  );
}

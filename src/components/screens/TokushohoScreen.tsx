"use client";

import { useRouter } from "../AppRouter";
import { AppBar } from "../ui";
import { TokushohoContent } from "../TokushohoContent";

export function TokushohoScreen() {
  const { back } = useRouter();
  return (
    <div style={{ paddingBottom: 30 }}>
      <AppBar title="特定商取引法に基づく表記" onBack={back} />
      <div style={{ padding: "10px 22px 0" }}>
        <TokushohoContent />
      </div>
    </div>
  );
}

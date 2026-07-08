"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { colors } from "@/lib/tokens";
import { useRouter } from "../AppRouter";
import { PrimaryButton } from "../ui";
import { OnboardProgress } from "./onboardProgress";
import { CameraIcon, PlusIcon, UserIcon } from "../icons";
import { useAuth } from "@/lib/auth/useAuth";
import { useUpdateProfileRole } from "@/lib/queries/profile";
import type { UserRole } from "@/lib/database.types";

type Role = UserRole;

const roles: { key: Role; title: string; desc: string; icon: ReactNode }[] = [
  { key: "layer", title: "コスプレイヤー", desc: "被写体として活動する", icon: <UserIcon size={24} color={colors.primary} /> },
  { key: "photographer", title: "カメラマン", desc: "撮る・併せに参加する", icon: <CameraIcon size={24} /> },
  { key: "both", title: "両方", desc: "撮るのも撮られるのも", icon: <PlusIcon size={24} color={colors.textMuted} /> },
];

export function OnboardRoleScreen() {
  const { nav } = useRouter();
  const { user } = useAuth();
  const updateRole = useUpdateProfileRole();
  const [selected, setSelected] = useState<Role>("layer");

  // Persist the selection when a backend + session exist; otherwise this is a
  // pure prototype step. Navigation happens regardless (fire-and-forget save).
  const handleNext = () => {
    if (user) {
      updateRole.mutate({ userId: user.id, role: selected });
    }
    nav("onboardWorks");
  };

  return (
    <div style={{ minHeight: "100%", display: "flex", flexDirection: "column" }}>
      <OnboardProgress step={1} />

      <div style={{ padding: "30px 26px 0" }}>
        <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: ".06em", color: colors.textPrimary }}>
          プルミエ<span style={{ color: colors.pink }}>！</span>
        </div>
        <h2 style={{ margin: "22px 0 0", fontSize: 24, lineHeight: 1.5, fontWeight: 700, color: colors.textPrimary }}>
          はじめまして。
          <br />
          どんな活動をしますか？
        </h2>
        <p style={{ margin: "12px 0 0", fontSize: 13, color: colors.textMuted, lineHeight: 1.8 }}>
          あとから変更できます。両方えらんでもOK。
        </p>
      </div>

      <div style={{ padding: "26px 22px 0", display: "flex", flexDirection: "column", gap: 12 }}>
        {roles.map((r) => {
          const on = selected === r.key;
          return (
            <button
              key={r.key}
              onClick={() => setSelected(r.key)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                border: `${on ? 2 : 1.5}px solid ${on ? colors.primary : colors.border}`,
                borderRadius: 18,
                padding: on ? "16px 15px" : "16.5px 16px",
                background: on ? colors.primaryBg5 : colors.white,
                cursor: "pointer",
                fontFamily: "inherit",
                textAlign: "left",
                width: "100%",
              }}
            >
              <span
                style={{
                  flex: "0 0 46px",
                  height: 46,
                  borderRadius: 13,
                  background: on ? colors.primaryBg1 : "#F4F1FA",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {r.icon}
              </span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: colors.textPrimary }}>{r.title}</div>
                <div style={{ fontSize: 11.5, color: colors.textMutedAlt, marginTop: 2 }}>{r.desc}</div>
              </div>
              {on ? (
                <svg width="22" height="22" viewBox="0 0 24 24" fill={colors.primary}>
                  <circle cx="12" cy="12" r="10" />
                  <path d="M8 12l3 3 5-5" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : (
                <span style={{ width: 22, height: 22, borderRadius: "50%", border: "2px solid #DDD8E8", flex: "0 0 auto" }} />
              )}
            </button>
          );
        })}
      </div>

      <div style={{ padding: "26px 22px 30px", marginTop: "auto" }}>
        <PrimaryButton onClick={handleNext}>次へ</PrimaryButton>
      </div>
    </div>
  );
}

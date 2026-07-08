/**
 * Design tokens for プルミエ！
 * Mirrors the "Design Tokens" section of the design handoff README.
 * Keep this file the single source of truth for colors / radius / shadow.
 */

export const colors = {
  // Primary (lavender)
  primary: "#6D5DAB",
  primaryDark: "#4C3E82",
  primaryGradientLight: "#8B79C4",

  // Primary light backgrounds
  primaryBg1: "#EFEBF8",
  primaryBg2: "#F2EDFB",
  primaryBg3: "#F7EEF6",
  primaryBg4: "#F8F6FC",
  primaryBg5: "#FBFAFE",

  // Accent (pink) — tip / support / emphasis
  pink: "#D06CA3",
  pinkAlt: "#B063C0",
  pinkText: "#B0538D",
  pinkBg1: "#FBEDF4",
  pinkBg2: "#FBE9F2",

  // Text
  textPrimary: "#26222F",
  textPrimaryAlt: "#2A2634",
  textSecondary: "#5A5468",
  textSecondaryAlt: "#6E6880",
  textMuted: "#8B84A0",
  textMutedAlt: "#9B94AB",
  textMutedSoft: "#B4AEC0",

  // Borders
  border: "#E4DFEF",
  borderSoft: "#EDEAF3",
  borderSofter: "#F0EDF6",

  // Status
  positive: "#3F9B6E",
  starGold: "#E0A93B",

  white: "#FFFFFF",
  // Canvas outside the phone frame (prototype only)
  canvas: "#E9E6EF",
} as const;

export const radius = {
  chip: 999,
  card: 18,
  cardSm: 14,
  cardLg: 24,
  search: 15,
  input: 13,
} as const;

export const shadow = {
  phone: "0 44px 100px -34px rgba(58,40,84,.5),0 0 0 1px rgba(30,20,50,.05)",
  searchBar: "0 14px 34px -22px rgba(80,58,130,.5)",
  fab: "0 8px 18px -8px rgba(109,93,171,.7)",
} as const;

/** conic gradient ring used around monetizable avatars */
export const avatarRing =
  "conic-gradient(from 140deg,#D06CA3,#9B84D6,#6D5DAB,#D06CA3)";

/** Content horizontal padding (22px content, 18px on search/detail app bars) */
export const pad = {
  content: 22,
  appBar: 18,
} as const;

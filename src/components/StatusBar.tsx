import { colors } from "@/lib/tokens";

/** iOS-style status bar pinned to the top of the phone frame. */
export function StatusBar() {
  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: 44,
        zIndex: 20,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "15px 28px 0",
        fontSize: 13,
        fontWeight: 600,
        color: colors.textPrimaryAlt,
        background: colors.white,
      }}
    >
      <span style={{ letterSpacing: ".02em" }}>9:41</span>
      <span style={{ display: "flex", gap: 7, alignItems: "center" }}>
        {/* signal */}
        <svg width="17" height="11" viewBox="0 0 17 11" fill={colors.textPrimaryAlt}>
          <rect x="0" y="7" width="3" height="4" rx="1" />
          <rect x="4.5" y="5" width="3" height="6" rx="1" />
          <rect x="9" y="2.5" width="3" height="8.5" rx="1" />
          <rect x="13.5" y="0" width="3" height="11" rx="1" />
        </svg>
        {/* wifi */}
        <svg width="16" height="11" viewBox="0 0 16 12" fill="none" stroke={colors.textPrimaryAlt} strokeWidth="1.4">
          <path d="M1 4.5C3 2.5 5.3 1.4 8 1.4S13 2.5 15 4.5" />
          <path d="M3.6 7.2C4.8 6 6.3 5.4 8 5.4s3.2.6 4.4 1.8" />
          <circle cx="8" cy="10" r="1" fill={colors.textPrimaryAlt} stroke="none" />
        </svg>
        {/* battery */}
        <svg width="25" height="12" viewBox="0 0 25 12" fill="none">
          <rect x="1" y="1" width="20" height="10" rx="3" stroke={colors.textPrimaryAlt} strokeOpacity=".5" />
          <rect x="3" y="3" width="15" height="6" rx="1.5" fill={colors.textPrimaryAlt} />
          <rect x="22.5" y="4" width="1.6" height="4" rx=".8" fill={colors.textPrimaryAlt} fillOpacity=".5" />
        </svg>
      </span>
    </div>
  );
}

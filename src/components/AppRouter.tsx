"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Screen, Tab } from "@/lib/types";

interface RouterState {
  screen: Screen;
  tab: Tab;
  region: string;
  /** awase.id backing the current `detail` screen, once a backend is connected. */
  selectedAwaseId: string | null;
  /** conversation.id backing the current `chat` screen, once a backend is connected. */
  selectedConversationId: string | null;
}

interface RouterApi extends RouterState {
  /** navigate to a screen, pushing current screen onto the back stack */
  nav: (screen: Screen, tab?: Tab) => void;
  /** pop the back stack (bottom-nav-aware, mirrors prototype back()) */
  back: () => void;
  setRegion: (r: string) => void;
  /** navigate to `detail` for a specific real awase row */
  openAwase: (awaseId: string) => void;
  /** navigate to `chat` for a specific real conversation row */
  openChat: (conversationId: string) => void;
  /** ref attached to the scroll container so nav can reset scrollTop */
  scrollRef: React.RefObject<HTMLDivElement | null>;
}

const RouterContext = createContext<RouterApi | null>(null);

/**
 * Client-side screen router mirroring the DCLogic state machine in
 * clickable_prototype.dc.html: { screen, tab, history, region }.
 * `history` is a simple screen stack; back() pops it and, when returning to a
 * primary tab screen, restores that tab.
 */
export function AppRouterProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<RouterState>({
    screen: "home",
    tab: "home",
    region: "すべて",
    selectedAwaseId: null,
    selectedConversationId: null,
  });
  const historyRef = useRef<Screen[]>([]);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const resetScroll = useCallback(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }, []);

  const nav = useCallback(
    (screen: Screen, tab?: Tab) => {
      setState((s) => {
        historyRef.current = [...historyRef.current, s.screen];
        return { ...s, screen, tab: tab ?? s.tab };
      });
      resetScroll();
    },
    [resetScroll]
  );

  const back = useCallback(() => {
    setState((s) => {
      const h = [...historyRef.current];
      const prev = (h.pop() ?? "home") as Screen;
      historyRef.current = h;
      const tab: Tab =
        prev === "home" || prev === "search"
          ? prev
          : prev === "profile"
            ? "mypage"
            : s.tab;
      return { ...s, screen: prev, tab };
    });
    resetScroll();
  }, [resetScroll]);

  const setRegion = useCallback((region: string) => {
    setState((s) => ({ ...s, region }));
  }, []);

  const openAwase = useCallback(
    (awaseId: string) => {
      setState((s) => {
        historyRef.current = [...historyRef.current, s.screen];
        return { ...s, screen: "detail", selectedAwaseId: awaseId };
      });
      resetScroll();
    },
    [resetScroll]
  );

  const openChat = useCallback(
    (conversationId: string) => {
      setState((s) => {
        historyRef.current = [...historyRef.current, s.screen];
        return { ...s, screen: "chat", selectedConversationId: conversationId };
      });
      resetScroll();
    },
    [resetScroll]
  );

  const api = useMemo<RouterApi>(
    () => ({ ...state, nav, back, setRegion, openAwase, openChat, scrollRef }),
    [state, nav, back, setRegion, openAwase, openChat]
  );

  return <RouterContext.Provider value={api}>{children}</RouterContext.Provider>;
}

export function useRouter(): RouterApi {
  const ctx = useContext(RouterContext);
  if (!ctx) throw new Error("useRouter must be used within AppRouterProvider");
  return ctx;
}

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
  /** profile.id backing the current `profile` screen when viewing someone
   * else's profile; null means "the signed-in user's own profile". */
  selectedProfileId: string | null;
  /** qa_question.id backing the current `qaDetail` screen, once a backend is connected. */
  selectedQaQuestionId: string | null;
  /** event.id backing the current `eventDetail` screen, once a backend is connected. */
  selectedEventId: string | null;
  /** market_item.id backing the current `marketDetail` screen, once a backend is connected. */
  selectedMarketItemId: string | null;
}

interface RouterApi extends RouterState {
  /** navigate to a screen, pushing current screen onto the back stack.
   * Navigating to "profile" this way always means "my own profile" — it
   * resets selectedProfileId; use openProfile() to view someone else's. */
  nav: (screen: Screen, tab?: Tab) => void;
  /** pop the back stack (bottom-nav-aware, mirrors prototype back()) */
  back: () => void;
  setRegion: (r: string) => void;
  /** navigate to `detail` for a specific real awase row */
  openAwase: (awaseId: string) => void;
  /** navigate to `chat` for a specific real conversation row */
  openChat: (conversationId: string) => void;
  /** navigate to `profile` for a specific real user (not the signed-in user) */
  openProfile: (userId: string) => void;
  /** navigate to `qaDetail` for a specific real question row */
  openQaQuestion: (questionId: string) => void;
  /** navigate to `eventDetail` for a specific real event row */
  openEvent: (eventId: string) => void;
  /** navigate to `marketDetail` for a specific real listing row */
  openMarketItem: (itemId: string) => void;
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
    selectedProfileId: null,
    selectedQaQuestionId: null,
    selectedEventId: null,
    selectedMarketItemId: null,
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
        return {
          ...s,
          screen,
          tab: tab ?? s.tab,
          selectedProfileId: screen === "profile" ? null : s.selectedProfileId,
        };
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

  const openProfile = useCallback(
    (userId: string) => {
      setState((s) => {
        historyRef.current = [...historyRef.current, s.screen];
        return { ...s, screen: "profile", selectedProfileId: userId };
      });
      resetScroll();
    },
    [resetScroll]
  );

  const openQaQuestion = useCallback(
    (questionId: string) => {
      setState((s) => {
        historyRef.current = [...historyRef.current, s.screen];
        return { ...s, screen: "qaDetail", selectedQaQuestionId: questionId };
      });
      resetScroll();
    },
    [resetScroll]
  );

  const openEvent = useCallback(
    (eventId: string) => {
      setState((s) => {
        historyRef.current = [...historyRef.current, s.screen];
        return { ...s, screen: "eventDetail", selectedEventId: eventId };
      });
      resetScroll();
    },
    [resetScroll]
  );

  const openMarketItem = useCallback(
    (itemId: string) => {
      setState((s) => {
        historyRef.current = [...historyRef.current, s.screen];
        return { ...s, screen: "marketDetail", selectedMarketItemId: itemId };
      });
      resetScroll();
    },
    [resetScroll]
  );

  const api = useMemo<RouterApi>(
    () => ({
      ...state,
      nav,
      back,
      setRegion,
      openAwase,
      openChat,
      openProfile,
      openQaQuestion,
      openEvent,
      openMarketItem,
      scrollRef,
    }),
    [state, nav, back, setRegion, openAwase, openChat, openProfile, openQaQuestion, openEvent, openMarketItem]
  );

  return <RouterContext.Provider value={api}>{children}</RouterContext.Provider>;
}

export function useRouter(): RouterApi {
  const ctx = useContext(RouterContext);
  if (!ctx) throw new Error("useRouter must be used within AppRouterProvider");
  return ctx;
}

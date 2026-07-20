"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Screen, Tab } from "@/lib/types";
import type { ReportTargetType } from "@/lib/queries/moderation";

export interface ReportTarget {
  type: ReportTargetType;
  /** entity id (awase/market/qa) or the user id being reported */
  id: string;
  /** the reported user's id — set for blockability (user reports, or the
   * host/seller behind an entity). null when there is no user to block. */
  userId: string | null;
}

interface RouterState {
  screen: Screen;
  tab: Tab;
  region: string;
  /** 検索画面の初期キーワード（作品チップ等から渡す）。SearchScreen が初期値に使う。 */
  searchKeyword: string;
  /** 検索画面を開いたときの初期タブ（「みんなの投稿」→写真タブ等）。SearchScreen が
   * 初期値に使うのみで、以降のタブ切替はSearchScreen内のローカル状態が持つ。 */
  searchInitialTab: "awase" | "people" | "photos" | null;
  /** 検索画面の状態（キーワード・タブ・絞り込み）。画面はナビごとにマウントし直される
   * ため、ここに持たせて「戻る」で条件が消えないようにする。SearchScreen が
   * onChange のたびに setSearchState で書き戻す。 */
  searchState: {
    keyword: string;
    tab: "awase" | "people" | "photos";
    womenOnly: boolean;
    photoWorkFilter: string;
    /** ユーザータブの役割絞り込み（"" = すべて）。 */
    peopleRole: "" | "layer" | "photographer";
  };
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
  /** group.id backing the current `groupDetail` screen. */
  selectedGroupId: string | null;
  /** market_item.id backing the current `marketDetail` screen, once a backend is connected. */
  selectedMarketItemId: string | null;
  /** awase.id whose fields prefill the `create` screen (募集の複製); null for a blank form. */
  duplicateAwaseId: string | null;
  /** event.id the `create` screen ties the new 併せ to (イベント詳細からの募集); null otherwise. */
  createForEventId: string | null;
  /** what the `report` screen is reporting; null when reached without a target. */
  reportTarget: ReportTarget | null;
}

interface RouterApi extends RouterState {
  /** navigate to a screen, pushing current screen onto the back stack.
   * Navigating to "profile" this way always means "my own profile" — it
   * resets selectedProfileId; use openProfile() to view someone else's. */
  nav: (screen: Screen, tab?: Tab) => void;
  /** pop the back stack (bottom-nav-aware, mirrors prototype back()) */
  back: () => void;
  setRegion: (r: string) => void;
  /** 検索画面の状態を部分更新する（キーワード入力・タブ切替・絞り込み変更のたびに呼ぶ）。 */
  setSearchState: (partial: Partial<RouterState["searchState"]>) => void;
  /** navigate to `search` with an initial keyword (作品チップ等からの導線) */
  openSearch: (keyword: string) => void;
  /** navigate to `search` opened straight to the 写真 tab (ホームの「みんなの投稿」等からの導線) */
  openPhotos: () => void;
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
  /** navigate to `groupDetail` for a specific real group row */
  openGroup: (groupId: string) => void;
  /** navigate to `marketDetail` for a specific real listing row */
  openMarketItem: (itemId: string) => void;
  /** navigate to `create` prefilled from an existing awase (募集の複製) */
  openCreateFromDuplicate: (awaseId: string) => void;
  /** navigate to `create` tied to a specific event (イベント詳細からの併せ募集) */
  openCreateForEvent: (eventId: string) => void;
  /** navigate to `report` for a specific real target (user/awase/market/qa) */
  openReport: (target: ReportTarget) => void;
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
    searchKeyword: "",
    searchInitialTab: null,
    searchState: { keyword: "", tab: "awase", womenOnly: false, photoWorkFilter: "", peopleRole: "" },
    selectedAwaseId: null,
    selectedConversationId: null,
    selectedProfileId: null,
    selectedQaQuestionId: null,
    selectedEventId: null,
    selectedGroupId: null,
    selectedMarketItemId: null,
    duplicateAwaseId: null,
    createForEventId: null,
    reportTarget: null,
  });
  const historyRef = useRef<Screen[]>([]);
  // 各 historyRef のプッシュと対になる、そのときのスクロール位置。back() で
  // ポップして復元することで、一覧に戻ったときに元の位置に戻れるようにする
  // （historyRef と常に同じ長さを保つ）。
  const scrollStackRef = useRef<number[]>([]);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const resetScroll = useCallback(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }, []);

  /** historyRef へのプッシュと同時に、現在のスクロール位置を退避する。
   * scrollTop は呼び出し側で setState より前に同期的に読み取って渡す
   * ——setState のアップデータ関数はレンダー時まで呼び出しが遅延されうるため、
   * 直後に呼ぶ resetScroll() で 0 になった後に読んでしまうと復元できない。 */
  const pushHistory = useCallback((currentScreen: Screen, scrollTop: number) => {
    historyRef.current = [...historyRef.current, currentScreen];
    scrollStackRef.current = [...scrollStackRef.current, scrollTop];
  }, []);

  // ディープリンク: 初回マウント時に `?awase=<id>` があれば、その併せ詳細を開く。
  // （共有URLから個別ページへ着地できるようにする。SSR では window が無いので effect で読む）
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const awaseId = params.get("awase");
    if (awaseId) {
      setState((s) => ({ ...s, screen: "detail", selectedAwaseId: awaseId }));
      return;
    }
    // イベント公開ページ（/e/<id>・SEO）からの着地: ?event=<id> で詳細を開く。
    const eventId = params.get("event");
    if (eventId) {
      setState((s) => ({ ...s, screen: "eventDetail", selectedEventId: eventId }));
    }
  }, []);

  // 併せ詳細を見ているあいだは URL を `?awase=<id>` に同期する。これにより
  // 詳細ページの共有/Xシェア（window.location.href 利用）がそのまま個別ページの
  // ディープリンクになる。詳細以外の画面では素の URL に戻す。
  useEffect(() => {
    if (typeof window === "undefined") return;
    const base = window.location.pathname + window.location.hash;
    const next =
      state.screen === "detail" && state.selectedAwaseId
        ? `${window.location.pathname}?awase=${encodeURIComponent(state.selectedAwaseId)}${window.location.hash}`
        : state.screen === "eventDetail" && state.selectedEventId
          ? `${window.location.pathname}?event=${encodeURIComponent(state.selectedEventId)}${window.location.hash}`
          : base;
    if (window.location.pathname + window.location.search + window.location.hash !== next) {
      window.history.replaceState(null, "", next);
    }
  }, [state.screen, state.selectedAwaseId, state.selectedEventId]);

  const nav = useCallback(
    (screen: Screen, tab?: Tab) => {
      const scrollTop = scrollRef.current?.scrollTop ?? 0;
      setState((s) => {
        pushHistory(s.screen, scrollTop);
        return {
          ...s,
          screen,
          tab: tab ?? s.tab,
          selectedProfileId: screen === "profile" ? null : s.selectedProfileId,
          // 検索へ普通に遷移したときは初期キーワード・初期タブなし
          // （作品チップ経由は openSearch、写真タブ直行は openPhotos）
          searchKeyword: screen === "search" ? "" : s.searchKeyword,
          searchInitialTab: screen === "search" ? null : s.searchInitialTab,
          // reaching the create form any other way (e.g. sidebar) means a blank form
          duplicateAwaseId: screen === "create" ? null : s.duplicateAwaseId,
          createForEventId: screen === "create" ? null : s.createForEventId,
          reportTarget: screen === "report" ? null : s.reportTarget,
        };
      });
      resetScroll();
    },
    [resetScroll, pushHistory]
  );

  const back = useCallback(() => {
    // スクロール位置は historyRef と対の scrollStackRef から復元する
    // （pushHistory で積んだ「そのとき居た画面のスクロール位置」）。
    const savedTop = scrollStackRef.current.length > 0 ? scrollStackRef.current[scrollStackRef.current.length - 1] : 0;
    scrollStackRef.current = scrollStackRef.current.slice(0, -1);
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
    // 遷移先の内容が描画されたあと（次フレーム）に復元する。直後に同期で
    // scrollTop を設定すると、まだ古い画面のレイアウトのままクランプされて
    // 正しく復元できないことがあるため。
    requestAnimationFrame(() => {
      if (scrollRef.current) scrollRef.current.scrollTop = savedTop;
    });
  }, []);

  const setRegion = useCallback((region: string) => {
    setState((s) => ({ ...s, region }));
  }, []);

  const setSearchState = useCallback((partial: Partial<RouterState["searchState"]>) => {
    setState((s) => ({ ...s, searchState: { ...s.searchState, ...partial } }));
  }, []);

  const openSearch = useCallback(
    (keyword: string) => {
      const scrollTop = scrollRef.current?.scrollTop ?? 0;
      setState((s) => {
        pushHistory(s.screen, scrollTop);
        return { ...s, screen: "search", tab: "search", searchKeyword: keyword, searchInitialTab: null };
      });
      resetScroll();
    },
    [resetScroll, pushHistory]
  );

  const openPhotos = useCallback(() => {
    const scrollTop = scrollRef.current?.scrollTop ?? 0;
    setState((s) => {
      pushHistory(s.screen, scrollTop);
      return { ...s, screen: "search", tab: "search", searchKeyword: "", searchInitialTab: "photos" };
    });
    resetScroll();
  }, [resetScroll, pushHistory]);

  const openAwase = useCallback(
    (awaseId: string) => {
      const scrollTop = scrollRef.current?.scrollTop ?? 0;
      setState((s) => {
        pushHistory(s.screen, scrollTop);
        return { ...s, screen: "detail", selectedAwaseId: awaseId };
      });
      resetScroll();
    },
    [resetScroll, pushHistory]
  );

  const openChat = useCallback(
    (conversationId: string) => {
      const scrollTop = scrollRef.current?.scrollTop ?? 0;
      setState((s) => {
        pushHistory(s.screen, scrollTop);
        return { ...s, screen: "chat", selectedConversationId: conversationId };
      });
      resetScroll();
    },
    [resetScroll, pushHistory]
  );

  const openProfile = useCallback(
    (userId: string) => {
      const scrollTop = scrollRef.current?.scrollTop ?? 0;
      setState((s) => {
        pushHistory(s.screen, scrollTop);
        return { ...s, screen: "profile", selectedProfileId: userId };
      });
      resetScroll();
    },
    [resetScroll, pushHistory]
  );

  const openQaQuestion = useCallback(
    (questionId: string) => {
      const scrollTop = scrollRef.current?.scrollTop ?? 0;
      setState((s) => {
        pushHistory(s.screen, scrollTop);
        return { ...s, screen: "qaDetail", selectedQaQuestionId: questionId };
      });
      resetScroll();
    },
    [resetScroll, pushHistory]
  );

  const openEvent = useCallback(
    (eventId: string) => {
      const scrollTop = scrollRef.current?.scrollTop ?? 0;
      setState((s) => {
        pushHistory(s.screen, scrollTop);
        return { ...s, screen: "eventDetail", selectedEventId: eventId };
      });
      resetScroll();
    },
    [resetScroll, pushHistory]
  );

  const openGroup = useCallback(
    (groupId: string) => {
      const scrollTop = scrollRef.current?.scrollTop ?? 0;
      setState((s) => {
        pushHistory(s.screen, scrollTop);
        return { ...s, screen: "groupDetail", selectedGroupId: groupId };
      });
      resetScroll();
    },
    [resetScroll, pushHistory]
  );

  const openMarketItem = useCallback(
    (itemId: string) => {
      const scrollTop = scrollRef.current?.scrollTop ?? 0;
      setState((s) => {
        pushHistory(s.screen, scrollTop);
        return { ...s, screen: "marketDetail", selectedMarketItemId: itemId };
      });
      resetScroll();
    },
    [resetScroll, pushHistory]
  );

  const openCreateFromDuplicate = useCallback(
    (awaseId: string) => {
      const scrollTop = scrollRef.current?.scrollTop ?? 0;
      setState((s) => {
        pushHistory(s.screen, scrollTop);
        return { ...s, screen: "create", duplicateAwaseId: awaseId, createForEventId: null };
      });
      resetScroll();
    },
    [resetScroll, pushHistory]
  );

  const openCreateForEvent = useCallback(
    (eventId: string) => {
      const scrollTop = scrollRef.current?.scrollTop ?? 0;
      setState((s) => {
        pushHistory(s.screen, scrollTop);
        return { ...s, screen: "create", createForEventId: eventId, duplicateAwaseId: null };
      });
      resetScroll();
    },
    [resetScroll, pushHistory]
  );

  const openReport = useCallback(
    (target: ReportTarget) => {
      const scrollTop = scrollRef.current?.scrollTop ?? 0;
      setState((s) => {
        pushHistory(s.screen, scrollTop);
        return { ...s, screen: "report", reportTarget: target };
      });
      resetScroll();
    },
    [resetScroll, pushHistory]
  );

  const api = useMemo<RouterApi>(
    () => ({
      ...state,
      nav,
      back,
      setRegion,
      setSearchState,
      openSearch,
      openPhotos,
      openAwase,
      openChat,
      openProfile,
      openQaQuestion,
      openEvent,
      openGroup,
      openMarketItem,
      openCreateFromDuplicate,
      openCreateForEvent,
      openReport,
      scrollRef,
    }),
    [
      state,
      nav,
      back,
      setRegion,
      setSearchState,
      openSearch,
      openPhotos,
      openAwase,
      openChat,
      openProfile,
      openQaQuestion,
      openEvent,
      openGroup,
      openMarketItem,
      openCreateFromDuplicate,
      openCreateForEvent,
      openReport,
    ]
  );

  return <RouterContext.Provider value={api}>{children}</RouterContext.Provider>;
}

export function useRouter(): RouterApi {
  const ctx = useContext(RouterContext);
  if (!ctx) throw new Error("useRouter must be used within AppRouterProvider");
  return ctx;
}

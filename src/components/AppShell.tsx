"use client";

import { AppRouterProvider, useRouter } from "./AppRouter";
import { PhoneFrame } from "./PhoneFrame";
import { AuthGate } from "./AuthGate";
import { useAuth } from "@/lib/auth/useAuth";
import { HomeScreen } from "./screens/HomeScreen";
import { SearchScreen } from "./screens/SearchScreen";
import { DetailScreen } from "./screens/DetailScreen";
import { AppliedScreen } from "./screens/AppliedScreen";
import { CreateScreen } from "./screens/CreateScreen";
import { CreatedScreen } from "./screens/CreatedScreen";
import { NotifyScreen } from "./screens/NotifyScreen";
import { ProfileScreen } from "./screens/ProfileScreen";
import { MessagesScreen } from "./screens/MessagesScreen";
import { ChatScreen } from "./screens/ChatScreen";
import { ReviewWriteScreen } from "./screens/ReviewWriteScreen";
import { MarketScreen } from "./screens/MarketScreen";
import { MarketDetailScreen } from "./screens/MarketDetailScreen";
import { EventsScreen } from "./screens/EventsScreen";
import { EventDetailScreen } from "./screens/EventDetailScreen";
import { QaScreen } from "./screens/QaScreen";
import { QaDetailScreen } from "./screens/QaDetailScreen";
import { ReportScreen } from "./screens/ReportScreen";
import { SettingsScreen } from "./screens/SettingsScreen";
import { CorporateScreen } from "./screens/CorporateScreen";
import { VerifyScreen } from "./screens/VerifyScreen";
import { TermsScreen } from "./screens/TermsScreen";
import { OnboardRoleScreen } from "./screens/OnboardRoleScreen";
import { OnboardWorksScreen } from "./screens/OnboardWorksScreen";
import { OnboardVerifyScreen } from "./screens/OnboardVerifyScreen";
import { PhotographerProfileScreen } from "./screens/PhotographerProfileScreen";
import type { Screen } from "@/lib/types";

const screens: Record<Screen, () => React.ReactElement> = {
  home: HomeScreen,
  search: SearchScreen,
  detail: DetailScreen,
  applied: AppliedScreen,
  create: CreateScreen,
  created: CreatedScreen,
  notify: NotifyScreen,
  profile: ProfileScreen,
  messages: MessagesScreen,
  chat: ChatScreen,
  reviewWrite: ReviewWriteScreen,
  market: MarketScreen,
  marketDetail: MarketDetailScreen,
  events: EventsScreen,
  eventDetail: EventDetailScreen,
  qa: QaScreen,
  qaDetail: QaDetailScreen,
  report: ReportScreen,
  settings: SettingsScreen,
  corporate: CorporateScreen,
  verify: VerifyScreen,
  terms: TermsScreen,
  onboardRole: OnboardRoleScreen,
  onboardWorks: OnboardWorksScreen,
  onboardVerify: OnboardVerifyScreen,
  photographerProfile: PhotographerProfileScreen,
};

function CurrentScreen() {
  const { screen } = useRouter();
  const Screen = screens[screen];
  return <Screen />;
}

function FramedApp() {
  // Only used to decide whether the login gate (chromeless) is showing;
  // AuthGate itself owns the actual gating logic.
  const { user, loading, configured } = useAuth();
  const showingLogin = configured && !loading && !user;

  return (
    <PhoneFrame forceChromeless={showingLogin}>
      <AuthGate>
        <CurrentScreen />
      </AuthGate>
    </PhoneFrame>
  );
}

/** Root of the prototype: provides routing state and renders the phone frame. */
export function AppShell() {
  return (
    <AppRouterProvider>
      <FramedApp />
    </AppRouterProvider>
  );
}

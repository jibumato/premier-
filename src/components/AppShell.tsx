"use client";

import { AppRouterProvider, useRouter } from "./AppRouter";
import { PhoneFrame } from "./PhoneFrame";
import { AuthGate } from "./AuthGate";
import { useAuth } from "@/lib/auth/useAuth";
import { useProfile } from "@/lib/queries/profile";
import { HomeScreen } from "./screens/HomeScreen";
import { SearchScreen } from "./screens/SearchScreen";
import { DetailScreen } from "./screens/DetailScreen";
import { AppliedScreen } from "./screens/AppliedScreen";
import { CreateScreen } from "./screens/CreateScreen";
import { CreatedScreen } from "./screens/CreatedScreen";
import { HostApplicantsScreen } from "./screens/HostApplicantsScreen";
import { NotifyScreen } from "./screens/NotifyScreen";
import { ProfileScreen } from "./screens/ProfileScreen";
import { MessagesScreen } from "./screens/MessagesScreen";
import { ChatScreen } from "./screens/ChatScreen";
import { ReviewWriteScreen } from "./screens/ReviewWriteScreen";
import { MarketScreen } from "./screens/MarketScreen";
import { MarketDetailScreen } from "./screens/MarketDetailScreen";
import { EventsScreen } from "./screens/EventsScreen";
import { EventDetailScreen } from "./screens/EventDetailScreen";
import { StudiosScreen } from "./screens/StudiosScreen";
import { QaScreen } from "./screens/QaScreen";
import { QaDetailScreen } from "./screens/QaDetailScreen";
import { LoungeScreen } from "./screens/LoungeScreen";
import { SummitScreen } from "./screens/SummitScreen";
import { ReportScreen } from "./screens/ReportScreen";
import { SettingsScreen } from "./screens/SettingsScreen";
import { AdminVerificationScreen } from "./screens/AdminVerificationScreen";
import { AdminPickupsScreen } from "./screens/AdminPickupsScreen";
import { AdminEventsScreen } from "./screens/AdminEventsScreen";
import { AdminFeedbackScreen } from "./screens/AdminFeedbackScreen";
import { AdminActivityScreen } from "./screens/AdminActivityScreen";
import { AdminAnnouncementsScreen } from "./screens/AdminAnnouncementsScreen";
import { AdminUsersScreen } from "./screens/AdminUsersScreen";
import { AdminMessageLogScreen } from "./screens/AdminMessageLogScreen";
import { FeedbackScreen } from "./screens/FeedbackScreen";
import { CorporateScreen } from "./screens/CorporateScreen";
import { VerifyScreen } from "./screens/VerifyScreen";
import { TermsScreen } from "./screens/TermsScreen";
import { PrivacyScreen } from "./screens/PrivacyScreen";
import { TokushohoScreen } from "./screens/TokushohoScreen";
import { AnnouncementsScreen } from "./screens/AnnouncementsScreen";
import { OnboardRoleScreen } from "./screens/OnboardRoleScreen";
import { OnboardWorksScreen } from "./screens/OnboardWorksScreen";
import { OnboardVerifyScreen } from "./screens/OnboardVerifyScreen";
import { PhotographerProfileScreen } from "./screens/PhotographerProfileScreen";
import { LoginScreen } from "./LoginScreen";
import { isPublicView } from "@/lib/auth/publicScreens";
import type { Screen } from "@/lib/types";

const screens: Record<Screen, () => React.ReactElement> = {
  home: HomeScreen,
  search: SearchScreen,
  detail: DetailScreen,
  applied: AppliedScreen,
  create: CreateScreen,
  created: CreatedScreen,
  hostApplicants: HostApplicantsScreen,
  notify: NotifyScreen,
  profile: ProfileScreen,
  messages: MessagesScreen,
  chat: ChatScreen,
  reviewWrite: ReviewWriteScreen,
  market: MarketScreen,
  marketDetail: MarketDetailScreen,
  events: EventsScreen,
  eventDetail: EventDetailScreen,
  studios: StudiosScreen,
  qa: QaScreen,
  qaDetail: QaDetailScreen,
  lounge: LoungeScreen,
  summit: SummitScreen,
  report: ReportScreen,
  settings: SettingsScreen,
  adminVerify: AdminVerificationScreen,
  adminPickups: AdminPickupsScreen,
  adminEvents: AdminEventsScreen,
  adminFeedback: AdminFeedbackScreen,
  adminActivity: AdminActivityScreen,
  adminAnnouncements: AdminAnnouncementsScreen,
  adminUsers: AdminUsersScreen,
  adminMessageLog: AdminMessageLogScreen,
  feedback: FeedbackScreen,
  corporate: CorporateScreen,
  verify: VerifyScreen,
  terms: TermsScreen,
  privacy: PrivacyScreen,
  tokushoho: TokushohoScreen,
  announcements: AnnouncementsScreen,
  onboardRole: OnboardRoleScreen,
  onboardWorks: OnboardWorksScreen,
  onboardVerify: OnboardVerifyScreen,
  photographerProfile: PhotographerProfileScreen,
  login: LoginScreen,
};

function CurrentScreen() {
  const { screen } = useRouter();
  const Screen = screens[screen];
  return <Screen />;
}

function FramedApp() {
  // Decides whether the chromeless (no bottom-nav) login/suspended gate is
  // showing; AuthGate itself owns the actual gating logic. In the hybrid model
  // a signed-out visitor still gets the bottom nav on *public* screens so they
  // can browse; the login form (chromeless) only appears when they reach a
  // protected screen or an account is suspended.
  const { user, loading, configured } = useAuth();
  const { screen, selectedProfileId } = useRouter();
  const profile = useProfile(configured ? user?.id : undefined);
  const showingLoginForm =
    configured &&
    !loading &&
    ((!user && !isPublicView(screen, selectedProfileId)) || Boolean(profile.data?.is_suspended));

  return (
    <PhoneFrame forceChromeless={showingLoginForm}>
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

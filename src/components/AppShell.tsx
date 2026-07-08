"use client";

import { AppRouterProvider, useRouter } from "./AppRouter";
import { PhoneFrame } from "./PhoneFrame";
import { HomeScreen } from "./screens/HomeScreen";
import { SearchScreen } from "./screens/SearchScreen";
import { DetailScreen } from "./screens/DetailScreen";
import { AppliedScreen } from "./screens/AppliedScreen";
import { CreateScreen } from "./screens/CreateScreen";
import { CreatedScreen } from "./screens/CreatedScreen";
import { NotifyScreen } from "./screens/NotifyScreen";
import { ProfileScreen } from "./screens/ProfileScreen";
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
};

function CurrentScreen() {
  const { screen } = useRouter();
  const Screen = screens[screen];
  return <Screen />;
}

/** Root of the prototype: provides routing state and renders the phone frame. */
export function AppShell() {
  return (
    <AppRouterProvider>
      <PhoneFrame>
        <CurrentScreen />
      </PhoneFrame>
    </AppRouterProvider>
  );
}

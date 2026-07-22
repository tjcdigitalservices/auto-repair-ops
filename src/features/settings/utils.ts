import {
  SETTINGS_PAGE_TABS,
  type SettingsPageTab,
} from "@/features/settings/types";

export const SETTINGS_PAGE_TAB_OPTIONS: Array<{
  value: SettingsPageTab;
  label: string;
}> = [
  { value: "profile", label: "Business profile" },
  { value: "branches", label: "Branches & branding" },
  { value: "operations", label: "Operational rules" },
  { value: "theme", label: "Theme colors" },
  { value: "presence", label: "Public presence" },
  { value: "documents", label: "Documents" },
];

export function resolveSettingsPageTab(value: string | undefined): SettingsPageTab {
  if (value && SETTINGS_PAGE_TABS.includes(value as SettingsPageTab)) {
    return value as SettingsPageTab;
  }

  return "profile";
}

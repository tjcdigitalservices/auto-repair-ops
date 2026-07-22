import { redirect } from "next/navigation";

/** Kept for old bookmarks; Settings now hosts this as `?tab=branches`. */
export default function SettingsBranchesPage() {
  redirect("/settings?tab=branches");
}

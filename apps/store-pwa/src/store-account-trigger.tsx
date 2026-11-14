import { DesktopAccountButton } from "@coopfood-kph/ui";
import type { ComponentProps } from "react";
import type { StoreProfile } from "./store-profile";

export function storeAccountIdentity(profile: StoreProfile) {
  const name = profile.fullName.trim().split(/\s+/).slice(-2).join(" ");
  return { name, initials: name.split(/\s+/).map(part => part[0] ?? "").join("").toUpperCase() };
}

export function storeAccountRole(profile: StoreProfile) {
  return profile.role === "STORE_MANAGER" ? "Quản lý cửa hàng" : profile.role === "STAFF" ? "Nhân viên" : "Chưa có vai trò";
}

/** The same account anchor is used before and after the app finishes loading. */
export function StoreAccountTrigger({ profile, roleLabel = storeAccountRole(profile), ...props }: { profile: StoreProfile; roleLabel?: string | undefined } & ComponentProps<"button">) {
  const { initials } = storeAccountIdentity(profile);
  return <DesktopAccountButton className="store-account" aria-label="Tài khoản và cửa hàng" {...props} initials={initials} name={profile.fullName} detail={roleLabel} avatarClassName="store-profile-avatar" copyClassName="store-profile-meta" />;
}

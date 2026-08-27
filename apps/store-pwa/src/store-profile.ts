import { z } from "zod";

import { getPilotSetting, setPilotSetting } from "./record-store";

export const STORE_PROFILE_SETTING_KEY = "store-profile";

export const storeProfileSchema = z.object({
  storeName: z.string().trim().min(1, "Nhập tên cửa hàng").max(100, "Tên cửa hàng tối đa 100 ký tự"),
  storeCode: z.string().trim().regex(/^\d{4}$/, "Mã cửa hàng gồm đúng 4 chữ số"),
  role: z.union([z.literal(""), z.enum(["STAFF", "STORE_MANAGER"])]),
  fullName: z.string().trim().max(100, "Họ tên tối đa 100 ký tự"),
  employeeCode: z.string().trim().max(50, "Mã nhân viên tối đa 50 ký tự"),
});

export type StoreProfile = z.infer<typeof storeProfileSchema>;

export const DEFAULT_STORE_PROFILE: StoreProfile = {
  storeName: "",
  storeCode: "",
  role: "",
  fullName: "",
  employeeCode: "",
};

export const storeRoleLabels: Record<Exclude<StoreProfile["role"], "">, string> = {
  STAFF: "Nhân viên",
  STORE_MANAGER: "CHT",
};

export function normalizeStoreProfile(value: unknown): StoreProfile {
  const result = storeProfileSchema.safeParse(value);
  return result.success ? result.data : DEFAULT_STORE_PROFILE;
}

export function storeIdentity(profile: StoreProfile) {
  const name = profile.storeName?.trim();
  const code = profile.storeCode?.trim();
  if (!name && !code) return "Chưa thiết lập cửa hàng";
  if (name && code) return `Co.op Food ${name} · ${code}`;
  if (name) return `Co.op Food ${name}`;
  return `Co.op Food · ${code}`;
}

export function actorIdentity(profile: StoreProfile) {
  return [
    profile.fullName,
    profile.role ? storeRoleLabels[profile.role] : "",
    profile.employeeCode,
  ].filter(Boolean).join(" · ") || "Chưa nhập thông tin nhân sự";
}

export async function loadPilotStoreProfile() {
  return normalizeStoreProfile(await getPilotSetting<unknown>(STORE_PROFILE_SETTING_KEY));
}

export async function savePilotStoreProfile(profile: StoreProfile) {
  const normalized = storeProfileSchema.parse(profile);
  await setPilotSetting(STORE_PROFILE_SETTING_KEY, normalized);
  return normalized;
}

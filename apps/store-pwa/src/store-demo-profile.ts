import type { StoreProfile } from "./store-profile";

// Synthetic display context for the current preview, never an online session.
export const mockProfile: StoreProfile = {
  storeCode: "0001", storeName: "Cửa hàng mẫu", fullName: "Nguyễn Minh An",
  employeeCode: "DEMO-001", role: "STORE_MANAGER",
};

import { getPilotSetting, setPilotSetting } from "./record-store";

export const PIN_STATE_SETTING_KEY = "store-pin-state";
export type PinOverride = "0000" | null;

export async function loadPilotPinOverride(): Promise<PinOverride> {
  const state = await getPilotSetting<unknown>(PIN_STATE_SETTING_KEY);
  if (typeof state !== "object" || state === null || !("pinOverride" in state)) return null;
  return state.pinOverride === "0000" ? "0000" : null;
}

export async function savePilotPinOverride(pinOverride: PinOverride) {
  await setPilotSetting(PIN_STATE_SETTING_KEY, { pinOverride });
}

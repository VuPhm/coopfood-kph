import { getPilotSetting, transactPilotSettings } from "./record-store";

export const PIN_STATE_SETTING_KEY = "store-pin-state";
export type PinOverride = "0000" | null;

export type PilotPinState = {
  pinOverride: PinOverride;
  previousPin: string | null;
};

export const EMPTY_PILOT_PIN_STATE: PilotPinState = {
  pinOverride: null,
  previousPin: null,
};

export function normalizePilotPinState(value: unknown): PilotPinState {
  if (typeof value !== "object" || value === null) return EMPTY_PILOT_PIN_STATE;

  const state = value as Record<string, unknown>;
  return {
    pinOverride: state.pinOverride === "0000" ? "0000" : null,
    previousPin: typeof state.previousPin === "string" && /^\d{4}$/.test(state.previousPin)
      ? state.previousPin
      : null,
  };
}

export function effectivePilotPin(state: PilotPinState, currentStoreCode: string | null | undefined) {
  return state.pinOverride ?? (currentStoreCode || "0000");
}

export function pinStateAfterStoreCodeChange(
  state: PilotPinState,
  previousStoreCode: string,
  nextStoreCode: string,
): PilotPinState {
  if (previousStoreCode === nextStoreCode) return state;

  const previousEffectivePin = effectivePilotPin(state, previousStoreCode);
  const nextEffectivePin = nextStoreCode || "0000";
  return {
    pinOverride: null,
    previousPin: previousEffectivePin === nextEffectivePin ? state.previousPin : previousEffectivePin,
  };
}

export async function loadPilotPinState(): Promise<PilotPinState> {
  return normalizePilotPinState(await getPilotSetting<unknown>(PIN_STATE_SETTING_KEY));
}

export async function recoverPilotPinWithPreviousPin(enteredPreviousPin: string): Promise<boolean> {
  return transactPilotSettings([PIN_STATE_SETTING_KEY], (current) => {
    const pinState = normalizePilotPinState(current.get(PIN_STATE_SETTING_KEY));
    const expectedRecoveryPin = pinState.previousPin ?? "0000";
    if (!/^\d{4}$/.test(enteredPreviousPin) || enteredPreviousPin !== expectedRecoveryPin) {
      return { writes: [], result: false };
    }

    return {
      writes: [{
        key: PIN_STATE_SETTING_KEY,
        value: { pinOverride: "0000", previousPin: null } satisfies PilotPinState,
      }],
      result: true,
    };
  });
}

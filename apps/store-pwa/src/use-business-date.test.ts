import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useBusinessDate } from "./use-business-date";
afterEach(()=>vi.useRealTimers());
describe("Store calendar clock",()=>{
  it("updates at HCM midnight and removes its single timer on unmount",()=>{
    vi.useFakeTimers();vi.setSystemTime(new Date("2026-10-23T16:59:59.000Z"));
    const hook=renderHook(()=>useBusinessDate());expect(hook.result.current).toBe("2026-10-23");
    act(()=>vi.advanceTimersByTime(1002));expect(hook.result.current).toBe("2026-10-24");
    hook.unmount();expect(vi.getTimerCount()).toBe(0);
  });
  it("catches up after sleep when the tab resumes",()=>{
    vi.useFakeTimers();vi.setSystemTime(new Date("2026-10-23T00:00:00+07:00"));
    const hook=renderHook(()=>useBusinessDate());
    vi.setSystemTime(new Date("2026-10-31T08:00:00+07:00"));act(()=>document.dispatchEvent(new Event("visibilitychange")));
    expect(hook.result.current).toBe("2026-10-31");expect(vi.getTimerCount()).toBe(1);hook.unmount();
  });
});

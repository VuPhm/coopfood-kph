import { describe, expect, it } from "vitest";
import { batchPresentation, rowPresentation, schedulePresentation, userPresentation } from "./list-labels";

describe("List label semantics", () => {
  it("distinguishes waiting, due and executed schedules without treating every past date as pending", () => {
    expect(schedulePresentation("SCHEDULED", false).tone).toBe("process");
    expect(schedulePresentation("SCHEDULED", true)).toMatchObject({ label: "Đến hạn", tone: "warning" });
    expect(schedulePresentation("EXECUTED", true).tone).toBe("success");
    expect(schedulePresentation("CANCELLED", true).tone).toBe("neutral");
  });
  it("keeps staging validation separate from publication and uses the row status from the API", () => {
    expect(batchPresentation("STAGED").tone).toBe("process");
    expect(batchPresentation("VALIDATED").tone).toBe("success");
    expect(batchPresentation("PUBLISHED")).toMatchObject({ label: "Đã publish", tone: "info" });
    expect(rowPresentation("ERROR").tone).toBe("danger");
    expect(rowPresentation("WARNING").tone).toBe("warning");
    expect(userPresentation(false).tone).toBe("neutral");
  });
});

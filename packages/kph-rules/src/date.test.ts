import { describe, expect, it } from "vitest";

import invalidCases from "../../../contracts/fixtures/golden/dates/invalid-date-cases.json";
import returnDateCases from "../../../contracts/fixtures/golden/dates/return-date-cases.json";

import { calculateShelfLife, formatDisplayDate, parseDisplayDate, type ExpiryStatus, type LocalDate } from "./date";

type ReturnDateFixture = {
  id: string;
  manufactured: LocalDate;
  expiry: LocalDate;
  shelfLife: number;
  round20: number;
  round40: number;
  returnDate: LocalDate;
  returnDateDisplay: string;
  warningWindowDays: number;
  statusChecks?: { today: LocalDate; expected: ExpiryStatus }[];
};

describe("business dates", () => {
  it("round-trips the accepted presentation format", () => {
    expect(parseDisplayDate("29/02/2024")).toBe("2024-02-29");
    expect(formatDisplayDate("2026-08-15")).toBe("15/08/2026");
  });

  it.each(invalidCases)("rejects $id", ({ expectedError, expiry, manufactured }) => {
    expect(() => calculateShelfLife(manufactured as LocalDate, expiry as LocalDate, manufactured as LocalDate)).toThrow(expectedError);
  });

  it.each(returnDateCases as ReturnDateFixture[])("locks shared fixture $id", (fixture) => {
    const result = calculateShelfLife(
      fixture.manufactured as LocalDate,
      fixture.expiry as LocalDate,
      fixture.manufactured as LocalDate,
    );
    expect(result).toMatchObject({
      shelfLifeDays: fixture.shelfLife,
      rounded20PercentDays: fixture.round20,
      rounded40PercentDays: fixture.round40,
      withdrawalDate: fixture.returnDate,
      warningWindowDays: fixture.warningWindowDays,
    });
    expect(formatDisplayDate(result.withdrawalDate)).toBe(fixture.returnDateDisplay);

    for (const check of fixture.statusChecks ?? []) {
      expect(calculateShelfLife(
        fixture.manufactured as LocalDate,
        fixture.expiry as LocalDate,
        check.today as LocalDate,
      ).status).toBe(check.expected as ExpiryStatus);
    }
  });
});

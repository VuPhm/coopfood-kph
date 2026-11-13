import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DateGroupChip, DEFAULT_DATE_GROUPS } from "./store-date-groups";

describe("DATE groups", () => {
  it("renders an explicitly chosen group and leaves missing groups unclassified", () => {
    render(<><DateGroupChip group={DEFAULT_DATE_GROUPS[0]} /><DateGroupChip group={null} /></>);
    expect(screen.getByText("Lương thực")).toBeInTheDocument(); expect(screen.getByText("Chưa phân loại")).toBeInTheDocument();
    expect(DEFAULT_DATE_GROUPS).toHaveLength(3); expect(DEFAULT_DATE_GROUPS.every(g => g.withdrawalEnabled)).toBe(true);
  });
});

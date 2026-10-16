import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ListLabel } from "./list-label";

describe("ListLabel", () => {
  it("keeps status text and its category available without adding a control", () => {
    render(<ListLabel tone="warning" category="Tình trạng" icon={<svg aria-label="decorative clock" />} title="Tình trạng: Cận date">Cận date</ListLabel>);
    const label = screen.getByTitle("Tình trạng: Cận date");
    expect(label).toHaveTextContent("Tình trạng: Cận date");
    expect(label.querySelector('[aria-hidden="true"]')).toContainElement(label.querySelector("svg"));
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(label).not.toHaveAttribute("tabindex");
  });
});

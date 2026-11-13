import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DateIntake } from "./store-date-intake";
import { DEFAULT_DATE_GROUPS } from "./store-date-groups";

describe("DATE mock intake", () => {
  it("validates dates and preserves explicit unclassified group", () => {
    const save = vi.fn(); render(<DateIntake today="2026-11-01" groups={DEFAULT_DATE_GROUPS} existingLots={[]} onSave={save} onCancel={vi.fn()} />);
    for (const [name,value] of [["SKU","00042"],["Tên hàng","Hàng mẫu"],["NSX","01/11/2026"],["HSD","01/11/2026"]]) fireEvent.change(screen.getByRole("textbox", {name:new RegExp(`^${name}`)}),{target:{value}});
    fireEvent.click(screen.getByRole("button",{name:"Thêm theo dõi"})); expect(save).not.toHaveBeenCalled();
    fireEvent.change(screen.getByRole("textbox", {name:/^HSD/}),{target:{value:"10/11/2026"}});
    fireEvent.click(screen.getByRole("button",{name:"Thêm theo dõi"}));
    expect(save).toHaveBeenCalledWith(expect.objectContaining({id:expect.any(String), sku:"00042", group:null, date:"2026-11-10"}));
  });
});

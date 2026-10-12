import { fireEvent, render, screen } from "@testing-library/react";
import { KPH_OPTIONS } from "@coopfood-kph/kph-rules";
import { describe, expect, it, vi } from "vitest";
import { getKphLabelPresentation, KphListLabel } from "./store-kph-label";
import { getKphChoicePresentation } from "./store-kph-choice";
import { StoreKphList } from "./store-kph-list";
import { mockRecords } from "./store-app-mock";

describe("KPH list labels", () => {
  it("restores option colors without changing the meaning of recorded-state labels", () => {
    for (const value of ["TORN_PACKAGING", "VACUUM_LEAK", "BRUISED_WATERLOGGED", "ROTTEN_MOLDY"])
      expect(getKphChoicePresentation("condition", value).tone).toBe("danger");
    expect(getKphChoicePresentation("condition", "NEAR_EXPIRY").tone).toBe("warning");
    expect(getKphChoicePresentation("condition", "EXPIRED").tone).toBe("neutral");
    expect(getKphLabelPresentation("condition", "EXPIRED").tone).toBe("danger");
    expect(getKphChoicePresentation("resolution", "CANCEL").tone).toBe("danger");
    expect(getKphLabelPresentation("resolution", "CANCEL").tone).toBe("neutral");
    expect(getKphChoicePresentation("resolution", "EXCHANGE").tone).toBe("success");
    expect(getKphChoicePresentation("resolution", "RETURN").tone).toBe("info");
    expect(getKphChoicePresentation("condition", "__proto__").tone).toBe("neutral");
  });
  it("resolves code and existing human labels consistently across fixture capitalization", () => {
    for (const set of Object.values(KPH_OPTIONS)) {
      for (const [kind, choices] of [["condition", set.conditions], ["resolution", set.resolutions]] as const) {
        for (const choice of choices) expect(getKphLabelPresentation(kind, ` ${choice.label.toLocaleLowerCase("vi")} `))
          .toEqual(getKphLabelPresentation(kind, choice.value));
      }
    }
    expect(getKphLabelPresentation("condition", "Hết HSD").tone).toBe("danger");
    expect(getKphLabelPresentation("resolution", "HỦY").tone).toBe("neutral");
    expect(getKphLabelPresentation("approval", "APPROVED").tone).toBe("success");
    expect(getKphLabelPresentation("approval", "Đã duyệt")).toEqual(getKphLabelPresentation("approval", "APPROVED"));
  });

  it("preserves free text and does not infer a state from words inside OTHER details", () => {
    const detail = "Khác: nghi hết HSD, cần đối chiếu lô trước khi xử lý";
    expect(getKphLabelPresentation("condition", detail).tone).toBe("neutral");
    render(<KphListLabel kind="condition" value={detail} />);
    expect(screen.getByTitle(`Tình trạng: ${detail}`)).toHaveTextContent(detail);
  });

  it.each([false, true])("keeps all three dimensions and record actions in desktop=%s", desktop => {
    const open = vi.fn(), select = vi.fn();
    const record = mockRecords[0]!;
    const { container } = render(<StoreKphList desktop={desktop} visible={[record]} selectionMode setActive={open} setSelection={select} />);
    expect(container.querySelectorAll('[data-label-kind]')).toHaveLength(3);
    const marker = container.querySelector('.ui-list-item-marker');
    expect(marker).toHaveAttribute('aria-hidden', 'true');
    expect(marker).toHaveAttribute('data-variant', 'bar');
    expect(marker).toHaveAttribute('data-tone', getKphLabelPresentation('condition', record.condition).tone);
    expect(screen.getByTitle(`Tình trạng: ${record.condition}`)).toHaveTextContent(record.condition);
    expect(screen.getByTitle(`Biện pháp: ${record.resolution}`)).toHaveTextContent(record.resolution);
    expect(screen.getByTitle("Trạng thái duyệt: Đã duyệt")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("checkbox", { name: `Chọn ${record.productName}` }));
    expect(select).toHaveBeenCalledWith([record.id]);
    fireEvent.click(screen.getByRole("button", { name: desktop ? `Mở phiếu ${record.productName}` : new RegExp(record.productName) }));
    expect(open).toHaveBeenCalledWith(record);
  });
});

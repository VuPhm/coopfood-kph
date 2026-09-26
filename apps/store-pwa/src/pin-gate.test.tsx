import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { getPilotSetting, resetPilotDatabaseForTests, setPilotSetting } from "./record-store";
import { savePilotStoreProfile } from "./store-profile";
import { PinGate } from "./pin-gate";

function enterPin(value: string) {
  fireEvent.change(screen.getByLabelText("Mã cửa hàng"), { target: { value } });
  fireEvent.click(screen.getByRole("button", { name: "Mở ứng dụng" }));
}

describe("store PIN gate", () => {
  beforeEach(async () => resetPilotDatabaseForTests());

  it("uses 0000 when no store code exists and does not alter existing local data", async () => {
    await setPilotSetting("existing-pilot-setting", { retained: true });
    render(<PinGate><div>Store workspace</div></PinGate>);

    expect(screen.queryByText("Store workspace")).not.toBeInTheDocument();
    enterPin("0000");

    expect(await screen.findByText("Store workspace")).toBeVisible();
    expect(await getPilotSetting("existing-pilot-setting")).toEqual({ retained: true });
  });

  it("keeps the app locked after an incorrect PIN", async () => {
    render(<PinGate><div>Store workspace</div></PinGate>);
    enterPin("1234");

    expect(await screen.findByRole("alert")).toHaveTextContent("Mã cửa hàng chưa đúng");
    expect(screen.queryByText("Store workspace")).not.toBeInTheDocument();
  });

  it("uses the current store code as text, including leading zeroes", async () => {
    await savePilotStoreProfile({ storeName: "Cống Quỳnh", storeCode: "0123", role: "", fullName: "", employeeCode: "" });
    render(<PinGate><div>Store workspace</div></PinGate>);
    enterPin("0123");

    expect(await screen.findByText("Store workspace")).toBeVisible();
  });

  it("derives the PIN again after the store code changes", async () => {
    await savePilotStoreProfile({ storeName: "Cống Quỳnh", storeCode: "1234", role: "", fullName: "", employeeCode: "" });
    const firstBootstrap = render(<PinGate><div>Store workspace</div></PinGate>);
    enterPin("1234");
    expect(await screen.findByText("Store workspace")).toBeVisible();
    firstBootstrap.unmount();

    await savePilotStoreProfile({ storeName: "Cống Quỳnh", storeCode: "5678", role: "", fullName: "", employeeCode: "" });
    render(<PinGate><div>Store workspace</div></PinGate>);
    enterPin("1234");
    expect(await screen.findByRole("alert")).toBeVisible();
    expect(screen.queryByText("Store workspace")).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Mã cửa hàng"), { target: { value: "5678" } });
    fireEvent.click(screen.getByRole("button", { name: "Mở ứng dụng" }));

    await waitFor(() => expect(screen.getByText("Store workspace")).toBeVisible());
  });
});

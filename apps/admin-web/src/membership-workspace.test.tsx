import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import storesFixture from "../../../contracts/fixtures/api/admin-membership-stores.json";
import membersFixture from "../../../contracts/fixtures/api/admin-store-memberships.json";
import userFixture from "../../../contracts/fixtures/api/admin-membership-user.json";
import { MembershipWorkspace, type MembershipGateway, membershipRootKey } from "./membership-workspace";
import { AdminApiError, type MembershipStore, type StoreMembership } from "./lifecycle-admin";

const stores = storesFixture as MembershipStore[];
const members = membersFixture as StoreMembership[];
function gateway(): MembershipGateway {
  return {
    listStoreMemberships: vi.fn().mockResolvedValue(members),
    lookupMembershipUser: vi.fn().mockResolvedValue(userFixture),
    upsertMembership: vi.fn().mockResolvedValue(members.find(item => item.username === "member.demo")),
    revokeMembership: vi.fn().mockResolvedValue({ ...members.find(item => item.username === "member.demo"), active: false }),
  };
}
function setup(api = gateway(), extraStores: MembershipStore[] = []) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  const onError = vi.fn();
  render(<QueryClientProvider client={client}><MembershipWorkspace gateway={api} actorId="actor-a" stores={[...stores, ...extraStores]} loading={false} loadError={null} onRefreshStores={vi.fn()} onError={onError} /></QueryClientProvider>);
  fireEvent.change(screen.getByLabelText("Cửa hàng"), { target: { value: stores[0]!.id } });
  return { api, client, onError };
}
async function findUser() {
  const trigger = await screen.findByRole("button", { name: "Gán quyền" });
  await waitFor(() => expect(trigger).toBeEnabled());
  fireEvent.click(trigger);
  const dialog = await screen.findByRole("dialog", { name: "Gán quyền cửa hàng" });
  fireEvent.change(within(dialog).getByLabelText(/Tên đăng nhập chính xác/), { target: { value: "  MEMBER.DEMO  " } });
  fireEvent.click(within(dialog).getByRole("button", { name: "Tìm tài khoản" }));
  await within(dialog).findByLabelText(/Vai trò tại cửa hàng/);
  return dialog;
}

describe("store membership workspace", () => {
  it("looks up exact username then submits explicit store/user, role and trimmed reason", async () => {
    const { api } = setup();
    await screen.findByRole("heading", { name: "Nhân viên tổng hợp" });
    const dialog = await findUser();
    expect(api.lookupMembershipUser).toHaveBeenCalledWith(stores[0]!.id, "member.demo");
    fireEvent.change(within(dialog).getByLabelText(/Vai trò tại cửa hàng/), { target: { value: "STORE_MANAGER" } });
    fireEvent.change(within(dialog).getByLabelText(/^Lý do/), { target: { value: "  Phân công tổng hợp  " } });
    fireEvent.click(within(dialog).getByRole("button", { name: "Lưu quyền" }));
    await waitFor(() => expect(api.upsertMembership).toHaveBeenCalledWith(stores[0]!.id, userFixture.id, "STORE_MANAGER", "Phân công tổng hợp"));
    await screen.findByText(/Đã lưu quyền cho member.demo/);
    await waitFor(() => expect(api.listStoreMemberships).toHaveBeenCalledTimes(2));
  });

  it("clears the found identity when username changes; a miss cannot grant a guessed user", async () => {
    const { api } = setup();
    const dialog = await findUser();
    vi.mocked(api.lookupMembershipUser).mockRejectedValue(new AdminApiError("Không tìm thấy tài khoản đang hoạt động", 404));
    fireEvent.change(within(dialog).getByLabelText(/Tên đăng nhập chính xác/), { target: { value: "unknown.demo" } });
    expect(within(dialog).queryByRole("button", { name: "Lưu quyền" })).not.toBeInTheDocument();
    fireEvent.click(within(dialog).getByRole("button", { name: "Tìm tài khoản" }));
    expect(await within(dialog).findByRole("alert")).toHaveTextContent("Không tìm thấy");
    expect(within(dialog).queryByLabelText(/Vai trò tại cửa hàng/)).not.toBeInTheDocument();
    expect(api.upsertMembership).not.toHaveBeenCalled();
  });

  it("retains role and reason after last-manager conflict; retries without optimistic changes", async () => {
    const { api } = setup();
    vi.mocked(api.upsertMembership).mockRejectedValueOnce(new AdminApiError("Cửa hàng phải còn quản lý", 409, "LAST_STORE_MANAGER_REQUIRED"));
    fireEvent.click(await screen.findByRole("button", { name: "Đổi vai trò của manager.demo" }));
    const dialog = screen.getByRole("dialog", { name: "Đổi vai trò cửa hàng" });
    fireEvent.change(within(dialog).getByLabelText(/Vai trò tại cửa hàng/), { target: { value: "EMPLOYEE" } });
    fireEvent.change(within(dialog).getByLabelText(/^Lý do/), { target: { value: "Thay đổi phân công" } });
    fireEvent.click(within(dialog).getByRole("button", { name: "Lưu quyền" }));
    await within(dialog).findByRole("alert");
    expect(within(dialog).getByLabelText(/^Lý do/)).toHaveValue("Thay đổi phân công");
    expect(within(dialog).getByLabelText(/Vai trò tại cửa hàng/)).toHaveValue("EMPLOYEE");
    expect(api.listStoreMemberships).toHaveBeenCalledTimes(1);
    fireEvent.click(within(dialog).getByRole("button", { name: "Lưu quyền" }));
    await screen.findByText(/Đã lưu quyền cho/);
  });

  it("keeps account state distinct from membership state and requires revoke reason", async () => {
    const { api } = setup();
    await screen.findByRole("heading", { name: "Tài khoản ngừng hoạt động" });
    expect(screen.queryByRole("button", { name: "Đổi vai trò của inactive.demo" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Thu hồi quyền của inactive.demo" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Cấp lại quyền cho revoked.demo" })).toBeEnabled();
    fireEvent.click(screen.getByRole("button", { name: "Thu hồi quyền của member.demo" }));
    const dialog = screen.getByRole("dialog", { name: "Thu hồi quyền cửa hàng" });
    expect(within(dialog).getByRole("button", { name: "Xác nhận thu hồi" })).toBeDisabled();
    expect(within(dialog).getByText(/Quyền vùng hoặc toàn chuỗi hợp lệ vẫn được giữ/)).toBeVisible();
    fireEvent.change(within(dialog).getByLabelText(/^Lý do/), { target: { value: "Kết thúc phân công" } });
    fireEvent.click(within(dialog).getByRole("button", { name: "Xác nhận thu hồi" }));
    await waitFor(() => expect(api.revokeMembership).toHaveBeenCalledWith(stores[0]!.id, userFixture.id, "Kết thúc phân công"));
    await screen.findByText(/Đã thu hồi quyền của member.demo/);
  });

  it("does not show old members while another store is loading or when a refresh fails", async () => {
    const other = { ...stores[0]!, id: "30000000-0000-4000-8000-000000000002", code: "002" };
    const { api } = setup(gateway(), [other]);
    await screen.findByRole("heading", { name: "Nhân viên tổng hợp" });
    vi.mocked(api.listStoreMemberships).mockRejectedValue(new AdminApiError("Ngoài phạm vi", 403));
    fireEvent.change(screen.getByLabelText("Cửa hàng"), { target: { value: other.id } });
    expect(screen.queryByRole("heading", { name: "Nhân viên tổng hợp" })).not.toBeInTheDocument();
    await screen.findByRole("alert");
    expect(screen.getByRole("button", { name: "Gán quyền" })).toBeDisabled();
    expect(screen.queryByText("member.demo")).not.toBeInTheDocument();
  });

  it("notifies the app on an expired member request and namespaces cached members by actor/store", async () => {
    const { api, client, onError } = setup();
    await screen.findByRole("heading", { name: "Nhân viên tổng hợp" });
    expect(client.getQueryData([...membershipRootKey, "members", "actor-a", stores[0]!.id])).toEqual(members);
    const expired = new AdminApiError("Phiên hết hạn", 401);
    vi.mocked(api.listStoreMemberships).mockRejectedValue(expired);
    fireEvent.click(screen.getByRole("button", { name: "Tải lại quyền cửa hàng" }));
    await waitFor(() => expect(onError).toHaveBeenCalledWith(expired));
    expect(screen.queryByText("member.demo")).not.toBeInTheDocument();
  });
});

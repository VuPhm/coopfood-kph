import { createKphApiClient, type components } from "@coopfood-kph/api";

export type AdminSession = components["schemas"]["SessionResponse"];
export type LifecycleTarget = components["schemas"]["LifecycleTarget"];
export type LifecycleSchedule = components["schemas"]["LifecycleSchedule"];
export type LifecycleTargetType = components["schemas"]["LifecycleTargetType"];
export type CatalogImportBatch = components["schemas"]["CatalogImportBatch"];
export type CatalogImportDetail = components["schemas"]["CatalogImportDetail"];
export type CatalogImportUploadResponse = components["schemas"]["CatalogImportUploadResponse"];
export type AdminUser = components["schemas"]["AdminUser"];

export type MembershipStore = components["schemas"]["AdminMembershipStore"];
export type StoreMembership = components["schemas"]["AdminStoreMembership"];
export type MembershipUser = components["schemas"]["MembershipLookupUser"];
export type MembershipRole = components["schemas"]["StoreRole"];

export class AdminApiError extends Error {
  readonly status: number | undefined;
  readonly code: string | undefined;

  constructor(message: string, status?: number, code?: string) {
    super(message);
    this.name = "AdminApiError";
    this.status = status;
    this.code = code;
  }
}

export type LifecycleAdminGateway = {
  getSession(signal?: AbortSignal): Promise<AdminSession>;
  login(username: string, password: string): Promise<AdminSession>;
  logout(): Promise<void>;
  changePassword(currentPassword: string, newPassword: string): Promise<void>;
  listTargets(signal?: AbortSignal): Promise<LifecycleTarget[]>;
  listSchedules(signal?: AbortSignal): Promise<LifecycleSchedule[]>;
  createSchedule(input: {
    targetType: LifecycleTargetType;
    targetId: string;
    effectiveDate: string;
    reason: string;
  }): Promise<LifecycleSchedule>;
  reschedule(id: string, effectiveDate: string, reason: string): Promise<LifecycleSchedule>;
  cancel(id: string, reason: string): Promise<LifecycleSchedule>;
  execute(id: string, reason: string): Promise<LifecycleSchedule>;
  listCatalogImports(signal?: AbortSignal): Promise<CatalogImportBatch[]>;
  getCatalogImport(id: string, offset?: number, signal?: AbortSignal): Promise<CatalogImportDetail>;
  uploadCatalogImport(file: File): Promise<CatalogImportUploadResponse>;
  listMembershipStores(signal?: AbortSignal): Promise<MembershipStore[]>;
  listStoreMemberships(storeId: string, signal?: AbortSignal): Promise<StoreMembership[]>;
  lookupMembershipUser(storeId: string, username: string): Promise<MembershipUser>;
  upsertMembership(storeId: string, userId: string, role: MembershipRole, reason: string): Promise<StoreMembership>;
  revokeMembership(storeId: string, userId: string, reason: string): Promise<StoreMembership>;
  listUsers(signal?: AbortSignal): Promise<AdminUser[]>;
  deactivateUser(id: string, reason: string): Promise<AdminUser>;
};

export function createLifecycleAdminGateway(
  options: { baseUrl?: string; fetch?: typeof globalThis.fetch } = {},
): LifecycleAdminGateway {
  let csrfToken = "";
  const client = createKphApiClient({ ...options, getCsrfToken: () => csrfToken });

  async function getSession(signal?: AbortSignal) {
    const response = await client.GET("/api/v1/auth/session", signal ? { signal } : {});
    if (response.error || !response.data) throw apiError(response, "Phiên đăng nhập đã hết hạn.");
    csrfToken = response.data.csrfToken;
    return response.data;
  }

  async function login(username: string, password: string) {
    csrfToken = "";
    const response = await client.POST("/api/v1/auth/login", { body: { username, password } });
    if (response.error || !response.data) throw apiError(response, "Tên đăng nhập hoặc mật khẩu không đúng.");
    csrfToken = response.data.csrfToken;
    return response.data;
  }

  async function logout() {
    const response = await client.POST("/api/v1/auth/logout", {
      params: { header: { "X-CSRF-TOKEN": csrfToken } },
    });
    if (response.error) throw apiError(response, "Không thể đăng xuất lúc này.");
    csrfToken = "";
  }

  async function changePassword(currentPassword: string, newPassword: string) {
    const response = await client.POST("/api/v1/auth/password/change", {
      params: { header: { "X-CSRF-TOKEN": csrfToken } },
      body: { currentPassword, newPassword },
    });
    if (response.error) throw apiError(response, "Không thể đổi mật khẩu lúc này.");
    csrfToken = "";
  }

  async function listTargets(signal?: AbortSignal) {
    const response = await client.GET("/api/v1/admin/lifecycle/targets", signal ? { signal } : {});
    if (response.error || !response.data) throw apiError(response, "Không thể tải phạm vi lifecycle.");
    return response.data;
  }

  async function listSchedules(signal?: AbortSignal) {
    const response = await client.GET("/api/v1/admin/lifecycle/schedules", signal ? { signal } : {});
    if (response.error || !response.data) throw apiError(response, "Không thể tải lịch deactivate.");
    return response.data;
  }

  async function createSchedule(input: {
    targetType: LifecycleTargetType;
    targetId: string;
    effectiveDate: string;
    reason: string;
  }) {
    const response = await client.POST("/api/v1/admin/lifecycle/schedules", {
      params: { header: { "X-CSRF-TOKEN": csrfToken } },
      body: input,
    });
    if (response.error || !response.data) throw apiError(response, "Không thể tạo lịch deactivate.");
    return response.data;
  }

  async function reschedule(id: string, effectiveDate: string, reason: string) {
    const response = await client.PUT("/api/v1/admin/lifecycle/schedules/{scheduleId}", {
      params: { path: { scheduleId: id }, header: { "X-CSRF-TOKEN": csrfToken } },
      body: { effectiveDate, reason },
    });
    if (response.error || !response.data) throw apiError(response, "Không thể đổi ngày hiệu lực.");
    return response.data;
  }

  async function cancel(id: string, reason: string) {
    const response = await client.POST("/api/v1/admin/lifecycle/schedules/{scheduleId}/cancel", {
      params: { path: { scheduleId: id }, header: { "X-CSRF-TOKEN": csrfToken } },
      body: { reason },
    });
    if (response.error || !response.data) throw apiError(response, "Không thể hủy lịch deactivate.");
    return response.data;
  }

  async function execute(id: string, reason: string) {
    const response = await client.POST("/api/v1/admin/lifecycle/schedules/{scheduleId}/execute", {
      params: { path: { scheduleId: id }, header: { "X-CSRF-TOKEN": csrfToken } },
      body: { reason },
    });
    if (response.error || !response.data) throw apiError(response, "Không thể thực thi lịch deactivate.");
    return response.data;
  }

  async function listCatalogImports(signal?: AbortSignal) {
    const response = await client.GET("/api/v1/admin/catalog/imports", signal ? { signal } : {});
    if (response.error || !response.data) throw apiError(response, "Không thể tải lịch sử kiểm tra catalog.");
    return response.data;
  }

  async function getCatalogImport(id: string, offset = 0, signal?: AbortSignal) {
    const response = await client.GET("/api/v1/admin/catalog/imports/{batchId}", {
      params: { path: { batchId: id }, query: { offset, limit: 200 } },
      ...(signal ? { signal } : {}),
    });
    if (response.error || !response.data) throw apiError(response, "Không thể tải chi tiết batch catalog.");
    return response.data;
  }

  async function uploadCatalogImport(file: File) {
    const form = new FormData();
    form.append("file", file, file.name);
    const response = await client.POST("/api/v1/admin/catalog/imports", {
      params: { header: { "X-CSRF-TOKEN": csrfToken } },
      body: { file: file as unknown as string },
      bodySerializer: () => form,
    });
    if (response.error || !response.data) throw apiError(response, "Không thể kiểm tra file catalog.");
    return response.data;
  }

  async function listMembershipStores(signal?: AbortSignal) {
    const response = await client.GET("/api/v1/admin/membership-stores", signal ? { signal } : {});
    if (response.error || !response.data) throw apiError(response, "Không thể tải cửa hàng được quản lý.");
    return response.data;
  }

  async function listStoreMemberships(storeId: string, signal?: AbortSignal) {
    const response = await client.GET("/api/v1/admin/stores/{storeId}/memberships", {
      params: { path: { storeId } }, ...(signal ? { signal } : {}),
    });
    if (response.error || !response.data) throw apiError(response, "Không thể tải quyền cửa hàng.");
    return response.data;
  }

  async function lookupMembershipUser(storeId: string, username: string) {
    const response = await client.POST("/api/v1/admin/stores/{storeId}/membership-user-lookup", {
      params: { path: { storeId }, header: { "X-CSRF-TOKEN": csrfToken } }, body: { username },
    });
    if (response.error || !response.data) throw apiError(response, "Không thể tìm tài khoản.");
    return response.data;
  }

  async function upsertMembership(storeId: string, userId: string, role: MembershipRole, reason: string) {
    const response = await client.PUT("/api/v1/admin/stores/{storeId}/memberships/{userId}", {
      params: { path: { storeId, userId }, header: { "X-CSRF-TOKEN": csrfToken } }, body: { role, reason },
    });
    if (response.error || !response.data) throw apiError(response, "Không thể lưu quyền cửa hàng.");
    return response.data;
  }

  async function revokeMembership(storeId: string, userId: string, reason: string) {
    const response = await client.POST("/api/v1/admin/stores/{storeId}/memberships/{userId}/revoke", {
      params: { path: { storeId, userId }, header: { "X-CSRF-TOKEN": csrfToken } }, body: { reason },
    });
    if (response.error || !response.data) throw apiError(response, "Không thể thu hồi quyền cửa hàng.");
    return response.data;
  }

  async function listUsers(signal?: AbortSignal) {
    const response = await client.GET("/api/v1/admin/users", signal ? { signal } : {});
    if (response.error || !response.data) throw apiError(response, "Không thể tải danh sách tài khoản.");
    return response.data;
  }

  async function deactivateUser(id: string, reason: string) {
    const response = await client.POST("/api/v1/admin/users/{userId}/deactivate", {
      params: { path: { userId: id }, header: { "X-CSRF-TOKEN": csrfToken } },
      body: { reason },
    });
    if (response.error || !response.data) throw apiError(response, "Không thể vô hiệu hóa tài khoản.");
    return response.data;
  }

  return {
    getSession, login, logout, changePassword,
    listTargets, listSchedules, createSchedule, reschedule, cancel, execute,
    listCatalogImports, getCatalogImport, uploadCatalogImport,
    listUsers, deactivateUser,
    listMembershipStores, listStoreMemberships, lookupMembershipUser, upsertMembership, revokeMembership,
  };
}

function apiError(
  response: { response?: Response; error?: unknown },
  fallback: string,
) {
  const problem = response.error as { code?: string; detail?: string } | undefined;
  const messages: Record<string, string> = {
    AUTHENTICATION_REQUIRED: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
    INVALID_CREDENTIALS: "Tên đăng nhập hoặc mật khẩu không đúng.",
    CURRENT_PASSWORD_INVALID: "Mật khẩu hiện tại không đúng.",
    PASSWORD_LENGTH_INVALID: "Mật khẩu mới phải dài từ 15 đến 64 ký tự Unicode.",
    PASSWORD_BLOCKED: "Mật khẩu mới quá phổ biến hoặc có thông tin dễ đoán của tài khoản.",
    PASSWORD_REUSE_FORBIDDEN: "Mật khẩu mới phải khác mật khẩu hiện tại.",
    LIFECYCLE_ADMIN_REQUIRED: "Bạn chưa có quyền quản trị chuỗi hoặc vùng đang hoạt động.",
    LIFECYCLE_TARGET_SCOPE_DENIED: "Vùng hoặc cửa hàng này nằm ngoài phạm vi của bạn.",
    LIFECYCLE_TARGET_NOT_FOUND: "Không tìm thấy vùng hoặc cửa hàng này.",
    LIFECYCLE_TARGET_INACTIVE: "Vùng hoặc cửa hàng này đã ngừng hoạt động.",
    LIFECYCLE_SCHEDULE_EXISTS: "Vùng hoặc cửa hàng này đã có lịch đang chờ. Hãy đổi hoặc hủy lịch đó.",
    LIFECYCLE_SCHEDULE_NOT_FOUND: "Không tìm thấy lịch này. Hãy tải lại danh sách.",
    LIFECYCLE_SCHEDULE_FINAL: "Lịch đã hủy hoặc đã thực thi không thể thay đổi.",
    LIFECYCLE_SCHEDULE_NOT_DUE: "Chưa đến ngày hiệu lực của lịch này.",
    EFFECTIVE_DATE_TOO_SOON: "Ngày hiệu lực phải cách ngày hiện tại ít nhất 30 ngày.",
    LIFECYCLE_REASON_INVALID: "Hãy nhập lý do từ 1 đến 500 ký tự.",
    REGION_HAS_ACTIVE_STORES: "Vùng vẫn còn cửa hàng hoạt động. Hãy ngừng hoạt động các cửa hàng trước.",
    STORE_REGION_INACTIVE: "Vùng của cửa hàng không còn hoạt động. Vui lòng kiểm tra lại.",
    ACTIVE_STORE_MANAGER_REQUIRED: "Cửa hàng phải còn ít nhất một quản lý đang hoạt động trước khi thực thi.",
    CATALOG_ADMIN_REQUIRED: "Bạn chưa có quyền quản trị catalog.",
    CATALOG_IMPORT_NOT_FOUND: "Không tìm thấy batch catalog này.",
    CATALOG_FILE_EMPTY: "Hãy chọn file CSV có dữ liệu.",
    CATALOG_FILE_TOO_LARGE: "File catalog không được vượt quá 5 MiB.",
    CATALOG_FILE_UNREADABLE: "Không thể đọc file catalog này.",
    CATALOG_ENCODING_INVALID: "File catalog phải dùng UTF-8.",
    CATALOG_HEADER_INVALID: "Header phải đúng thứ tự: NCC, Tên NCC, UPC, SKU, Tên sản phẩm.",
    CATALOG_CSV_MALFORMED: "Cấu trúc CSV không hợp lệ. Hãy kiểm tra dấu phẩy và dấu ngoặc kép.",
    CATALOG_ROW_LIMIT_EXCEEDED: "File catalog không được vượt quá 50.000 dòng dữ liệu.",
    CHAIN_ADMIN_REQUIRED: "Bạn cần quyền quản trị chuỗi đang hoạt động.",
    ADMIN_USER_NOT_FOUND: "Không tìm thấy tài khoản này. Hãy tải lại danh sách.",
    ADMIN_USER_ALREADY_INACTIVE: "Tài khoản này đã bị vô hiệu hóa.",
    USER_SELF_DEACTIVATION_FORBIDDEN: "Bạn không thể tự vô hiệu hóa tài khoản đang đăng nhập.",
    LAST_CHAIN_ADMIN_REQUIRED: "Không thể vô hiệu hóa quản trị chuỗi cuối cùng đang hoạt động.",
    LAST_STORE_MANAGER_REQUIRED: "Cửa hàng phải còn ít nhất một quản lý đang hoạt động. Hãy bổ sung quản lý thay thế trước.",
    MEMBERSHIP_ADMIN_REQUIRED: "Bạn chưa có quyền quản lý cửa hàng trong chuỗi hoặc vùng đang hoạt động.",
    MEMBERSHIP_STORE_SCOPE_DENIED: "Cửa hàng không còn hoạt động hoặc nằm ngoài phạm vi quản lý của bạn. Hãy tải lại cửa hàng.",
    MEMBERSHIP_USER_NOT_FOUND: "Không tìm thấy tài khoản đang hoạt động với tên đăng nhập này.",
    MEMBERSHIP_NOT_FOUND: "Không còn quyền cửa hàng này. Hãy tải lại danh sách.",
    MEMBERSHIP_ALREADY_REVOKED: "Quyền này đã được thu hồi. Hãy tải lại danh sách.",
    MEMBERSHIP_ROLE_INVALID: "Hãy chọn Nhân viên hoặc Quản lý cửa hàng.",
    MEMBERSHIP_USERNAME_INVALID: "Hãy nhập tên đăng nhập chính xác, từ 3 đến 64 ký tự chữ Latin, số, dấu chấm, gạch nối hoặc gạch dưới.",
    MEMBERSHIP_REASON_INVALID: "Hãy nhập lý do từ 1 đến 500 ký tự.",
    ADMIN_USER_STATE_CHANGED: "Trạng thái tài khoản vừa thay đổi. Hãy tải lại danh sách.",
    USER_DEACTIVATION_REASON_INVALID: "Hãy nhập lý do từ 1 đến 500 ký tự.",
  };
  return new AdminApiError((problem?.code && messages[problem.code]) || fallback, response.response?.status, problem?.code);
}

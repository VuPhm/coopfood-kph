import { createKphApiClient, type components } from "@coopfood-kph/api";

export type AdminSession = components["schemas"]["SessionResponse"];
export type LifecycleTarget = components["schemas"]["LifecycleTarget"];
export type LifecycleSchedule = components["schemas"]["LifecycleSchedule"];
export type LifecycleTargetType = components["schemas"]["LifecycleTargetType"];

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

  return { getSession, login, logout, listTargets, listSchedules, createSchedule, reschedule, cancel, execute };
}

function apiError(
  response: { response?: Response; error?: unknown },
  fallback: string,
) {
  const problem = response.error as { code?: string; detail?: string } | undefined;
  const messages: Record<string, string> = {
    AUTHENTICATION_REQUIRED: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
    INVALID_CREDENTIALS: "Tên đăng nhập hoặc mật khẩu không đúng.",
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
  };
  return new AdminApiError((problem?.code && messages[problem.code]) || fallback, response.response?.status, problem?.code);
}

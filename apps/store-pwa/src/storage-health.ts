export type StorageHealth = {
  persistent: boolean;
  quota: number | null;
  usage: number | null;
};

export const STORAGE_WARNING_PERCENT = 70;
export const STORAGE_CRITICAL_PERCENT = 85;

export type StorageHealthWarning = {
  level: "warning" | "critical";
  message: string;
};

export async function readStorageHealth(): Promise<StorageHealth> {
  if (!navigator.storage) return { persistent: false, quota: null, usage: null };
  const [persistent, estimate] = await Promise.all([
    navigator.storage.persisted?.().catch(() => false) ?? false,
    navigator.storage.estimate?.().catch((): StorageEstimate => ({})) ?? Promise.resolve<StorageEstimate>({}),
  ]);
  return {
    persistent,
    quota: typeof estimate.quota === "number" ? estimate.quota : null,
    usage: typeof estimate.usage === "number" ? estimate.usage : null,
  };
}

export async function requestPersistentStorage() {
  if (!navigator.storage?.persist) return readStorageHealth();
  await navigator.storage.persist().catch(() => false);
  return readStorageHealth();
}

export function storageUsageLabel(health: StorageHealth) {
  if (health.usage === null || health.quota === null || health.quota <= 0) return "dữ liệu: trên thiết bị";
  const usageMb = Math.max(0.1, health.usage / 1024 / 1024).toFixed(1);
  const percent = Math.min(100, Math.round((health.usage / health.quota) * 100));
  const percentLabel = percent === 0 && health.usage > 0 ? "<1%" : `${percent}%`;
  return `dữ liệu: ${usageMb}MB · ${percentLabel}`;
}

export function storageHealthWarning(health: StorageHealth): StorageHealthWarning | null {
  if (health.usage !== null && health.quota !== null && health.quota > 0) {
    const percent = (health.usage / health.quota) * 100;
    if (percent >= STORAGE_CRITICAL_PERCENT) {
      return {
        level: "critical",
        message: "Dung lượng lưu trữ Pilot sắp đầy. Hãy kết sổ Excel ngay và không xóa site data.",
      };
    }
    if (percent >= STORAGE_WARNING_PERCENT) {
      return {
        level: "warning",
        message: "Dung lượng lưu trữ Pilot đang cao. Hãy sớm kết sổ Excel và kiểm tra file đã mở được.",
      };
    }
  }

  if (!health.persistent) {
    return {
      level: "warning",
      message: "Trình duyệt chưa xác nhận lưu trữ bền. Không xóa site data và hãy kết sổ Excel thường xuyên.",
    };
  }
  return null;
}

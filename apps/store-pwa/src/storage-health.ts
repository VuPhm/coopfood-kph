export type StorageHealth = {
  persistent: boolean;
  quota: number | null;
  usage: number | null;
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
  return `dữ liệu: ${usageMb}MB · ${percent}%`;
}

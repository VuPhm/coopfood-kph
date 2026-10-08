/** Advisory pilot usage metrics. Starts only after PIN unlock. */
const INGEST_URL = 'https://traffic.vuphm.io.vn/api/usage';
const INSTALLATION_KEY = 'kph-usage-installation-v1';
const HEARTBEAT_MS = 5 * 60 * 1000;
const IDLE_MS = 10 * 60 * 1000;
const SESSION_TIMEOUT_MS = 30 * 60 * 1000;

let storeCode = '';
let installationId = '';
let sessionId = '';
let lastInteractionAt = 0;
let lastReportAt = 0;
let listenersAttached = false;

function installation(): string {
  if (installationId) return installationId;
  try {
    const saved = localStorage.getItem(INSTALLATION_KEY);
    if (saved && /^[0-9a-f-]{36}$/i.test(saved)) return (installationId = saved);
  } catch { /* blocked persistent storage */ }
  installationId = crypto.randomUUID();
  try { localStorage.setItem(INSTALLATION_KEY, installationId); } catch { /* session only */ }
  return installationId;
}
function visibleAndOnline(): boolean {
  return document.visibilityState === 'visible' && navigator.onLine !== false;
}
function report(event: 'session_start' | 'heartbeat') {
  if (!/^\d{4}$/.test(storeCode) || !visibleAndOnline()) return;
  lastReportAt = Date.now();
  // Never add storeCode to URL, Cloudflare beacon metadata, or console logs.
  try {
    void fetch(INGEST_URL, {
      method: 'POST', mode: 'cors', credentials: 'omit', keepalive: true,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event, storeCode, installationId: installation(), sessionId }),
    }).catch(() => { /* Optional telemetry must never interrupt KPH. */ });
  } catch { /* Some browsers or offline proxies may throw synchronously. */ }
}
function resumeIfDue() {
  if (!storeCode || !visibleAndOnline()) return;
  const now = Date.now();
  if (now - lastInteractionAt > IDLE_MS) return;
  if (!sessionId || now - lastReportAt > SESSION_TIMEOUT_MS) {
    sessionId = crypto.randomUUID();
    report('session_start');
  } else if (now - lastReportAt >= HEARTBEAT_MS) report('heartbeat');
}
function interact() { lastInteractionAt = Date.now(); resumeIfDue(); }
function visibilityResume() { if (visibleAndOnline()) { lastInteractionAt = Date.now(); resumeIfDue(); } }
/** Can be called after a change in store-profile as well as after PIN unlock. */
export function startStoreUsageTracking(code: string) {
  // Do not send production telemetry in Vitest or local Vite development.
  if (!import.meta.env.PROD || !/^\d{4}$/.test(code)) return;
  if (code !== storeCode) {
    storeCode = code;
    sessionId = '';
    lastReportAt = 0;
  }
  lastInteractionAt = Date.now();
  if (!listenersAttached) {
    listenersAttached = true;
    document.addEventListener('pointerdown', interact, { passive: true });
    document.addEventListener('keydown', interact, { passive: true });
    document.addEventListener('visibilitychange', visibilityResume);
    window.addEventListener('online', visibilityResume);
    window.setInterval(resumeIfDue, HEARTBEAT_MS);
  }
  resumeIfDue();
}

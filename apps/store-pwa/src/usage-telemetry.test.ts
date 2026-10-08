import { afterEach, describe, expect, it, vi } from 'vitest';

import { startStoreUsageTracking } from './usage-telemetry';

describe('pilot store-usage telemetry', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it('stays disabled during tests, never sends an invalid code and deduplicates startup', () => {
    vi.useFakeTimers();
    vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('visible');
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true);
    const fetchMock = vi.fn().mockResolvedValue({ status: 204 });
    vi.stubGlobal('fetch', fetchMock);

    startStoreUsageTracking('9999');
    expect(fetchMock).not.toHaveBeenCalled();

    vi.stubEnv('PROD', true);
    startStoreUsageTracking('bad-code');
    expect(fetchMock).not.toHaveBeenCalled();

    startStoreUsageTracking('9999');
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [target, request] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(target).toBe('https://traffic.vuphm.io.vn/api/usage');
    expect(request.method).toBe('POST');
    expect(request.credentials).toBe('omit');
    const payload = JSON.parse(String(request.body));
    expect(payload).toMatchObject({ event: 'session_start', storeCode: '9999' });
    expect(payload.installationId).toMatch(/^[0-9a-f-]{36}$/i);
    expect(payload.sessionId).toMatch(/^[0-9a-f-]{36}$/i);

    startStoreUsageTracking('9999');
    expect(fetchMock).toHaveBeenCalledTimes(1);

    startStoreUsageTracking('0123');
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const second = JSON.parse(String((fetchMock.mock.calls[1] as [string, RequestInit])[1].body));
    expect(second.storeCode).toBe('0123');
    expect(second.sessionId).not.toBe(payload.sessionId);
    expect(second.installationId).toBe(payload.installationId);
  });
});

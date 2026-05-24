let eventSource: EventSource | null = null;
let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 10;
const RECONNECT_DELAY = 3000;

const listeners = new Set<(data: unknown) => void>();

function getApiBaseUrl(): string {
  return (import.meta as any).env?.VITE_API_URL ?? "";
}

export function connectSSE(): void {
  const token = localStorage.getItem("clavis_token");
  if (!token) return;

  if (eventSource) {
    eventSource.close();
  }

  const base = getApiBaseUrl();
  const url = base
    ? `${base}/api/events?token=${encodeURIComponent(token)}`
    : `/api/events?token=${encodeURIComponent(token)}`;

  eventSource = new EventSource(url);

  eventSource.onopen = () => {
    reconnectAttempts = 0;
  };

  eventSource.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data as string);
      listeners.forEach((listener) => listener(data));
    } catch {
      // Heartbeat or non-JSON message — ignore
    }
  };

  eventSource.onerror = () => {
    eventSource?.close();
    eventSource = null;

    if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
      reconnectAttempts++;
      reconnectTimeout = setTimeout(() => {
        connectSSE();
      }, RECONNECT_DELAY * reconnectAttempts);
    }
  };
}

export function disconnectSSE(): void {
  if (reconnectTimeout) {
    clearTimeout(reconnectTimeout);
    reconnectTimeout = null;
  }
  eventSource?.close();
  eventSource = null;
  reconnectAttempts = 0;
}

export function onSSEMessage(callback: (data: unknown) => void): () => void {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

export function isSSEConnected(): boolean {
  return eventSource?.readyState === EventSource.OPEN;
}

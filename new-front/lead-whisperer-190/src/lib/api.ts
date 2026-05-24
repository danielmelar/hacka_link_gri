import axios from "axios";

const API_BASE_URL = (import.meta as any).env?.VITE_API_URL ?? "";

export const api = axios.create({
  baseURL: API_BASE_URL ? `${API_BASE_URL}/api` : "/api",
  headers: { "Content-Type": "application/json" },
});

// Attach JWT to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("clavis_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Redirect to login on 401
api.interceptors.response.use(
  (r) => r,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("clavis_token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);

// ── Auth ────────────────────────────────────────────────────────────────────
export const authApi = {
  login: (email: string, password: string) =>
    api.post<{ success: boolean; data: { token: string; broker: ApiBroker } }>("/auth/login", {
      email,
      password,
    }),
  me: () => api.get<{ success: boolean; data: ApiBroker }>("/auth/me"),
};

// ── Dashboard / Leads (backend dashboard.ts routes) ────────────────────────
export const dashboardApi = {
  getProfile: () => api.get<{ success: boolean; data: ApiBroker }>("/profile"),
  getStats: () => api.get<{ success: boolean; data: ApiStats }>("/stats"),
  getLeads: (params?: Record<string, unknown>) =>
    api.get<{ success: boolean; data: ApiLead[]; meta: ApiMeta }>("/leads", { params }),
  getLead: (id: string) => api.get<{ success: boolean; data: ApiLead }>(`/leads/${id}`),
  getMessages: (id: string, params?: Record<string, unknown>) =>
    api.get<{ success: boolean; data: ApiMessage[] }>(`/leads/${id}/messages`, { params }),
  claimLead: (id: string) => api.post(`/leads/${id}/claim`),
  addNote: (id: string, note: string) => api.post(`/leads/${id}/notes`, { note }),
  updateLead: (id: string, data: Record<string, unknown>) => api.put(`/leads/${id}`, data),
};

// ── Properties ──────────────────────────────────────────────────────────────
export const propertiesApi = {
  getAll: (params?: Record<string, unknown>) =>
    api.get<{ success: boolean; data: ApiProperty[]; meta: ApiMeta }>("/properties", { params }),
  getById: (id: string) => api.get<{ success: boolean; data: ApiProperty }>(`/properties/${id}`),
};

// ── Analytics ───────────────────────────────────────────────────────────────
export const analyticsApi = {
  getOverview: () => api.get<{ success: boolean; data: ApiAnalyticsOverview }>("/analytics/overview"),
};

// ── Settings ────────────────────────────────────────────────────────────────
export const settingsApi = {
  get: () => api.get("/settings"),
  update: (data: unknown) => api.put("/settings", data),
};

// ── Types (shape of backend responses) ──────────────────────────────────────
export interface ApiBroker {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  plan: "free" | "pro" | "enterprise";
  deepLinkToken: string;
  settings: {
    notificationEmail: boolean;
    notificationPush: boolean;
    autoQualification: boolean;
    workingHours: { start: string; end: string; timezone: string };
  };
  isActive: boolean;
  createdAt: string;
}

export interface ApiLeadState {
  etapa: string | null;
  perfilEstimado: "MCMV" | "MedioPadrao" | "AltoPadrao" | "Indefinido";
  temFilhos: boolean | null;
  quantosFilhos: number | null;
  dorPrincipal: string | null;
  orcamentoEstimado: string | null;
  regiaoInteresse: string | null;
  tipoImovel: string | null;
  urgencia: "baixa" | "media" | "alta" | null;
  prontoParaCorretor: boolean;
  agenteAtual: string;
}

export interface ApiLead {
  _id: string;
  brokerId: string;
  telegramChatId: string;
  name?: string;
  phone?: string;
  email?: string;
  state: ApiLeadState;
  score: number;
  scoreHistory: Array<{ score: number; reason: string; timestamp: string }>;
  lastInteractionAt: string;
  firstInteractionAt: string;
  totalMessages: number;
  isActive: boolean;
  claimedByBroker: boolean;
  claimedAt?: string;
  tags: string[];
  notes?: string;
  scheduledAppointment?: { date: string; location?: string; notes?: string };
  suggestedPropertyIds?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ApiMessage {
  _id: string;
  leadId: string;
  brokerId: string;
  direction: "inbound" | "outbound";
  content: string;
  messageType: string;
  telegramMessageId?: number;
  processedByAgent?: string;
  createdAt: string;
}

export interface ApiProperty {
  _id: string;
  brokerId: string;
  name: string;
  type: string;
  description?: string;
  address: {
    street?: string;
    neighborhood: string;
    city: string;
    state: string;
    zipCode?: string;
  };
  price: number;
  area?: number;
  bedrooms?: number;
  bathrooms?: number;
  parkingSpaces?: number;
  features: string[];
  targetProfile: string[];
  status: string;
  active: boolean;
  images: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ApiStats {
  leads: {
    total: number;
    active: number;
    qualified: number;
    readyForContact: number;
  };
  messages: {
    inbound: number;
    outbound: number;
    total: number;
  };
  properties: number;
}

export interface ApiAnalyticsOverview {
  leads: {
    total: number;
    newThisMonth: number;
    newThisWeek: number;
    qualified: number;
    readyForContact: number;
    claimed: number;
    conversionRate: number;
  };
  properties: { total: number; active: number };
  timeline: Array<{ date: string; count: number }>;
}

export interface ApiMeta {
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
}

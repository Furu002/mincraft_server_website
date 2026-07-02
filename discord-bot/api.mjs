import { config } from "./config.mjs";

export class ApiError extends Error {
  constructor(status, message, payload = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.payload = payload;
  }
}

export function discordAccount(user) {
  return {
    provider: "discord",
    sub: user.id,
    name: user.globalName || user.username || user.id,
  };
}

async function readJson(response) {
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return { ok: false, message: text };
  }
}

export async function apiFetch(path, { method = "GET", body = null, token = "", adminToken = "" } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), config.requestTimeoutMs);
  const headers = {
    Accept: "application/json",
  };

  if (body !== null) headers["Content-Type"] = "application/json";
  if (token) headers.Authorization = `Bearer ${token}`;
  if (adminToken) headers["X-Aurora-Admin-Token"] = adminToken;

  try {
    const response = await fetch(`${config.playerApiBase}${path}`, {
      method,
      headers,
      body: body === null ? undefined : JSON.stringify(body),
      signal: controller.signal,
    });
    const payload = await readJson(response);
    if (!response.ok || payload.ok === false) {
      throw new ApiError(response.status, payload.message || `API request failed: ${response.status}`, payload);
    }
    return payload;
  } catch (error) {
    if (error.name === "AbortError") {
      throw new ApiError(408, "마크 서버 API 응답 시간이 초과됐습니다.");
    }
    if (error instanceof ApiError) throw error;
    throw new ApiError(502, error.message || "마크 서버 API에 연결할 수 없습니다.");
  } finally {
    clearTimeout(timer);
  }
}

export function getMarket() {
  return apiFetch("/stocks/market");
}

export function getServerOverview() {
  return apiFetch("/server/overview");
}

export function startVerification(nickname, user) {
  return apiFetch("/verification/start", {
    method: "POST",
    body: {
      nickname,
      account: discordAccount(user),
    },
  });
}

export function checkVerification(nickname, code, user) {
  return apiFetch("/verification/check", {
    method: "POST",
    body: {
      nickname,
      code,
      account: discordAccount(user),
    },
  });
}

export function getInventory(link) {
  return apiFetch(`/players/${encodeURIComponent(link.nickname)}/inventory`, {
    token: link.webToken,
  });
}

export function playerAction(link, action) {
  return apiFetch(`/players/${encodeURIComponent(link.nickname)}/actions/${encodeURIComponent(action)}`, {
    method: "POST",
    token: link.webToken,
    body: {
      nickname: link.nickname,
      webToken: link.webToken,
    },
  });
}

export function getPortfolio(link) {
  return apiFetch("/stocks/portfolio", {
    method: "POST",
    token: link.webToken,
    body: {
      nickname: link.nickname,
      webToken: link.webToken,
    },
  });
}

export function tradeStock(link, symbol, side, quantity) {
  return apiFetch("/stocks/trade", {
    method: "POST",
    token: link.webToken,
    body: {
      nickname: link.nickname,
      webToken: link.webToken,
      symbol,
      side,
      quantity,
    },
  });
}

export function broadcastToMinecraft(message) {
  return apiFetch("/admin/broadcast", {
    method: "POST",
    adminToken: config.adminToken,
    body: { message },
  });
}

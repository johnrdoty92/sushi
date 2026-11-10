const API_BASE_URL = import.meta.env.VITE_API_URL;

export type Position = {
  x: number;
  y: number;
};

export type SubscriberState = {
  id: string;
  name: string;
  position: Position;
};

export type ClaimItemPayload = {
  playerId: string;
  itemId: string;
};

export class ApiError extends Error {
  readonly status: number;
  readonly body: string;

  constructor(status: number, body: string) {
    super(body || `Request failed with status ${status}`);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

async function request(path: string, init?: RequestInit): Promise<Response> {
  const response = await fetch(`${API_BASE_URL}${path}`, init);

  if (!response.ok) {
    const body = (await response.text()).trim();
    throw new ApiError(response.status, body || response.statusText);
  }

  return response;
}

function jsonRequest(method: string, body: unknown): RequestInit {
  return {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };
}

function roomPath(slug: string, suffix = ""): string {
  return `/rooms/${encodeURIComponent(slug)}${suffix}`;
}

export async function createRoom(): Promise<string> {
  const response = await request("/rooms", { method: "POST" });
  return (await response.text()).trim();
}

export async function startRoom(slug: string): Promise<void> {
  await request(roomPath(slug, "/start"), { method: "POST" });
}

export async function resetRoom(slug: string): Promise<void> {
  await request(roomPath(slug, "/reset"), { method: "POST" });
}

export async function claimItem(slug: string, payload: ClaimItemPayload): Promise<void> {
  await request(roomPath(slug, "/items"), jsonRequest("PATCH", payload));
}

export async function updatePlayer(slug: string, player: SubscriberState): Promise<void> {
  await request(roomPath(slug, "/players"), jsonRequest("POST", player));
}

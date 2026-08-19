// Small fetch wrapper for the FreshKart API.
// On the web, requests are relative (Vite proxies /api to Django).
// In the Android app build, VITE_API_BASE points at the backend server.
export const API_HOST = import.meta.env.VITE_API_BASE || "";
const BASE = API_HOST + "/api";

function token() {
  return localStorage.getItem("fk_token");
}

async function request(path, { method = "GET", body, form } = {}) {
  const headers = {};
  if (token()) headers.Authorization = `Token ${token()}`;
  let payload;
  if (form) {
    payload = form; // FormData — browser sets content-type
  } else if (body !== undefined) {
    headers["Content-Type"] = "application/json";
    payload = JSON.stringify(body);
  }
  let res = await fetch(BASE + path, { method, headers, body: payload });
  let data = await res.json().catch(() => ({}));

  // Stale/revoked token: forget it, tell the app, and retry once anonymously
  // so public endpoints (config, catalog…) keep working.
  if (res.status === 401 && headers.Authorization &&
      (data.detail || "").toLowerCase().includes("invalid token")) {
    localStorage.removeItem("fk_token");
    localStorage.removeItem("fk_user");
    window.dispatchEvent(new Event("fk-session-expired"));
    delete headers.Authorization;
    res = await fetch(BASE + path, { method, headers, body: payload });
    data = await res.json().catch(() => ({}));
  }

  if (!res.ok) {
    const msg = data.error || data.detail || "Something went wrong.";
    const err = new Error(msg);
    err.status = res.status;
    throw err;
  }
  return data;
}

export const api = {
  get: (p) => request(p),
  post: (p, body) => request(p, { method: "POST", body }),
  postForm: (p, form) => request(p, { method: "POST", form }),
  del: (p) => request(p, { method: "DELETE" }),
};

// Resolve a vegetable image path to a URL.
// Bundled SVGs ship with the app; admin uploads live on the backend.
export function imgUrl(path) {
  if (!path) return "/img/veg/tomato.svg";
  if (path.startsWith("uploads/")) return `${API_HOST}/media/${path}`;
  return `/${path}`;
}

export const rupee = (n) => `₹${Math.round(Number(n) || 0)}`;

const AUTH_STORAGE_KEY = "prelegal_authed";

export function isAuthenticated(): boolean {
  return window.localStorage.getItem(AUTH_STORAGE_KEY) === "true";
}

export function setAuthenticated(): void {
  window.localStorage.setItem(AUTH_STORAGE_KEY, "true");
}

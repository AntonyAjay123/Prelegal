const AUTH_STORAGE_KEY = "prelegal_authed";

// sessionStorage (not localStorage): the mock login should only last for the
// current browser session, so every fresh run of the app starts at /login
// instead of an old "logged in" flag persisting indefinitely on the device.
export function isAuthenticated(): boolean {
  return window.sessionStorage.getItem(AUTH_STORAGE_KEY) === "true";
}

export function setAuthenticated(): void {
  window.sessionStorage.setItem(AUTH_STORAGE_KEY, "true");
}

export function clearAuthenticated(): void {
  window.sessionStorage.removeItem(AUTH_STORAGE_KEY);
}

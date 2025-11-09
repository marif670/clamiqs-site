/**
 * Calmiqs Admin Auth Utility
 * Handles admin authentication across Cloudflare Pages + Workers
 * Supports persistent login with localStorage/sessionStorage
 */

// Expiration period (in ms) — default: 24 hours
const AUTH_EXPIRATION = 24 * 60 * 60 * 1000;
const TIMESTAMP_KEY = "calmiqsAuthTimestamp";
const LOCAL_KEY = "isAdmin";
const SESSION_KEY = "calmiqsAuth";

/**
 * Check if admin access is still valid
 * Returns true if both auth keys exist and not expired
 */
export function checkAdminAccess() {
  const isLocal = localStorage.getItem(LOCAL_KEY) === "true";
  const isSession = sessionStorage.getItem(SESSION_KEY) === "true";
  const timestamp = localStorage.getItem(TIMESTAMP_KEY);

  if (!isLocal && !isSession) return false;
  if (!timestamp) return false;

  const now = Date.now();
  if (now - parseInt(timestamp, 10) > AUTH_EXPIRATION) {
    revokeAdminAccess();
    return false;
  }

  return true;
}

/**
 * Grant admin access and set expiration timestamp
 */
export function grantAdminAccess() {
  localStorage.setItem(LOCAL_KEY, "true");
  sessionStorage.setItem(SESSION_KEY, "true");
  localStorage.setItem(TIMESTAMP_KEY, Date.now().toString());
}

/**
 * Revoke access completely (manual logout or expiration)
 */
export function revokeAdminAccess() {
  localStorage.removeItem(LOCAL_KEY);
  sessionStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(TIMESTAMP_KEY);
}

/**
 * Auto-revoke expired sessions (runs immediately on load)
 */
(function autoRevokeExpired() {
  const timestamp = localStorage.getItem(TIMESTAMP_KEY);
  if (timestamp && Date.now() - parseInt(timestamp, 10) > AUTH_EXPIRATION) {
    revokeAdminAccess();
  }
})();

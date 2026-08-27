const PORTAL_ORIGIN = "https://vegibec-portail.com";

export function redirectToPortalLogin() {
  const returnTo = window.location.href;
  window.location.replace(`${PORTAL_ORIGIN}/login?returnTo=${encodeURIComponent(returnTo)}`);
}

export function redirectToPortalHome() {
  window.location.replace(`${PORTAL_ORIGIN}/`);
}

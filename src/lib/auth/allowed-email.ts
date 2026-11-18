// Decides whether an email may use the app. If ALLOWED_EMAIL_DOMAIN is set
// (e.g. "stanford.edu"), only addresses at that domain are allowed.
export function isAllowedEmail(email: string | undefined | null, allowedDomain?: string): boolean {
  if (!email) return false;
  const domain = allowedDomain?.trim().toLowerCase();
  if (!domain) return true;
  return email.trim().toLowerCase().endsWith(`@${domain}`);
}

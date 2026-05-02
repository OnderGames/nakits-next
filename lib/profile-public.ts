/** Tarayıcıda görünen üye numarası (6–9 hane, başında 0 yok) */
export const MEMBER_PUBLIC_CODE_RE = /^\d{6,9}$/;

export function isMemberPublicCode(value: string): boolean {
  return MEMBER_PUBLIC_CODE_RE.test(value.trim());
}

import type { AuthError } from "@supabase/supabase-js";

/** Supabase Auth İngilizce mesajlarını Türkçeye çevirir */
export function mapAuthErrorToTurkish(error: AuthError | Error): string {
  const raw = error.message?.trim() ?? "";
  const lower = raw.toLowerCase();

  if (
    lower.includes("email not confirmed") ||
    lower.includes("email_not_confirmed")
  ) {
    return "Lütfen e-posta adresinizi onaylayın.";
  }
  if (
    lower.includes("invalid login credentials") ||
    lower.includes("invalid_credentials") ||
    lower === "invalid login credentials"
  ) {
    return "E-posta veya şifre hatalı.";
  }
  if (
    lower.includes("user already registered") ||
    lower.includes("already registered")
  ) {
    return "Bu e-posta adresi ile zaten kayıt var. Giriş yapmayı deneyin.";
  }
  if (lower.includes("password") && lower.includes("least")) {
    return "Şifre çok kısa veya zayıf. En az 6 karakter kullanın.";
  }
  if (lower.includes("signup_disabled")) {
    return "Yeni kayıtlar geçici olarak kapalı.";
  }
  if (!raw) {
    return "Bir hata oluştu. Lütfen tekrar deneyin.";
  }
  return raw;
}

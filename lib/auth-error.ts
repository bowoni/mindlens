export function translateAuthError(message: string): string {
  const m = message.toLowerCase();

  if (m.includes("invalid") && m.includes("email")) return "유효하지 않은 이메일 주소입니다.";
  if (m.includes("already registered") || m.includes("already been registered")) return "이미 가입된 이메일입니다.";
  if (m.includes("password") && (m.includes("6") || m.includes("short") || m.includes("weak"))) return "비밀번호는 6자 이상이어야 합니다.";
  if (m.includes("rate limit") || m.includes("too many")) return "잠시 후 다시 시도해주세요.";
  if (m.includes("email not confirmed")) return "이메일 인증이 완료되지 않았습니다.";
  if (m.includes("invalid login") || m.includes("invalid credentials")) return "이메일 또는 비밀번호가 올바르지 않습니다.";
  if (m.includes("user not found")) return "등록되지 않은 이메일입니다.";
  if (m.includes("signup") && m.includes("disabled")) return "현재 회원가입이 비활성화되어 있습니다.";
  if (m.includes("network") || m.includes("fetch")) return "네트워크 오류가 발생했습니다. 다시 시도해주세요.";

  // 기본: 알 수 없는 오류
  return "오류가 발생했습니다. 다시 시도해주세요.";
}

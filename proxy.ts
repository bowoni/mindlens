import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // 세션 갱신 — 반드시 getUser()로 확인 (getSession()은 인가에 사용 금지)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 보호된 라우트: 로그인 필요
  const isProtected =
    request.nextUrl.pathname.startsWith("/dashboard") ||
    request.nextUrl.pathname.startsWith("/analyze") ||
    request.nextUrl.pathname.startsWith("/compare") ||
    request.nextUrl.pathname.startsWith("/search") ||
    request.nextUrl.pathname.startsWith("/pricing") ||
    request.nextUrl.pathname.startsWith("/payment") ||
    request.nextUrl.pathname.startsWith("/team");

  if (isProtected && !user) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("redirectTo", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 이미 로그인된 상태로 auth 페이지 접근 시 대시보드로
  const isAuthPage =
    request.nextUrl.pathname === "/login" ||
    request.nextUrl.pathname === "/signup";

  if (isAuthPage && user) {
    const dashboardUrl = request.nextUrl.clone();
    dashboardUrl.pathname = "/dashboard";
    return NextResponse.redirect(dashboardUrl);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

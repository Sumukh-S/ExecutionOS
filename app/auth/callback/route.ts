import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") ?? "/";

  // Determine the correct origin dynamically, respecting Vercel proxy headers if present
  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProto = request.headers.get("x-forwarded-proto") ?? "https";
  const origin = forwardedHost ? `${forwardedProto}://${forwardedHost}` : requestUrl.origin;

  if (code) {
    const cookieStore = {
      getAll() {
        return request.headers.get("cookie")
          ? request.headers
              .get("cookie")!
              .split(";")
              .map((cookie) => {
                const [name, ...rest] = cookie.trim().split("=");
                return { name, value: rest.join("=") };
              })
          : [];
      },
      setAll() {},
    };

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: cookieStore,
      }
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const response = NextResponse.redirect(`${origin}${next}`);
      return response;
    }
  }

  // Fallback redirect
  return NextResponse.redirect(`${origin}/`);
}

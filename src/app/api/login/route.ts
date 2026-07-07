import { NextRequest, NextResponse } from "next/server";
import { createSessionToken, verifyCredentials, SESSION_COOKIE } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const username = body?.username?.trim();
  const password = body?.password;

  if (!username || !password) {
    return NextResponse.json(
      { error: "الرجاء إدخال اسم المستخدم وكلمة المرور" },
      { status: 400 }
    );
  }

  const user = verifyCredentials(username, password);
  if (!user) {
    return NextResponse.json(
      { error: "اسم المستخدم أو كلمة المرور غير صحيحة" },
      { status: 401 }
    );
  }

  const token = createSessionToken(user);
  const response = NextResponse.json({ user });
  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
  return response;
}

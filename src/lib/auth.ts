import crypto from "crypto";

export const SESSION_COOKIE = "anb_session";

export type SessionUser = {
  username: string;
  displayName: string;
};

type User = SessionUser & { password: string };

function getUsers(): User[] {
  const users: User[] = [];
  for (let i = 1; i <= 3; i++) {
    const username = process.env[`USER${i}_USERNAME`];
    const password = process.env[`USER${i}_PASSWORD`];
    const displayName = process.env[`USER${i}_DISPLAY_NAME`] || username;
    if (username && password) {
      users.push({ username, password, displayName: displayName! });
    }
  }
  return users;
}

function getSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error("SESSION_SECRET environment variable is not set");
  }
  return secret;
}

export function verifyCredentials(
  username: string,
  password: string
): SessionUser | null {
  const user = getUsers().find(
    (u) => u.username === username && u.password === password
  );
  if (!user) return null;
  return { username: user.username, displayName: user.displayName };
}

function sign(value: string): string {
  return crypto.createHmac("sha256", getSecret()).update(value).digest("hex");
}

export function createSessionToken(user: SessionUser): string {
  const payload = Buffer.from(JSON.stringify(user)).toString("base64url");
  const signature = sign(payload);
  return `${payload}.${signature}`;
}

export function verifySessionToken(token: string | undefined): SessionUser | null {
  if (!token) return null;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;
  const expected = sign(payload);
  const sigBuf = Buffer.from(signature);
  const expectedBuf = Buffer.from(expected);
  if (
    sigBuf.length !== expectedBuf.length ||
    !crypto.timingSafeEqual(sigBuf, expectedBuf)
  ) {
    return null;
  }
  try {
    return JSON.parse(Buffer.from(payload, "base64url").toString("utf-8"));
  } catch {
    return null;
  }
}

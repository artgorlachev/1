import crypto from "node:crypto";

type TelegramUser = {
  id: number;
  username?: string;
  first_name?: string;
  last_name?: string;
};

export type TelegramAuthData = {
  user: TelegramUser;
};

export const verifyTelegramInitData = (initData: string, botToken: string) => {
  const params = new URLSearchParams(initData);
  const hash = params.get("hash");

  if (!hash) return { ok: false as const, reason: "Missing hash" };

  const dataPairs: string[] = [];
  params.forEach((value, key) => {
    if (key === "hash") return;
    dataPairs.push(`${key}=${value}`);
  });

  dataPairs.sort();
  const dataCheckString = dataPairs.join("\n");
  const secretKey = crypto
    .createHmac("sha256", "WebAppData")
    .update(botToken)
    .digest();
  const computedHash = crypto
    .createHmac("sha256", secretKey)
    .update(dataCheckString)
    .digest("hex");

  if (computedHash !== hash) {
    return { ok: false as const, reason: "Invalid hash" };
  }

  const userRaw = params.get("user");
  if (!userRaw) return { ok: false as const, reason: "Missing user" };

  const user = JSON.parse(userRaw) as TelegramUser;
  return { ok: true as const, user };
};

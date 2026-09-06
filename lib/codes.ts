import { db } from "@/lib/db";

const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export async function uniqueJoinCode() {
  for (let attempt = 0; attempt < 20; attempt++) {
    const code = Array.from({ length: 6 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join("");
    const existing = await db.event.findUnique({ where: { joinCode: code } });
    if (!existing) return code;
  }
  throw new Error("Unable to generate a unique join code");
}

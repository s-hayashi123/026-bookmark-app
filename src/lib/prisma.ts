import { PrismaClient } from "@prisma/client";
import { PrismaLibSQL } from "@prisma/adapter-libsql";
import { createClient } from "@libsql/client";

let prisma: PrismaClient;

if (process.env.NODE_ENV === "production") {
  // Turso に接続するのは本番だけ

  const libsql = createClient({
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN!,
  });

  const adapter = new PrismaLibSQL({
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN!,
  });
  prisma = new PrismaClient({ adapter });
} else {
  // ローカルは普通の SQLite
  prisma = new PrismaClient();
}

export default prisma;

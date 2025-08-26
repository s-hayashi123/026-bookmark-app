最新 Prisma では createClient を使わず、PrismaLibSQL に直接 URL と authToken を渡すだけで OK。

driverAdapters preview feature が必須（schema.prisma で追加）。

generator client {

provider = "prisma-client-js"

previewFeatures = ["driverAdapters"]

}

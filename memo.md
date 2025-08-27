最新 Prisma では createClient を使わず、PrismaLibSQL に直接 URL と authToken を渡すだけで OK。

driverAdapters preview feature が必須（schema.prisma で追加）。

generator client {

provider = "prisma-client-js"

previewFeatures = ["driverAdapters"]

}

zfd と z.infer の違いは実際のデータを扱うかどうか。
afd はフォームデータを使って、a.infer は型推論から型定義をするだけ

フォームを受け取らずに即アクションの場合は throw new Error でエラーを投げて、フロントエンド側で catch することで UI に表示する

# 【React & TypeScript & SQLite】Server Actionsで作る！ブックマーク管理アプリ開発チュートリアル (026)

![完成形デモ](https://user-images.githubusercontent.com/12583863/233253252-34a75129-158e-4808-8861-61a852a6a1b1.gif)

## 🚀 導入 (The "Why")

こんにちは！このチュートリアルでは、Next.jsの**Server Actions**と**Prisma**を駆使し、データベースに**SQLite**を使いながら、モダンなブックマーク管理アプリを**ゼロから構築し、本番環境に公開するまで**を完全に解説します。

単なるCRUDアプリを作るだけではありません。この開発体験を通して、あなたは以下の強力な武器を手に入れることができます。

- **最新の開発手法をマスター:** APIルートを手書きする従来の方法はもう不要です。Server Actionsがいかに開発をシンプルかつ高速にするかを体感し、フロントエンドとバックエンドの境界を意識しない新しい開発スタイルを学びます。
- **SQLiteでの本番運用を知る:** Vercelのようなサーバーレス環境で、ファイルベースのSQLiteがなぜ使えないのか、そしてその問題を解決する**Turso**という技術をどう使うのかを学び、軽量なデータベース運用の選択肢を増やします。
- **究極のユーザー体験の実現:** `useOptimistic`フックを使い、ユーザーの操作に即座に反応する「楽観的UI更新」を実装します。まるでオフラインアプリのように、サクサク動く感動的なUI/UXを実現しましょう。

このチュートリアルは、あなたの「作りたい」というアイデアを、迷うことなく形にするための**完全なレシピ**です。さあ、未来のWeb開発を体験しにいきましょう！

---

## 1. プロジェクト準備 (Project Setup)

**🎯 このセクションのゴール:**
Next.jsプロジェクトを新規作成し、開発に必要なライブラリのインストールと設定をすべて完了させます。

**The How: コマンドと設定ファイル**

1.  **Next.jsプロジェクトの作成**
    ```bash
    npx create-next-app@latest app --typescript --tailwind --eslint
    ```
    *(途中、対話形式で質問されますが、すべてデフォルト設定のままEnterキーを押してください)*

2.  **プロジェクトディレクトリへ移動**
    ```bash
    cd app
    ```

3.  **必要なライブラリのインストール**
    ```bash
    npm install next-auth@beta @prisma/adapter-libsql @libsql/client zod @hookform/resolvers zod-form-data
    npm install -D prisma @types/node
    ```

4.  **Prismaの初期化**
    ```bash
    npx prisma init
    ```

5.  **shadcn/uiのセットアップ**
    ```bash
    npx shadcn-ui@latest init
    ```
    *(こちらも質問にはすべてデフォルト設定で回答してください)*

6.  **shadcn/uiコンポーネントの追加**
    ```bash
    npx shadcn-ui@latest add button card input textarea label dialog
    ```

**The Why: なぜ、これが必要なのか？**
- `@libsql/client` と `@prisma/adapter-libsql`: これらが今回のキモです。`@libsql/client`は、TursoのようなlibSQLベースのデータベースと通信するためのクライアントです。`@prisma/adapter-libsql`は、Prismaがこのクライアントを使ってデータベースと会話できるようにするためのアダプター（通訳者）です。

---

## 2. データベース(SQLite)と認証のセットアップ

**🎯 このステップのゴール:**
ローカル開発用に**ファイルベースのSQLite**を設定し、PrismaとNextAuth.jsを構成して、アプリケーションがデータベースと通信し、ユーザー認証（今回はGitHub認証）を行えるようにします。

**The How: ファイルごとの完全なコード**

1.  **環境変数の設定**
    プロジェクトのルートにある `.env` ファイルを開き、以下の内容を記述します。データベースの場所と認証に必要な秘密の情報を設定します。

    ```env:.env
    # Local SQLite Database
    DATABASE_URL="file:./dev.db"

    # NextAuth.js
    # ターミナルで `openssl rand -hex 32` を実行して生成した文字列を設定
    AUTH_SECRET="YOUR_AUTH_SECRET"
    AUTH_GITHUB_ID="YOUR_GITHUB_CLIENT_ID"
    AUTH_GITHUB_SECRET="YOUR_GITHUB_CLIENT_SECRET"
    ```
    - `DATABASE_URL`: ローカル開発では、プロジェクト内に`dev.db`という名前のSQLiteデータベースファイルを作成して使用することを指定します。
    - `AUTH_...`: GitHubでOAuth Appを作成して取得したClient IDとClient Secretを設定します。（作成方法は[NextAuth.jsのドキュメント](https://next-auth.js.org/providers/github)を参照）

2.  **Prismaスキーマの定義**
    `prisma/schema.prisma` ファイルを以下のように更新します。`provider`を`sqlite`に変更するのがポイントです。

    ```prisma:prisma/schema.prisma
    generator client {
      provider = "prisma-client-js"
    }

    datasource db {
      provider = "sqlite" // ★ PostgreSQLからSQLiteに変更
      url      = env("DATABASE_URL")
    }

    model Account {
      id                String  @id @default(cuid())
      userId            String
      type              String
      provider          String
      providerAccountId String
      refresh_token     String?
      access_token      String?
      expires_at        Int?
      token_type        String?
      scope             String?
      id_token          String?
      session_state     String?

      user User @relation(fields: [userId], references: [id], onDelete: Cascade)

      @@unique([provider, providerAccountId])
    }

    model Session {
      id           String   @id @default(cuid())
      sessionToken String   @unique
      userId       String
      expires      DateTime
      user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
    }

    model User {
      id            String     @id @default(cuid())
      name          String?
      email         String?    @unique
      emailVerified DateTime?
      image         String?
      accounts      Account[]
      sessions      Session[]
      bookmarks     Bookmark[]
    }

    model VerificationToken {
      identifier String
      token      String   @unique
      expires    DateTime

      @@unique([identifier, token])
    }

    model Bookmark {
      id          String   @id @default(cuid())
      title       String
      description String?
      url         String
      createdAt   DateTime @default(now())
      updatedAt   DateTime @updatedAt
      userId      String
      user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)

      @@index([userId])
    }
    ```

3.  **データベースへスキーマを反映**
    ターミナルで以下のコマンドを実行します。Prismaが`schema.prisma`の内容を解釈し、ローカルに`dev.db`ファイルとテーブルを作成します。

    ```bash
    npx prisma migrate dev --name init
    ```

4.  **Prismaクライアントのインスタンス化**
    `lib`フォルダに`prisma.ts`というファイルを作成します。ここでは、ローカル環境と本番環境でPrismaClientの作り方を切り替えるようにします。

    ```ts:lib/prisma.ts
    import { PrismaClient } from '@prisma/client';
    import { PrismaLibSQL } from '@prisma/adapter-libsql';
    import { createClient } from '@libsql/client';

    // 本番環境でのみTursoに接続
    const libsql = createClient({
      url: process.env.TURSO_DATABASE_URL!,
      authToken: process.env.TURSO_AUTH_TOKEN!,
    });

    const adapter = new PrismaLibSQL(libsql);
    const prisma = new PrismaClient({ adapter });

    export default prisma;
    ```
    **補足:** ローカル開発時は`TURSO_...`環境変数がないため、Prismaは自動的に`schema.prisma`の`url = env("DATABASE_URL")`（つまり`file:./dev.db`）をフォールバックとして使用します。

5.  **NextAuth.jsの設定**
    プロジェクトのルートに`auth.ts`ファイルを作成します。ここでもPrismaのアダプターを`@auth/prisma-adapter`から`@prisma/adapter-libsql`を使ったものに適合させる必要がありますが、今回は`@auth/prisma-adapter`が内部で対応してくれるため、大きな変更はありません。

    ```ts:auth.ts
    import NextAuth from 'next-auth';
    import GitHub from 'next-auth/providers/github';
    import { PrismaAdapter } from '@auth/prisma-adapter';
    import prisma from './lib/prisma';

    export const { handlers, auth, signIn, signOut } = NextAuth({
      adapter: PrismaAdapter(prisma),
      providers: [GitHub],
    });
    ```

**The Why: なぜ、これが必要なのか？**
- **`provider = "sqlite"`:** Prismaに対して、これから話す相手がPostgreSQLではなくSQLiteであることを伝えます。これにより、生成されるSQLの方言がSQLite用に調整されます。
- **`DATABASE_URL="file:./dev.db"`:** ローカル開発では、外部のデータベースサーバーを起動する必要がなく、単一のファイルで完結するため、非常に手軽で高速に開発を始められます。
- **`lib/prisma.ts`の分岐:** このファイルが、ローカルと本番のスムーズな切り替えを実現する鍵です。本番環境（Vercel）ではTurso用の環境変数が設定されているためTursoに接続し、ローカル環境ではそれらの変数がないためファイルベースのSQLiteに接続する、という条件分岐をPrismaが内部的に処理してくれます。

---

## 3. バックエンドロジックの実装 (Server Actions)

**🎯 このステップのゴール:**
ブックマークの「作成」「更新」「削除」を行うためのバックエンドロジックを、Next.jsのServer Actionsとして実装します。これにより、APIルートを別途作成することなく、サーバーサイドの関数をクライアントから直接呼び出せるようになります。

**The How: ファイルごとの完全なコード**

1.  **アクション用ディレクトリの作成**
    `app`ディレクトリの直下に`actions`という名前のディレクトリを作成します。

2.  **ブックマークアクションファイルの作成**
    作成した`actions`ディレクトリ内に`bookmark.ts`というファイルを作成し、以下のコードを記述します。

    ```typescript:app/actions/bookmark.ts
    'use server';

    import { z } from 'zod';
    import { zfd } from 'zod-form-data';
    import { auth } from '@/auth';
    import prisma from '@/lib/prisma';
    import { revalidatePath } from 'next/cache';

    // Zodスキーマを定義
    const BookmarkSchema = z.object({
      id: z.string().optional(),
      title: z.string().min(1, 'タイトルは必須です'),
      url: z.string().url('有効なURLを入力してください'),
      description: z.string().optional(),
    });

    // FormData用のスキーマ
    const BookmarkFormSchema = zfd.formData(BookmarkSchema);

    export type State = {
      errors?: {
        title?: string[];
        url?: string[];
        description?: string[];
      };
      message?: string | null;
    };

    // --- Create Action ---
    export async function createBookmark(prevState: State, formData: FormData) {
      const session = await auth();
      if (!session?.user?.id) {
        return { message: '認証されていません' };
      }

      const validatedFields = BookmarkFormSchema.safeParse(formData);

      if (!validatedFields.success) {
        return {
          errors: validatedFields.error.flatten().fieldErrors,
          message: '入力内容に誤りがあります。',
        };
      }

      const { title, url, description } = validatedFields.data;

      try {
        await prisma.bookmark.create({
          data: {
            title,
            url,
            description,
            userId: session.user.id,
          },
        });
      } catch (error) {
        return { message: 'データベースエラー: ブックマークの作成に失敗しました。' };
      }

      revalidatePath('/');
      return { message: 'ブックマークを作成しました。' };
    }

    // --- Update Action ---
    export async function updateBookmark(prevState: State, formData: FormData) {
      const session = await auth();
      if (!session?.user?.id) {
        return { message: '認証されていません' };
      }

      const validatedFields = BookmarkFormSchema.safeParse(formData);

      if (!validatedFields.success) {
        return {
          errors: validatedFields.error.flatten().fieldErrors,
          message: '入力内容に誤りがあります。',
        };
      }

      const { id, title, url, description } = validatedFields.data;

      if (!id) {
        return { message: 'ブックマークIDがありません。' };
      }

      try {
        // ユーザーが所有するブックマークか確認
        const bookmark = await prisma.bookmark.findUnique({
          where: { id },
        });
        if (!bookmark || bookmark.userId !== session.user.id) {
          return { message: '権限がありません。' };
        }

        await prisma.bookmark.update({
          where: { id },
          data: {
            title,
            url,
            description,
          },
        });
      } catch (error) {
        return { message: 'データベースエラー: ブックマークの更新に失敗しました。' };
      }

      revalidatePath('/');
      return { message: 'ブックマークを更新しました。' };
    }

    // --- Delete Action ---
    export async function deleteBookmark(id: string) {
      const session = await auth();
      if (!session?.user?.id) {
        throw new Error('認証されていません');
      }

      if (!id) {
        throw new Error('ブックマークIDがありません。');
      }

      try {
        // ユーザーが所有するブックマークか確認
        const bookmark = await prisma.bookmark.findUnique({
          where: { id },
        });
        if (!bookmark || bookmark.userId !== session.user.id) {
          throw new Error('権限がありません。');
        }

        await prisma.bookmark.delete({
          where: { id },
        });
        revalidatePath('/');
        return { message: 'ブックマークを削除しました。' };
      } catch (error) {
        throw new Error('データベースエラー: ブックマークの削除に失敗しました。');
      }
    }
    ```

**The Why: なぜ、これが必要なのか？**
- **`'use server';`**: この一行が魔法の呪文です。ファイルの先頭に記述することで、このファイル内のすべての関数が**Server Actions**として扱われます。これにより、クライアント側のコンポーネントから安全にこれらの関数を呼び出すことができます。
- **`zod` と `zod-form-data`**: フォームから送られてくるデータは信頼できません。`zod`を使って、データが期待通りの形式（`title`は必須、`url`は有効なURL形式など）であるかをサーバーサイドで厳密に検証します。`zod-form-data`は、`FormData`オブジェクトを`zod`で簡単に扱えるようにするヘルパーです。
- **`auth()`**: 各アクションの冒頭で`auth()`を呼び出し、セッション情報を取得します。ログインしているユーザーでなければ処理を中断することで、不正なアクセスを防ぎます。
- **`revalidatePath('/')`**: データベースのデータが変更された後、この関数を呼び出すことで、Next.jsに関連するページのキャッシュを破棄し、UIを最新の状態に更新させます。今回はルートページ(`/`)に一覧を表示するため、これを指定しています。
- **`State`型と`prevState`**: `createBookmark`と`updateBookmark`では、`useFormState`フックと連携するために、第一引数に`prevState`、返り値に`State`型を定義しています。これにより、フォームの送信結果（成功メッセージやバリデーションエラー）をクライアントに返すことができます。
- **`deleteBookmark`の例外処理**: 削除アクションはフォーム全体を送信するわけではないため、`useFormState`とは少し違うアプローチを取ります。ここでは、エラーが発生した場合に`throw new Error(...)`で例外を投げるように実装しています。これは後ほどクライアント側で`try...catch`を使ってハンドリングします。

---

## 4. UIコンポーネントの実装

**🎯 このステップのゴール:**
ブックマークを表示するためのカードコンポーネントと、ブックマークの作成・編集を行うためのダイアログ（モーダル）コンポーネントを作成します。`shadcn/ui`をベースに、再利用可能なコンポーネントを構築します。

**The How: ファイルごとの完全なコード**

1.  **ブックマークカードコンポーネント**
    `components`ディレクトリに`BookmarkCard.tsx`を作成します。このコンポーネントは、ブックマークの情報を表示し、「編集」と「削除」のボタンを持ちます。

    ```typescript:components/BookmarkCard.tsx
    'use client';

    import { Bookmark } from '@prisma/client';
    import {
      Card,
      CardContent,
      CardDescription,
      CardFooter,
      CardHeader,
      CardTitle,
    } from '@/components/ui/card';
    import { Button } from '@/components/ui/button';
    import { useTransition } from 'react';
    import { deleteBookmark } from '@/app/actions/bookmark';
    import { BookmarkDialog } from './BookmarkDialog';

    type BookmarkCardProps = {
      bookmark: Bookmark;
      removeOptimisticBookmark: (id: string) => void;
    };

    export function BookmarkCard({ bookmark, removeOptimisticBookmark }: BookmarkCardProps) {
      const [isPending, startTransition] = useTransition();

      const handleDelete = () => {
        startTransition(async () => {
          removeOptimisticBookmark(bookmark.id);
          await deleteBookmark(bookmark.id);
        });
      };

      return (
        <Card>
          <CardHeader>
            <CardTitle>{bookmark.title}</CardTitle>
            <CardDescription className="truncate">
              <a href={bookmark.url} target="_blank" rel="noopener noreferrer">
                {bookmark.url}
              </a>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground line-clamp-3">
              {bookmark.description || '説明はありません'}
            </p>
          </CardContent>
          <CardFooter className="flex justify-end gap-2">
            <BookmarkDialog mode="edit" bookmark={bookmark} />
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              disabled={isPending}
            >
              {isPending ? '削除中...' : '削除'}
            </Button>
          </CardFooter>
        </Card>
      );
    }
    ```

2.  **ブックマークダイアログコンポーネント**
    `components`ディレクトリに`BookmarkDialog.tsx`を作成します。このコンポーネントは、ブックマークの「新規作成」と「編集」の両方で使われるフォームを持つダイアログです。

    ```typescript:components/BookmarkDialog.tsx
    'use client';

    import {
      Dialog,
      DialogContent,
      DialogDescription,
      DialogHeader,
      DialogTitle,
      DialogTrigger,
      DialogFooter,
      DialogClose,
    } from '@/components/ui/dialog';
    import { Button } from './ui/button';
    import { Label } from './ui/label';
    import { Input } from './ui/input';
    import { Textarea } from './ui/textarea';
    import { useFormState, useFormStatus } from 'react-dom';
    import { createBookmark, updateBookmark } from '@/app/actions/bookmark';
    import { useEffect, useState } from 'react';
    import { Bookmark } from '@prisma/client';

    type BookmarkDialogProps = {
      mode: 'create' | 'edit';
      bookmark?: Bookmark;
    };

    const initialState = {
      message: null,
      errors: {},
    };

    function SubmitButton({ mode }: { mode: 'create' | 'edit' }) {
      const { pending } = useFormStatus();
      return (
        <Button type="submit" disabled={pending}>
          {pending ? (mode === 'create' ? '作成中...' : '更新中...') : (mode === 'create' ? '作成' : '更新')}
        </Button>
      );
    }

    export function BookmarkDialog({ mode, bookmark }: BookmarkDialogProps) {
      const [open, setOpen] = useState(false);
      const action = mode === 'create' ? createBookmark : updateBookmark;
      const [state, dispatch] = useFormState(action, initialState);

      useEffect(() => {
        if (state.message && !state.errors) {
          setOpen(false);
        }
      }, [state]);

      return (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size={mode === 'edit' ? 'sm' : 'default'}>
              {mode === 'create' ? '新規作成' : '編集'}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {mode === 'create' ? '新しいブックマークを作成' : 'ブックマークを編集'}
              </DialogTitle>
              <DialogDescription>
                {mode === 'create' ? 'ブックマークの情報を入力してください。' : 'ブックマークの情報を更新してください。'}
              </DialogDescription>
            </DialogHeader>

            <form action={dispatch} className="space-y-4">
              {mode === 'edit' && <input type="hidden" name="id" value={bookmark?.id} />}
              <div>
                <Label htmlFor="title">タイトル</Label>
                <Input id="title" name="title" defaultValue={bookmark?.title} />
                {state.errors?.title && <p className="text-red-500 text-sm">{state.errors.title[0]}</p>}
              </div>
              <div>
                <Label htmlFor="url">URL</Label>
                <Input id="url" name="url" defaultValue={bookmark?.url} />
                {state.errors?.url && <p className="text-red-500 text-sm">{state.errors.url[0]}</p>}
              </div>
              <div>
                <Label htmlFor="description">説明</Label>
                <Textarea id="description" name="description" defaultValue={bookmark?.description || ''} />
                {state.errors?.description && <p className="text-red-500 text-sm">{state.errors.description[0]}</p>}
              </div>

              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">キャンセル</Button>
                </DialogClose>
                <SubmitButton mode={mode} />
              </DialogFooter>
              {state.message && state.errors && <p className="text-red-500 text-sm mt-2">{state.message}</p>}
            </form>
          </DialogContent>
        </Dialog>
      );
    }
    ```

**The Why: なぜ、これが必要なのか？**
- **`BookmarkCard.tsx`**:
    - **`'use client';`**: ユーザーの操作（ボタンクリックなど）を扱うため、クライアントコンポーネントとして定義します。
    - **`useTransition`**: 削除処理のようなサーバーへのリクエスト中にUIが固まるのを防ぎます。`startTransition`で囲んだ処理は、UIをブロックしない「トランジション（遷移）」として扱われ、その間のローディング状態を`isPending`で取得できます。これにより、「削除中...」のようなフィードバックをユーザーに表示できます。
    - **`removeOptimisticBookmark`**: これは後ほど親コンポーネントで実装する「楽観的更新」のための関数です。削除ボタンが押された瞬間に、サーバーの応答を待たずにUIからブックマークを消すために使います。
- **`BookmarkDialog.tsx`**:
    - **再利用可能な設計**: `mode`という`props`を受け取ることで、このコンポーネントを「新規作成」と「編集」の両方のシナリオで使い回せるようにしています。
    - **`useFormState`**: React公式のフックで、フォームの状態管理とServer Actionの実行を簡単に行えます。`dispatch`関数にフォームデータを渡してアクションを実行し、返り値である`state`にはアクションの結果（エラーメッセージや成功メッセージ）が格納されます。
    - **`useFormStatus`**: `form`タグの内側でのみ使えるフックで、フォームの送信状態（`pending`）を取得できます。これにより、送信ボタンを「作成中...」のように変更し、ユーザーに処理中であることを明確に伝えられます。
    - **`useEffect`による自動クローズ**: フォームの送信が成功したら（`state.message`があり、`state.errors`がない場合）、ダイアログを自動で閉じるように`useEffect`で制御しています。これにより、ユーザー体験が向上します。

---

## 5. メインページの作成と機能の統合

**🎯 このステップのゴール:**
これまでに作成したバックエンドロジックとUIコンポーネントをすべて統合し、アプリケーションのメインページを完成させます。サーバーコンポーネントでデータを取得し、クライアントコンポーネントでインタラクティブな機能を実現します。そして、このチュートリアルのハイライトである**楽観的更新（Optimistic UI）**を実装します。

**The How: ファイルごとの完全なコード**

1.  **既存ページのクリーンアップ**
    `app/page.tsx`の既存のコードをすべて削除し、以下のコードに置き換えます。

2.  **メインページの実装**
    `app/page.tsx`を以下のように更新します。

    ```typescript:app/page.tsx
    import { auth } from '@/auth';
    import prisma from '@/lib/prisma';
    import { BookmarkList } from '@/components/BookmarkList';
    import { BookmarkDialog } from '@/components/BookmarkDialog';
    import { Button } from '@/components/ui/button';
    import { signIn, signOut } from '@/auth';

    function SignInButton() {
      return (
        <form
          action={async () => {
            'use server';
            await signIn('github');
          }}
        >
          <Button type="submit">GitHubでサインイン</Button>
        </form>
      );
    }

    function SignOutButton() {
      return (
        <form
          action={async () => {
            'use server';
            await signOut();
          }}
        >
          <Button type="submit" variant="outline">サインアウト</Button>
        </form>
      );
    }

    export default async function Home() {
      const session = await auth();

      if (!session) {
        return (
          <div className="min-h-screen flex flex-col items-center justify-center">
            <h1 className="text-3xl font-bold mb-4">ようこそ！</h1>
            <p className="text-muted-foreground mb-8">サインインしてブックマークの管理を始めましょう。</p>
            <SignInButton />
          </div>
        );
      }

      const bookmarks = await prisma.bookmark.findMany({
        where: {
          userId: session.user.id,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return (
        <main className="container mx-auto py-10">
          <header className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold">マイブックマーク</h1>
              <p className="text-muted-foreground">
                {session.user.name}さん、こんにちは！
              </p>
            </div>
            <div className="flex items-center gap-4">
              <BookmarkDialog mode="create" />
              <SignOutButton />
            </div>
          </header>

          <BookmarkList initialBookmarks={bookmarks} />
        </main>
      );
    }
    ```

3.  **ブックマークリストコンポーネント（楽観的更新の実装）**
    `components`ディレクトリに`BookmarkList.tsx`を作成します。ここで`useOptimistic`フックを使います。

    ```typescript:components/BookmarkList.tsx
    'use client';

    import { Bookmark } from '@prisma/client';
    import { useOptimistic } from 'react';
    import { BookmarkCard } from './BookmarkCard';

    type BookmarkListProps = {
      initialBookmarks: Bookmark[];
    };

    export function BookmarkList({ initialBookmarks }: BookmarkListProps) {
      const [optimisticBookmarks, removeOptimisticBookmark] = useOptimistic(
        initialBookmarks,
        (state, bookmarkIdToRemove: string) =>
          state.filter((b) => b.id !== bookmarkIdToRemove)
      );

      if (optimisticBookmarks.length === 0) {
        return (
          <div className="text-center py-20 bg-gray-50 rounded-lg">
            <h2 className="text-xl font-semibold">ブックマークがありません</h2>
            <p className="text-muted-foreground mt-2">
              「新規作成」ボタンから最初のブックマークを追加してみましょう！
            </p>
          </div>
        );
      }

      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {optimisticBookmarks.map((bookmark) => (
            <BookmarkCard
              key={bookmark.id}
              bookmark={bookmark}
              removeOptimisticBookmark={removeOptimisticBookmark}
            />
          ))}
        </div>
      );
    }
    ```

**The Why: なぜ、これが必要なのか？**
- **`app/page.tsx` (サーバーコンポーネント)**:
    - **データ取得**: このコンポーネントはサーバーサイドで実行されるため、`async`にして直接`prisma`を呼び出し、データベースからブックマーク一覧を取得できます。これがApp Routerの強力な機能の一つです。
    - **認証**: `auth()`でセッションを確認し、ログインしていなければサインインボタンを表示し、ログイン済みであればブックマーク一覧を表示する、というロジックをサーバーサイドで完結できます。
    - **責務の分離**: サーバーコンポーネントはデータの取得と表示の骨格を担当し、ユーザー操作などのインタラクティブな部分はクライアントコンポーネント（`BookmarkList`, `BookmarkDialog`）に委任しています。
- **`BookmarkList.tsx` (クライアントコンポーネント)**:
    - **`useOptimistic`**: これが楽観的更新の心臓部です。
        1.  `useOptimistic`は2つの値を返します。1つ目は現在のUIに表示すべき状態（`optimisticBookmarks`）、2つ目はUIを楽観的に更新するための関数（`removeOptimisticBookmark`）です。
        2.  初期状態として、サーバーから受け取った`initialBookmarks`を渡します。
        3.  第2引数には「更新関数」を渡します。この関数は、`removeOptimisticBookmark`が呼ばれたときに、現在の状態（`state`）と渡された引数（`bookmarkIdToRemove`）を使って、**どのようにUIを先行更新するか**を定義します。ここでは、「指定されたIDのブックマークをリストから除外する」というロジックを記述しています。
        4.  ユーザーが削除ボタンを押すと、`BookmarkCard`内で`removeOptimisticBookmark(id)`が呼ばれます。その瞬間、Reactはサーバーのアクションが終わるのを**待たずに**、UIを「ブックマークが削除された状態」に更新します。
        5.  その後、バックグラウンドで実行されている`deleteBookmark`アクションが成功すれば、`revalidatePath`によってサーバーから最新のデータが送られてきて、UIの状態が確定します。もしアクションが失敗した場合、Reactは自動的にこの楽観的な更新を破棄し、UIを元の状態に戻します。

---

## 6. 動作確認

**🎯 このステップのゴール:**
アプリケーションをローカルで起動し、ここまでに実装したすべての機能（認証、作成、一覧表示、編集、削除）が正しく動作することを確認します。

**The How: 手順**

1.  **開発サーバーの起動**
    ターミナルで、プロジェクトのルートディレクトリ（`app`ディレクトリ）にいることを確認し、以下のコマンドを実行します。
    ```bash
    npm run dev
    ```

2.  **サインイン**
    - ブラウザで `http://localhost:3000` を開きます。
    - 「GitHubでサインイン」ボタンが表示されるので、クリックしてGitHub認証を行います。
    - 認証後、アプリケーションのメインページにリダイレクトされます。

3.  **ブックマークの作成**
    - 「新規作成」ボタンをクリックします。
    - ダイアログが表示されるので、タイトルとURLを入力し、「作成」ボタンをクリックします。
    - ダイアログが閉じ、新しいブックマークが一覧に表示されることを確認します。

4.  **ブックマークの編集**
    - 作成したブックマークカードの「編集」ボタンをクリックします。
    - ダイアログが表示され、既存のデータがフォームにセットされていることを確認します。
    - タイトルや説明を更新し、「更新」ボタンをクリックします。
    - ダイアログが閉じ、一覧の表示が更新されていることを確認します。

5.  **ブックマークの削除（楽観的更新の確認）**
    - 削除したいブックマークカードの「削除」ボタンをクリックします。
    - クリックした**瞬間に**、カードがUIから消えることを確認してください。これが楽観的更新です。（ネットワークの速度を遅くすると、より体感しやすくなります）
    - ページをリロードしても、そのブックマークが削除されたままであることを確認します。

6.  **サインアウト**
    - ヘッダーの「サインアウト」ボタンをクリックします。
    - サインインページにリダイレクトされることを確認します。

これらの手順がすべて問題なく完了すれば、アプリケーションの基本機能は完成です！

## 8. 【本番】Vercelへのデプロイ (SQLite編)

**🎯 このセクションのゴール:**
開発したアプリケーションをVercelにデプロイし、**Turso**を使って本番環境でもSQLiteデータベースを永続化させ、世界に公開します。

### 【超重要】なぜローカルのSQLiteはVercelで動かないのか？

Vercelのようなサーバーレスプラットフォームのファイルシステムは**一時的（ephemeral）**です。つまり、デプロイ時や、しばらくアクセスがなかった後などに、サーバー（コンテナ）が再起動すると、**ローカルに保存されていたファイルはすべて消えてしまいます。**

もし`dev.db`ファイルをそのままデプロイした場合、ユーザーがブックマークを追加しても、次のデプロイや再起動でそのデータは**跡形もなく消え去ってしまう**のです。これを解決するのが、SQLiteをクラウドサービスとして提供する**Turso**です。

### The How: TursoとVercelの設定手順

1.  **Turso CLIのインストールとログイン**
    - [Tursoの公式サイト](https://turso.tech/)でアカウントを作成します。
    - ターミナルでTursoのコマンドラインツール（CLI）をインストールします。
      ```bash
      # macOS / Linux (Homebrew)
      brew install tursodatabase/tap/turso
      ```
    - Tursoにログインします。
      ```bash
      turso auth login
      ```

2.  **Tursoデータベースの作成と情報取得**
    - 新しいデータベースを作成します。
      ```bash
      turso db create my-bookmark-app-db
      ```
    - 作成したデータベースのURLを取得します。これは後で使います。
      ```bash
      turso db show my-bookmark-app-db --url
      ```
    - データベースにアクセスするための認証トークンを作成します。これも後で使います。
      ```bash
      turso db tokens create my-bookmark-app-db
      ```

3.  **GitHubへのプッシュとVercelプロジェクトの作成**
    - コードをGitHubリポジトリにプッシュします。
    - Vercelにログインし、そのリポジトリをインポートして新しいプロジェクトを作成します。

4.  **Vercelの環境変数を設定**
    - Vercelのプロジェクト設定画面の `Settings > Environment Variables` に移動します。
    - 以下の環境変数を**すべて**設定します。
      - `TURSO_DATABASE_URL`: 手順2で取得したデータベースのURL。
      - `TURSO_AUTH_TOKEN`: 手順2で取得した認証トークン。
      - `AUTH_SECRET`: ローカルの`.env`と同じ値。
      - `AUTH_GITHUB_ID`, `AUTH_GITHUB_SECRET`: GitHub OAuth AppのIDとSecret。
      - `NEXTAUTH_URL`: **重要！** Vercelによって割り当てられた本番URL（例: `https://your-app-name.vercel.app`）。

5.  **GitHub OAuth AppのコールバックURLを更新**
    - GitHubのOAuth App設定ページに戻り、`Authorization callback URL`に本番用のURLを追加します。
    - `https://your-app-name.vercel.app/api/auth/callback/github`

6.  **本番データベースへのマイグレーション設定**
    - 本番のTursoデータベースはまだ空っぽです。デプロイ時に自動でテーブルが作成されるように設定します。
    - `package.json`の`scripts`に以下を追加します。
      ```json:package.json
      "scripts": {
        // ...,
        "prisma:deploy": "prisma migrate deploy"
      },
      ```
    - Vercelプロジェクトの `Settings > General > Build & Development Settings` に移動し、`Build Command` を以下のように**上書き**します。
      ```
      npm run prisma:deploy && npm run build
      ```

7.  **再デプロイ**
    - Vercelの`Deployments`タブに移動し、最新のデプロイを`Redeploy`します。
    - これでビルドプロセス中に`prisma migrate deploy`が実行され、Turso上のデータベースにスキーマが反映されます。

デプロイが完了すれば、あなたのSQLite製ブックマークアプリが世界に公開されます！

---

## 🎉 結論

お疲れ様でした！このチュートリアルを通して、あなたはローカルではファイルベースのSQLite、本番ではTursoという構成で、モダンなフルスタックWebアプリケーションを構築・公開するスキルを身につけました。

この経験は、PostgreSQLのような大規模データベースだけでなく、より軽量で手軽なSQLiteもプロジェクトの選択肢として検討できる、懐の深い開発者になるための一歩です。

Happy Coding! 🚀
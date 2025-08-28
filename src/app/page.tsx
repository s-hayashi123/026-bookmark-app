import prisma from "@/lib/prisma";
import { auth, signIn, signOut } from "../../auth";
import { BookmarkList } from "@/components/BookmarkList";
import { BookmarkDialog } from "@/components/BookmarkDialog";
import { Button } from "@/components/ui/button";

async function handleSignIn() {
  "use server";
  await signIn("github");
}

function SignInButton() {
  return (
    <form action={handleSignIn}>
      <Button type="submit">GitHubでサインイン</Button>
    </form>
  );
}

async function handleSignOut() {
  "use server";
  await signOut();
}

function SignOutButton() {
  return (
    <form action={handleSignOut}>
      <Button type="submit" variant="outline">
        サインアウト
      </Button>
    </form>
  );
}

export default async function Home() {
  const session = await auth();
  if (!session) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <h1 className="text-3xl font-bold mb-4">ようこそ！</h1>
        <p className="text-muted-foreground mb-8">
          サインインしてブックマークの管理を始めましょう。
        </p>
        <SignInButton />
      </div>
    );
  }

  const bookmarks = await prisma.bookmark.findMany({
    where: {
      userId: session.user?.id,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
  return (
    <main className="container mx-auto py-10">
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">マイブックマーク</h1>
          <p className="text-muted-foreground">
            {session.user?.name}さん、こんにちは！
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

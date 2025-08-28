"use client";

import { Bookmark } from "@prisma/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTransition } from "react";
import { deleteBookmark } from "@/app/actions/bookmark";
import { BookmarkDialog } from "./BookmarkDialog";

type BookmarkCardProps = {
  bookmark: Bookmark;
  removeOptimisticBookmark: (id: string) => void;
};

export function BookmarkCard({
  bookmark,
  removeOptimisticBookmark,
}: BookmarkCardProps) {
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
          <a
            href={bookmark.url}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline"
          >
            {bookmark.url}
          </a>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground line-clamp-3">
          {bookmark.description || "説明はありません"}
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
          {isPending ? "削除中..." : "削除"}
        </Button>
      </CardFooter>
    </Card>
  );
}

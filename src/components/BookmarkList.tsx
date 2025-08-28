"use client";

import { Bookmark } from "@prisma/client";
import { useOptimistic } from "react";
import { BookmarkCard } from "./BookmarkCard";

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

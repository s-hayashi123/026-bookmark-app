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
      <div>
        <h2>ブックマークがありません</h2>
        <p>「新規作成」ボタンから最初のブックマークを追加してみましょう！</p>
      </div>
    );
  }

  return (
    <div>
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

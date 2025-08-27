"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { useFormState, useFormStatus } from "react-dom";
import { createBookmark, updateBookmark } from "@/app/actions/bookmark";
import { useEffect, useState } from "react";
import { Bookmark } from "@prisma/client";

type BookmarkDialogProps = {
  mode: "create" | "edit";
  bookmark: Bookmark;
};

const initialState = {
  message: "",
  errors: {},
};

function SubmitButton({ mode }: { mode: "create" | "edit" }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending
        ? mode === "create"
          ? "作成中..."
          : "更新中"
        : mode === "create"
        ? "作成"
        : "更新"}
    </Button>
  );
}

export function BookmarkDialog({ mode, bookmark }: BookmarkDialogProps) {
  const [open, setOpen] = useState(false);
  const action = mode === "create" ? createBookmark : updateBookmark;
  const [state, dispatch] = useFormState(action, initialState);

  useEffect(() => {
    if (state.message && !state.errors) {
      setOpen(false);
    }
  }, [state]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size={mode === "edit" ? "sm" : "default"}>
          {mode === "create" ? "新規作成" : "編集"}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {mode === "create"
              ? "新しいブックマークを作成"
              : "ブックマークを編集"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "ブックマークの情報を入力してください。"
              : "ブックマークの情報を更新してください。"}
          </DialogDescription>
        </DialogHeader>

        <form action={dispatch} className="space-y-4">
          {mode === "edit" && (
            <input type="hidden" name="id" value={bookmark?.id} />
          )}
          <div>
            <Label htmlFor="title">タイトル</Label>
            <Input id="title" name="title" defaultValue={bookmark?.title} />
            {state.errors?.title && (
              <p className="text-red-500 text-sm">{state.errors.title[0]}</p>
            )}
          </div>
          <div>
            <Label htmlFor="url">URL</Label>
            <Input id="url" name="url" defaultValue={bookmark?.url} />
            {state.errors?.url && (
              <p className="text-red-500 text-sm">{state.errors.url[0]}</p>
            )}
          </div>
          <div>
            <Label htmlFor="description">説明</Label>
            <Textarea
              id="description"
              name="description"
              defaultValue={bookmark?.description || ""}
            />
            {state.errors?.description && (
              <p className="text-red-500 text-sm">
                {state.errors.description[0]}
              </p>
            )}
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">キャンセル</Button>
            </DialogClose>
            <SubmitButton mode={mode} />
          </DialogFooter>
          {state.message && state.errors && (
            <p className="text-red-500 text-sm mt-2">{state.message}</p>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}

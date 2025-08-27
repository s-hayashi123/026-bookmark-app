"use server";

import { z } from "zod";
import { zfd } from "zod-form-data";
import { auth } from "../../../auth";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

const BookmarkSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, "タイトルは必須です"),
  url: z.string().url("有効なURLを入力してください"),
  description: z.string().optional(),
});

const BookmarkFormSchema = zfd.formData(BookmarkSchema);

export type State = {
  errors?: {
    title?: string[];
    url?: string[];
    description?: string[];
  };
  message?: string | null;
};

export async function createBookmark(prevState: State, formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    return { message: "認証されていません" };
  }

  const validatedFields = BookmarkFormSchema.safeParse(formData);

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "入力内容に誤りがあります。",
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
    return {
      message: "データベースエラー: ブックマークの作成に失敗しました。",
    };
  }

  revalidatePath("/");
  return { message: "ブックマークを作成しました。" };
}

export async function updateBookmark(prevState: State, formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    return { message: "認証されていません" };
  }

  const validatedFields = BookmarkFormSchema.safeParse(formData);
  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "入力内容に誤りがあります。",
    };
  }

  const { id, title, url, description } = validatedFields.data;

  if (!id) {
    return { message: "ブックマークIDがありません。" };
  }

  try {
    const bookmark = await prisma.bookmark.findUnique({
      where: { id },
    });

    if (!bookmark || bookmark.userId !== session.user.id) {
      return { message: "権限がありません。" };
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
    return {
      message: "データベースエラー: ブックマークの更新に失敗しました。",
    };
  }
  revalidatePath("/");
  return { message: "ブックマークを更新しました。" };
}

export async function deleteBookmark(id: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("認証されていません");
  }

  if (!id) {
    throw new Error("ブックマークIDがありません。");
  }

  try {
    const bookmark = await prisma.bookmark.findUnique({
      where: { id },
    });

    if (!bookmark || bookmark.userId !== session.user.id) {
      throw new Error("権限がありません");
    }

    await prisma.bookmark.delete({
      where: { id },
    });
    revalidatePath("/");
    return { message: "ブックマークを削除しました。" };
  } catch (error) {
    throw new Error("データベースエラー: ブックマークの削除に失敗しました。");
  }
}

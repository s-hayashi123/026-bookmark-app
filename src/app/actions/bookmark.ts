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

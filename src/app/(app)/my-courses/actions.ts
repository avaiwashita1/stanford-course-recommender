"use server";

import { revalidatePath } from "next/cache";
import { replaceMyCourses } from "@/lib/transcript/repository";
import { toSavableRows } from "@/lib/transcript/validate";

export async function saveMyCourses(courses: unknown): Promise<{ ok: boolean; message: string }> {
  try {
    const rows = toSavableRows(courses);
    await replaceMyCourses(rows);
    revalidatePath("/my-courses");
    return { ok: true, message: `Saved ${rows.length} courses.` };
  } catch (err) {
    console.error("saveMyCourses failed", err);
    return { ok: false, message: "Couldn't save your courses. Please try again." };
  }
}

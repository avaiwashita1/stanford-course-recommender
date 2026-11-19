"use server";

import { revalidatePath } from "next/cache";
import { normalizeCourseCode } from "@/lib/catalog/code";
import { getCoursesByIds } from "@/lib/catalog/repository";
import { deletePlanned, getMyPlan, upsertPlanned } from "@/lib/plan/repository";
import { checkAddToPlan } from "@/lib/plan/validate";

export type PlanActionResult = { ok: boolean; message: string };

export async function addToPlan(courseId: string, term: string, classId: number | null): Promise<PlanActionResult> {
  try {
    const id = normalizeCourseCode(String(courseId));
    if (!id) return { ok: false, message: "Invalid course." };
    const [courses, planned] = await Promise.all([getCoursesByIds([id]), getMyPlan()]);
    const course = courses.get(id);
    const check = checkAddToPlan(course, String(term), classId === null ? null : Number(classId), planned);
    if (!check.ok) return check;
    await upsertPlanned({ course_id: id, term: term as never, class_id: classId, title: course!.title });
    revalidatePath("/", "layout");
    return { ok: true, message: `Added ${id} to ${term}.` };
  } catch (err) {
    console.error("addToPlan failed", err);
    return { ok: false, message: "Couldn't update your plan. Please try again." };
  }
}

export async function removeFromPlan(courseId: string): Promise<PlanActionResult> {
  try {
    const id = normalizeCourseCode(String(courseId));
    if (!id) return { ok: false, message: "Invalid course." };
    await deletePlanned(id);
    revalidatePath("/", "layout");
    return { ok: true, message: `Removed ${id}.` };
  } catch (err) {
    console.error("removeFromPlan failed", err);
    return { ok: false, message: "Couldn't update your plan. Please try again." };
  }
}

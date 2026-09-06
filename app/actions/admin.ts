"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { clearAdminSession, createAdminSession, requireAdmin, verifyAdminPassword } from "@/lib/auth";
import { uniqueJoinCode } from "@/lib/codes";
import { db } from "@/lib/db";
import { detectAnswerLanguage, normalizeAnswer, pointsForResponse } from "@/lib/scoring";

const questionSchema = z.object({
  quizSetId: z.string().min(1),
  prompt: z.string().min(3),
  correctDisplayEn: z.string().min(1),
  correctDisplayAr: z.string().optional(),
  correctDisplayMl: z.string().optional(),
  category: z.string().optional(),
  difficulty: z.string().default("easy"),
  points: z.coerce.number().int().min(1).max(100).default(5),
  variants: z.string().min(1),
  clues: z.string().min(1),
});

export async function loginAdmin(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const admin = await verifyAdminPassword(email, password);

  if (!admin) redirect("/admin/login?error=1");

  await createAdminSession(admin.id);
  redirect("/admin");
}

export async function logoutAdmin() {
  await clearAdminSession();
  redirect("/admin/login");
}

export async function createQuestion(formData: FormData) {
  const admin = await requireAdmin();
  const parsed = questionSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect("/admin/questions?error=question");

  const data = parsed.data;
  const variants = data.variants
    .split(/\r?\n|,/)
    .map((value) => value.trim())
    .filter(Boolean);
  const clues = data.clues
    .split(/\r?\n/)
    .map((value) => value.trim())
    .filter(Boolean);

  if (!variants.length || !clues.length) redirect("/admin/questions?error=question");

  const count = await db.question.count({ where: { quizSetId: data.quizSetId } });
  const question = await db.question.create({
    data: {
      quizSetId: data.quizSetId,
      prompt: data.prompt,
      correctDisplayEn: data.correctDisplayEn,
      correctDisplayAr: data.correctDisplayAr || null,
      correctDisplayMl: data.correctDisplayMl || null,
      category: data.category || null,
      difficulty: data.difficulty,
      points: data.points,
      sortOrder: count,
      answerVariants: {
        create: variants.map((value) => ({
          value,
          normalized: normalizeAnswer(value),
          language: detectAnswerLanguage(value),
        })),
      },
      clues: {
        create: clues.map((text, index) => ({ text, sortOrder: index, penalty: 1 })),
      },
    },
  });

  await db.auditLog.create({
    data: { adminId: admin.id, action: "question.create", entity: "question", entityId: question.id },
  });

  revalidatePath("/admin/questions");
  redirect("/admin/questions?created=1");
}

export async function toggleQuestion(formData: FormData) {
  const admin = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const active = String(formData.get("active") ?? "") === "true";
  await db.question.update({ where: { id }, data: { active: !active } });
  await db.auditLog.create({
    data: { adminId: admin.id, action: !active ? "question.activate" : "question.archive", entity: "question", entityId: id },
  });
  revalidatePath("/admin/questions");
}

export async function createEvent(formData: FormData) {
  const admin = await requireAdmin();
  const title = String(formData.get("title") ?? "").trim();
  const quizSetId = String(formData.get("quizSetId") ?? "").trim();
  const maxParticipants = Math.max(1, Number(formData.get("maxParticipants") ?? 50));
  const status = String(formData.get("status") ?? "draft");
  const showAnswers = formData.get("showAnswers") === "on";

  if (!title || !quizSetId) redirect("/admin?error=event");

  const event = await db.event.create({
    data: {
      title,
      quizSetId,
      maxParticipants,
      status: status === "open" ? "open" : "draft",
      showAnswers,
      joinCode: await uniqueJoinCode(),
    },
  });

  await db.auditLog.create({
    data: { adminId: admin.id, action: "event.create", entity: "event", entityId: event.id },
  });

  revalidatePath("/admin");
  redirect(`/admin/events/${event.id}`);
}

export async function updateEventStatus(formData: FormData) {
  const admin = await requireAdmin();
  const eventId = String(formData.get("eventId") ?? "");
  const status = String(formData.get("status") ?? "draft");
  if (!["draft", "open", "closed"].includes(status)) return;

  await db.event.update({ where: { id: eventId }, data: { status } });
  await db.auditLog.create({
    data: { adminId: admin.id, action: `event.${status}`, entity: "event", entityId: eventId },
  });

  revalidatePath("/admin");
  revalidatePath(`/admin/events/${eventId}`);
}

export async function updateManualVerdict(formData: FormData) {
  const admin = await requireAdmin();
  const responseId = String(formData.get("responseId") ?? "");
  const verdict = String(formData.get("verdict") ?? "clear");

  const response = await db.response.findUnique({
    where: { id: responseId },
    include: { question: { include: { clues: { orderBy: { sortOrder: "asc" } } } }, attempt: true },
  });
  if (!response || response.skipped) return;

  const manualCorrect = verdict === "clear" ? null : verdict === "true";
  const pointsAwarded = pointsForResponse({ ...response, manualCorrect });

  await db.$transaction(async (tx) => {
    await tx.response.update({
      where: { id: responseId },
      data: { manualCorrect, pointsAwarded, reviewedAt: new Date(), reviewedById: admin.id },
    });

    const responses = await tx.response.findMany({ where: { attemptId: response.attemptId } });
    await tx.attempt.update({
      where: { id: response.attemptId },
      data: { score: responses.reduce((sum, item) => sum + (item.id === responseId ? pointsAwarded : item.pointsAwarded), 0) },
    });

    await tx.auditLog.create({
      data: {
        adminId: admin.id,
        action: "response.review",
        entity: "response",
        entityId: responseId,
        detail: `Manual verdict set to ${String(manualCorrect)}`,
      },
    });
  });

  revalidatePath(`/admin/events/${response.attempt.eventId}`);
  revalidatePath(`/result/${response.attemptId}`);
}

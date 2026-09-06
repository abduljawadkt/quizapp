"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { detectAnswerLanguage, isAcceptedAnswer, pointsForResponse } from "@/lib/scoring";

const joinSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1).max(80),
});

async function getAttemptWithGame(attemptId: string) {
  return db.attempt.findUnique({
    where: { id: attemptId },
    include: {
      participant: true,
      event: {
        include: {
          quizSet: {
            include: {
              questions: {
                where: { active: true },
                orderBy: { sortOrder: "asc" },
                include: {
                  answerVariants: true,
                  clues: { orderBy: { sortOrder: "asc" } },
                },
              },
            },
          },
        },
      },
    },
  });
}

export async function joinEvent(formData: FormData) {
  const parsed = joinSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect("/?error=join");

  const event = await db.event.findUnique({
    where: { joinCode: parsed.data.code.toUpperCase().trim() },
    include: { participants: true },
  });

  if (!event || event.status !== "open") redirect(`/?error=closed&code=${parsed.data.code}`);
  if (event.participants.length >= event.maxParticipants) redirect(`/?error=full&code=${event.joinCode}`);

  const participant = await db.participant.create({
    data: {
      eventId: event.id,
      name: parsed.data.name.trim(),
      attempts: { create: { eventId: event.id } },
    },
    include: { attempts: true },
  });

  redirect(`/play/${participant.attempts[0].id}`);
}

export async function revealClue(formData: FormData) {
  const attemptId = String(formData.get("attemptId") ?? "");
  const attempt = await getAttemptWithGame(attemptId);
  if (!attempt) redirect("/");
  if (attempt.status === "completed") redirect(`/result/${attempt.id}`);

  const question = attempt.event.quizSet.questions[attempt.currentIndex];
  if (!question) redirect(`/result/${attempt.id}`);

  const already = await db.clueReveal.findMany({
    where: { attemptId: attempt.id, questionId: question.id },
    orderBy: { revealedAt: "asc" },
  });
  const nextClue = question.clues[already.length];
  if (nextClue) {
    await db.clueReveal.upsert({
      where: { attemptId_clueId: { attemptId: attempt.id, clueId: nextClue.id } },
      update: {},
      create: { attemptId: attempt.id, questionId: question.id, clueId: nextClue.id },
    });
  }

  redirect(`/play/${attempt.id}`);
}

export async function submitAnswer(formData: FormData) {
  const attemptId = String(formData.get("attemptId") ?? "");
  const answerText = String(formData.get("answerText") ?? "").trim();
  if (!answerText) redirect(`/play/${attemptId}?error=answer`);

  await finalizeResponse(attemptId, answerText, false);
}

export async function skipQuestion(formData: FormData) {
  const attemptId = String(formData.get("attemptId") ?? "");
  await finalizeResponse(attemptId, null, true);
}

async function finalizeResponse(attemptId: string, answerText: string | null, skipped: boolean) {
  const attempt = await getAttemptWithGame(attemptId);
  if (!attempt) redirect("/");
  if (attempt.status === "completed") redirect(`/result/${attempt.id}`);

  const questions = attempt.event.quizSet.questions;
  const question = questions[attempt.currentIndex];
  if (!question) redirect(`/result/${attempt.id}`);

  const existing = await db.response.findUnique({
    where: { attemptId_questionIndex: { attemptId: attempt.id, questionIndex: attempt.currentIndex } },
  });
  if (existing) redirect(`/play/${attempt.id}`);

  const cluesUsed = await db.clueReveal.count({ where: { attemptId: attempt.id, questionId: question.id } });
  const autoCorrect = skipped ? false : isAcceptedAnswer(answerText ?? "", question.answerVariants.map((variant) => variant.normalized));
  const answerLanguage = answerText ? detectAnswerLanguage(answerText) : null;
  const pointsAwarded = pointsForResponse({ skipped, autoCorrect, manualCorrect: null, cluesUsed, question });
  const nextIndex = attempt.currentIndex + 1;
  const completed = nextIndex >= questions.length;

  await db.$transaction([
    db.response.create({
      data: {
        attemptId: attempt.id,
        questionId: question.id,
        questionIndex: attempt.currentIndex,
        answerText,
        answerLanguage,
        skipped,
        autoCorrect,
        cluesUsed,
        pointsAwarded,
      },
    }),
    db.attempt.update({
      where: { id: attempt.id },
      data: {
        currentIndex: nextIndex,
        score: attempt.score + pointsAwarded,
        status: completed ? "completed" : "in_progress",
        completedAt: completed ? new Date() : null,
      },
    }),
  ]);

  if (completed) redirect(`/result/${attempt.id}`);
  redirect(`/play/${attempt.id}?earned=${pointsAwarded}&correct=${autoCorrect ? "1" : "0"}&skipped=${skipped ? "1" : "0"}`);
}

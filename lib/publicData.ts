import { unstable_cache } from "next/cache";
import { db } from "@/lib/db";

export const getOpenEvents = unstable_cache(
  async () =>
    db.event.findMany({
      where: { status: "open" },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        joinCode: true,
        maxParticipants: true,
        quizSet: { select: { title: true } },
        _count: { select: { participants: true } },
      },
    }),
  ["open-events"],
  { revalidate: 10, tags: ["events"] },
);

export const getJoinEvent = unstable_cache(
  async (code: string) =>
    db.event.findUnique({
      where: { joinCode: code.toUpperCase() },
      select: {
        title: true,
        joinCode: true,
        status: true,
        maxParticipants: true,
        quizSet: {
          select: {
            title: true,
            _count: { select: { questions: { where: { active: true } } } },
          },
        },
        _count: { select: { participants: true } },
      },
    }),
  ["join-event"],
  { revalidate: 10, tags: ["events"] },
);

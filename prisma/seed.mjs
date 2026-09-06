import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const questions = [
  {
    prompt: "How many pillars of Islam are there?",
    variants: ["5", "five", "خمسة", "خمس", "൫", "അഞ്ച്", "അഞ്ചു"],
    en: "5 (Five)",
    ar: "خمسة",
    ml: "അഞ്ച്",
    clues: [
      "It's a number between 1 and 10.",
      "Prayer (Salah) is one of them.",
      "Fasting during Ramadan is also one of them.",
      "The number is the same as the number of daily prayers.",
    ],
  },
  {
    prompt: "What is the holy book of Islam called?",
    variants: ["quran", "koran", "al quran", "alquran", "the quran", "holy quran", "القرآن", "قرآن", "ഖുർആൻ", "ഖുര്‍ആൻ", "കുർആൻ"],
    en: "Quran",
    ar: "القرآن",
    ml: "ഖുർആൻ",
    clues: [
      "It was revealed to Prophet Muhammad ﷺ.",
      "It is written in Arabic.",
      "It is recited during the five daily prayers.",
      "Its name literally means The Recitation.",
    ],
  },
  {
    prompt: "In which month do Muslims observe fasting?",
    variants: ["ramadan", "ramadhan", "ramzan", "ramadaan", "رمضان", "റമദാൻ", "റമദാന്", "റമളാൻ"],
    en: "Ramadan",
    ar: "رمضان",
    ml: "റമദാൻ",
    clues: [
      "It's the ninth month of the Islamic lunar calendar.",
      "Muslims fast from dawn to sunset during this month.",
      "It ends with Eid al-Fitr.",
      "The Quran was first revealed during this month.",
    ],
  },
  {
    prompt: "What is the Islamic pilgrimage to Mecca called?",
    variants: ["hajj", "haj", "الحج", "حج", "ഹജ്", "ഹജ്ജ്"],
    en: "Hajj",
    ar: "الحج",
    ml: "ഹജ്ജ്",
    clues: [
      "It's one of the Five Pillars of Islam.",
      "It takes place in Dhul Hijjah.",
      "Able Muslims perform it once in their lifetime if possible.",
      "Pilgrims wear simple garments called Ihram.",
    ],
  },
  {
    prompt: "Who is considered the final prophet in Islam?",
    variants: ["muhammad", "mohammed", "mohammad", "muhammed", "mohamed", "محمد", "മുഹമ്മദ്", "മുഹമ്മദ് നബി"],
    en: "Muhammad ﷺ",
    ar: "محمد",
    ml: "മുഹമ്മദ്",
    clues: [
      "He was born in Mecca.",
      "He received revelation through Angel Jibreel.",
      "His migration to Medina is called Hijrah.",
      "His name means the praised one.",
    ],
  },
];

function normalizeAnswer(value) {
  const arabicDigits = "٠١٢٣٤٥٦٧٨٩";
  const malayalamDigits = "൦൧൨൩൪൫൬൭൮൯";
  return String(value)
    .replace(/[٠-٩]/g, (digit) => String(arabicDigits.indexOf(digit)))
    .replace(/[൦-൯]/g, (digit) => String(malayalamDigits.indexOf(digit)))
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[\u064B-\u0652\u0670\u0640]/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, "")
    .trim();
}

function detectAnswerLanguage(value) {
  if (/[\u0D00-\u0D7F]/.test(value)) return "ml";
  if (/[\u0600-\u06FF]/.test(value)) return "ar";
  return "en";
}

async function main() {
  const email = (process.env.ADMIN_EMAIL || "admin@igm.local").toLowerCase();
  const password = process.env.ADMIN_PASSWORD || "admin123";
  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.adminUser.upsert({
    where: { email },
    update: { passwordHash },
    create: { email, name: "IGM Admin", role: "OWNER", passwordHash },
  });

  const quizSet = await prisma.quizSet.upsert({
    where: { id: "seed-main-quiz" },
    update: { title: "Islamic Treasure Hunt", description: "Starter quiz set for the treasure hunt competition." },
    create: {
      id: "seed-main-quiz",
      title: "Islamic Treasure Hunt",
      description: "Starter quiz set for the treasure hunt competition.",
    },
  });

  await prisma.question.deleteMany({ where: { quizSetId: quizSet.id } });

  for (const [index, q] of questions.entries()) {
    await prisma.question.create({
      data: {
        quizSetId: quizSet.id,
        prompt: q.prompt,
        correctDisplayEn: q.en,
        correctDisplayAr: q.ar,
        correctDisplayMl: q.ml,
        category: "Islamic Knowledge",
        difficulty: "easy",
        points: 10,
        sortOrder: index,
        answerVariants: {
          create: q.variants.map((value) => ({ value, normalized: normalizeAnswer(value), language: detectAnswerLanguage(value) })),
        },
        clues: {
          create: q.clues.map((text, clueIndex) => ({ text, sortOrder: clueIndex, penalty: 2 })),
        },
      },
    });
  }

  await prisma.event.upsert({
    where: { joinCode: "DEMO01" },
    update: { title: "Demo Treasure Hunt", status: "open", quizSetId: quizSet.id },
    create: {
      title: "Demo Treasure Hunt",
      joinCode: "DEMO01",
      status: "open",
      maxParticipants: 50,
      showAnswers: true,
      quizSetId: quizSet.id,
    },
  });

  console.log(`Seeded admin ${email} / ${password} and demo event code DEMO01`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => prisma.$disconnect());

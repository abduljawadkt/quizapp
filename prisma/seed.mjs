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

const yaseenQuestions = [
  {
    prompt: "സൂറ: യാസീനിൽ മൂന്ന് തവണ ഉപയോഗിച്ച പദം, രണ്ട് സ്ഥലങ്ങളിൽ അന്ത്യനാളുമായി ബന്ധപ്പെടുകയും ഒരിടത്ത് ദുനിയാവുമായി ബന്ധപ്പെടുത്തിയും ഉപയോഗിച്ചിരിക്കുന്നു. ഏതാണ് ആ പദം?",
    variants: ["صَيْحَة", "صيحة", "sayhah", "saihah", "ṣayḥah", "സൈഹ", "സൈഹഃ", "ശബ്ദം", "ഘോരനാദം"],
    en: "Sayhah",
    ar: "صَيْحَة",
    ml: "ശബ്ദം / ഘോരനാദം",
    category: "Surah Yaseen",
    difficulty: "medium",
    clues: [
      "ദുനിയാവുമായി ബന്ധപ്പെടുത്തി പറഞ്ഞത് ശിക്ഷയുടെ രൂപമായാണ്.",
      "ഒരു ഊർജ്ജ വിഭാഗമാണ്.",
      "ഇതുകൊണ്ട് ജനതകളെ അല്ലാഹു നശിപ്പിച്ചു എന്ന് വിവിധ സൂറത്തുകളിൽ അല്ലാഹു സൂചിപ്പിച്ചിട്ടുണ്ട്.",
    ],
  },
  {
    prompt: "ഒരു പ്രവാചകൻ്റെ ചരിത്രത്തിൽ വലിയ പ്രാധാന്യമുള്ള ഈ വസ്തുവെക്കുറിച്ച് 2 അധ്യായങ്ങളിലും പരാമർശിക്കുന്നുണ്ട്. ഏതാണ് ആ വസ്തു?",
    variants: ["ship", "boat", "vessel", "കപ്പൽ", "കപ്പല്", "നൗക", "سفينة"],
    en: "Ship",
    ar: "سفينة",
    ml: "കപ്പൽ",
    category: "Quran Objects",
    difficulty: "easy",
    clues: [
      "അല്ലാഹു മനുഷ്യർക്ക് നൽകിയ അനുഗ്രഹമായിട്ടാണ് രണ്ട് സൂറത്തുകളിലും വന്നിട്ടുള്ളത്.",
      "ഈ വസ്തുവിനെ സംബന്ധിച്ച് അല്ലാഹുവിന്റെ ശിക്ഷയെക്കുറിച്ചുള്ള താക്കീതും നൽകിയിട്ടുണ്ട്.",
      "മനുഷ്യർ യാത്രക്ക് ഉപയോഗിക്കുന്നു.",
    ],
  },
  {
    prompt: "ഖുർആനിൽ ഏകവചനമായും ദ്വിവചനമായും ബഹുവചനമായും ഉപയോഗിച്ച പദം; സൂറ യാസീനിൽ അതിൻറെ ബഹുവചനമാണ് ഉപയോഗിച്ചിരിക്കുന്നത്. ഏതാണ് ആ പദം?",
    variants: ["قُرُون", "قرون", "qurun", "quroon", "qurūn", "തലമുറകൾ", "തലമുറകള്", "ജനതകൾ", "ജനതകള്"],
    en: "Qurun",
    ar: "قُرُون",
    ml: "തലമുറകൾ / ജനതകൾ",
    category: "Surah Yaseen",
    difficulty: "hard",
    clues: [
      "യുവജനം ആയി ഉപയോഗിക്കുമ്പോൾ ഖുർആനിൽ പറഞ്ഞ ഒരു രാജാവിൻറെ പേരിൻറെ ഒരു ഭാഗമാകും.",
      "അല്ലാഹു നശിപ്പിച്ചു എന്ന് അതിനെക്കുറിച്ച് പറയുന്നുണ്ട്.",
      "അതിന്റെ ഏകവചനത്തിന് കൊമ്പ് എന്ന അർത്ഥമുണ്ട്.",
    ],
  },
  {
    prompt: "സുറത്തു ലുഖ്മാനിലും സൂറത്തു യാസീനിലും വന്ന പ്രകൃതിയിലെ ഒരു വസ്തുവാണിത്. ഏതാണ് അത്?",
    variants: ["tree", "wood", "മരം", "വൃക്ഷം", "شجر", "الشجر"],
    en: "Tree",
    ar: "شجر",
    ml: "മരം",
    category: "Nature in Quran",
    difficulty: "easy",
    clues: [
      "അത് ഒരു ഉപകരണമാക്കി മാറ്റിയാൽ എന്ന് പറഞ്ഞു.",
      "ഒരു നിറവുമായി ബന്ധപ്പെടുത്തി പറഞ്ഞു.",
      "അതിൽ നിന്ന് തീ ഉണ്ടാകുന്നു എന്ന് പറഞ്ഞു.",
    ],
  },
  {
    prompt: "സൂറ യാസീനിൽ പറഞ്ഞ ഒരു വീട്ടുപകരണം. ഏതാണ് അത്?",
    variants: ["أَرَائِك", "ارائك", "araik", "ara'ik", "araaik", "വിശ്രമാസനങ്ങൾ", "വിശ്രമാസനങ്ങള്", "അലങ്കരിച്ച ഇരിപ്പിടങ്ങൾ", "ഇരിപ്പിടങ്ങൾ", "ഇരിപ്പിടങ്ങള്"],
    en: "Ara'ik",
    ar: "أَرَائِك",
    ml: "വിശ്രമാസനങ്ങൾ / അലങ്കരിച്ച ഇരിപ്പിടങ്ങൾ",
    category: "Surah Yaseen",
    difficulty: "medium",
    clues: [
      "സ്വർഗ്ഗത്തിൽ അതുകൊണ്ട് എന്ന് സൂറത്ത് യാസീനിൽ പറഞ്ഞിട്ടുണ്ട്.",
      "മനുഷ്യൻ വിശ്രമത്തിനു വേണ്ടി ഉപയോഗിക്കുന്നതാണ്.",
      "ഇരിക്കാൻ ഉപയോഗിക്കുന്ന ഒന്ന്.",
    ],
  },
  {
    prompt: "സൂറ ലുഖ്മാനിലും സൂറ യാസീനിലും കൂടെ ഒരുതവണ മാത്രമേ ഈ പ്രാപഞ്ചിക പ്രതിഭാസത്തെക്കുറിച്ച് പറയുന്നുള്ളൂ. ആ പ്രതിഭാസത്തെ സൂചിപ്പിക്കുന്ന അറബി പദം ഏതാണ്?",
    variants: ["مَوْج", "موج", "mawj", "wave", "waves", "തിരമാല", "തിരമാലകൾ", "തിരമാലകള്"],
    en: "Mawj",
    ar: "مَوْج",
    ml: "തിരമാല",
    category: "Surah Luqman",
    difficulty: "medium",
    clues: [
      "ഇതിനെ വമ്പിച്ച പർവതങ്ങളോട് ഉപമിച്ചു.",
      "ജലവുമായി ബന്ധപ്പെട്ടതാണ്.",
      "സൂറ ലുഖ്മാൻ 32-ാം ആയത്തിലാണ് ഈ പദം വരുന്നത്.",
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

async function replaceQuestions(quizSetId, items) {
  await prisma.question.deleteMany({ where: { quizSetId } });

  for (const [index, q] of items.entries()) {
    await prisma.question.create({
      data: {
        quizSetId,
        prompt: q.prompt,
        correctDisplayEn: q.en,
        correctDisplayAr: q.ar,
        correctDisplayMl: q.ml,
        category: q.category ?? "Islamic Knowledge",
        difficulty: q.difficulty ?? "easy",
        points: 5,
        sortOrder: index,
        answerVariants: {
          create: q.variants.map((value) => ({ value, normalized: normalizeAnswer(value), language: detectAnswerLanguage(value) })),
        },
        clues: {
          create: q.clues.map((text, clueIndex) => ({ text, sortOrder: clueIndex, penalty: 1 })),
        },
      },
    });
  }
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

  await replaceQuestions(quizSet.id, questions);

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

  const yaseenQuizSet = await prisma.quizSet.upsert({
    where: { id: "surah-yaseen-luqman-treasure-hunt" },
    update: {
      title: "Surah Yaseen & Luqman Treasure Hunt",
      description: "Malayalam Quran quiz based on Surah Yaseen and Surah Luqman clues.",
    },
    create: {
      id: "surah-yaseen-luqman-treasure-hunt",
      title: "Surah Yaseen & Luqman Treasure Hunt",
      description: "Malayalam Quran quiz based on Surah Yaseen and Surah Luqman clues.",
    },
  });

  await replaceQuestions(yaseenQuizSet.id, yaseenQuestions);

  await prisma.event.upsert({
    where: { joinCode: "YASEEN" },
    update: {
      title: "Surah Yaseen Quiz Challenge",
      status: "open",
      quizSetId: yaseenQuizSet.id,
      maxParticipants: 100,
      showAnswers: true,
    },
    create: {
      title: "Surah Yaseen Quiz Challenge",
      joinCode: "YASEEN",
      status: "open",
      maxParticipants: 100,
      showAnswers: true,
      quizSetId: yaseenQuizSet.id,
    },
  });

  console.log(`Seeded admin ${email} / ${password}, demo event code DEMO01, and Surah quiz event code YASEEN`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => prisma.$disconnect());

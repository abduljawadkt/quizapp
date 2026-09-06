export function normalizeAnswer(value: string) {
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

export function detectAnswerLanguage(value: string) {
  if (/[\u0D00-\u0D7F]/.test(value)) return "ml";
  if (/[\u0600-\u06FF]/.test(value)) return "ar";
  return "en";
}

function isLatinWord(value: string) {
  return /^[a-z0-9]+$/.test(value);
}

function levenshtein(a: string, b: string) {
  const rows = a.length + 1;
  const cols = b.length + 1;
  const dp = Array.from({ length: rows }, () => new Array<number>(cols).fill(0));

  for (let i = 0; i < rows; i++) dp[i][0] = i;
  for (let j = 0; j < cols; j++) dp[0][j] = j;

  for (let i = 1; i < rows; i++) {
    for (let j = 1; j < cols; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
    }
  }

  return dp[a.length][b.length];
}

export function isAcceptedAnswer(input: string, acceptedNormalizedValues: string[]) {
  const normalizedInput = normalizeAnswer(input);
  if (!normalizedInput) return false;

  return acceptedNormalizedValues.some((accepted) => {
    if (accepted === normalizedInput) return true;
    if (!isLatinWord(accepted) || !isLatinWord(normalizedInput)) return false;
    const threshold = accepted.length <= 4 ? 0 : accepted.length <= 7 ? 1 : 2;
    return levenshtein(accepted, normalizedInput) <= threshold;
  });
}

export function effectiveCorrect(response: {
  skipped: boolean;
  autoCorrect: boolean;
  manualCorrect: boolean | null;
}) {
  if (response.skipped) return false;
  if (response.manualCorrect === true) return true;
  if (response.manualCorrect === false) return false;
  return response.autoCorrect;
}

export function pointsForResponse(response: {
  skipped: boolean;
  autoCorrect: boolean;
  manualCorrect: boolean | null;
  cluesUsed: number;
  question?: { points: number; clues?: { penalty: number }[] };
}) {
  if (!effectiveCorrect(response)) return 0;
  const base = response.question?.points ?? 10;
  const penalty = response.question?.clues?.[0]?.penalty ?? 2;
  return Math.max(0, base - response.cluesUsed * penalty);
}

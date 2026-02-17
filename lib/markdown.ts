import type { ExerciseProgress, WorkoutEntry, WorkoutSet } from "@/lib/types";

const EMPTY_VALUE = "-";

function parseNumberFromLine(content: string): number | null {
  const match = content.match(/-?\d+(?:[.,]\d+)?/);
  if (!match) return null;
  return Number(match[0].replace(",", "."));
}

function parseDateFromLine(content: string): string | null {
  const normalized = content.replace(/^-+\s*/, "").trim();
  return normalized.length > 0 && normalized !== EMPTY_VALUE ? normalized : null;
}

function parseSeriesDetail(content: string): WorkoutSet[] {
  const normalized = content.trim();
  if (!normalized) return [];

  return normalized
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const match = part.match(/^([0-9]+(?:[.,][0-9]+)?)\s*[xX]\s*([0-9]+)$/);
      if (!match) return null;
      return {
        load: Number(match[1].replace(",", ".")),
        reps: Number(match[2]),
      };
    })
    .filter((value): value is WorkoutSet => value !== null);
}

function formatSeriesDetail(series: WorkoutSet[] | undefined): string {
  if (!series || series.length === 0) return EMPTY_VALUE;
  return series.map((set) => `${set.load}x${set.reps}`).join("; ");
}

function parseHistoryLine(line: string): WorkoutEntry | null {
  const trimmed = line.trim().replace(/^-+\s*/, "");
  const detailMatch = trimmed.match(
    /^(\d{4}-\d{2}-\d{2})\s*[-|]\s*([0-9]+(?:[.,][0-9]+)?)kg\s*[xX]\s*([0-9]+)\s*[xX]\s*([0-9]+)\s*\|\s*Séries:\s*(.+)$/i
  );
  if (detailMatch) {
    return {
      date: detailMatch[1],
      load: Number(detailMatch[2].replace(",", ".")),
      reps: Number(detailMatch[3]),
      sets: Number(detailMatch[4]),
      series: parseSeriesDetail(detailMatch[5]),
    };
  }
  const withSets = trimmed.match(
    /^(\d{4}-\d{2}-\d{2})\s*[-|]\s*([0-9]+(?:[.,][0-9]+)?)kg\s*[xX]\s*([0-9]+)\s*[xX]\s*([0-9]+)$/
  );
  if (withSets) {
    return {
      date: withSets[1],
      load: Number(withSets[2].replace(",", ".")),
      reps: Number(withSets[3]),
      sets: Number(withSets[4]),
    };
  }
  const legacy = trimmed.match(
    /^(\d{4}-\d{2}-\d{2})\s*[-|]\s*([0-9]+(?:[.,][0-9]+)?)kg\s*[xX]\s*([0-9]+)$/
  );
  if (!legacy) return null;
  return {
    date: legacy[1],
    load: Number(legacy[2].replace(",", ".")),
    reps: Number(legacy[3]),
    sets: 1,
  };
}

export function formatExerciseDescription(data: ExerciseProgress): string {
  const historyLines = data.history
    .slice(0, 12)
    .map((entry) => {
      const seriesDetail = formatSeriesDetail(entry.series);
      return seriesDetail !== EMPTY_VALUE
        ? `- ${entry.date} - ${entry.load}kg x ${entry.reps} x ${entry.sets} | Séries: ${seriesDetail}`
        : `- ${entry.date} - ${entry.load}kg x ${entry.reps} x ${entry.sets}`;
    });

  return [
    "## Último Treino",
    `- Carga: ${data.lastLoad ?? EMPTY_VALUE}`,
    `- Reps: ${data.lastReps ?? EMPTY_VALUE}`,
    `- Séries: ${data.lastSets ?? EMPTY_VALUE}`,
    `- Data: ${data.lastDate ?? EMPTY_VALUE}`,
    "",
    "## Melhor Marca (PR)",
    `- Carga: ${data.prLoad ?? EMPTY_VALUE}`,
    `- Reps: ${data.prReps ?? EMPTY_VALUE}`,
    "",
    "## Histórico Resumido",
    ...(historyLines.length > 0 ? historyLines : ["- Sem treinos ainda"]),
  ].join("\n");
}

export function parseExerciseDescription(cardId: string, name: string, desc?: string): ExerciseProgress {
  const content = desc ?? "";
  const lines = content.split("\n");

  let lastLoad: number | null = null;
  let lastReps: number | null = null;
  let lastSets: number | null = null;
  let lastDate: string | null = null;
  let prLoad: number | null = null;
  let prReps: number | null = null;
  const history: WorkoutEntry[] = [];

  let currentSection = "";

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("## ")) {
      currentSection = trimmed;
      continue;
    }

    if (currentSection.includes("Último Treino")) {
      if (trimmed.startsWith("- Carga:")) lastLoad = parseNumberFromLine(trimmed);
      if (trimmed.startsWith("- Reps:")) lastReps = parseNumberFromLine(trimmed);
      if (trimmed.startsWith("- Séries:")) lastSets = parseNumberFromLine(trimmed);
      if (trimmed.startsWith("- Data:")) lastDate = parseDateFromLine(trimmed.replace("- Data:", ""));
    }

    if (currentSection.includes("Melhor Marca")) {
      if (trimmed.startsWith("- Carga:")) prLoad = parseNumberFromLine(trimmed);
      if (trimmed.startsWith("- Reps:")) prReps = parseNumberFromLine(trimmed);
    }

    if (currentSection.includes("Histórico Resumido") && trimmed.startsWith("-")) {
      const item = parseHistoryLine(trimmed);
      if (item) history.push(item);
    }
  }

  return {
    cardId,
    name,
    lastLoad,
    lastReps,
    lastSets,
    lastDate,
    prLoad,
    prReps,
    history,
  };
}

export function isPersonalRecord(
  currentPRLoad: number | null,
  currentPRReps: number | null,
  candidateLoad: number,
  candidateReps: number
): boolean {
  if (currentPRLoad == null) return true;
  if (candidateLoad > currentPRLoad) return true;
  return candidateLoad === currentPRLoad && (currentPRReps == null || candidateReps > currentPRReps);
}

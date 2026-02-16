export const BOARD_NAME = "🏋️ Progressão de Carga";

export const LIST_NAMES = {
  EXERCISES: "📌 Exercícios",
  WORKOUTS: "🗓 Treinos",
  PRS: "🏆 PRs",
} as const;

export type ListKey = keyof typeof LIST_NAMES;

export interface ExerciseProgress {
  cardId: string;
  name: string;
  lastLoad: number | null;
  lastReps: number | null;
  lastSets: number | null;
  lastDate: string | null;
  prLoad: number | null;
  prReps: number | null;
  history: WorkoutEntry[];
}

export interface WorkoutEntry {
  load: number;
  reps: number;
  sets: number;
  date: string;
}

/** Volume = carga × reps × séries (kg) */
export function volume(entry: WorkoutEntry): number {
  return entry.load * entry.reps * entry.sets;
}

export interface WorkoutPayload {
  exerciseName: string;
  load: number;
  reps: number;
  sets: number;
}

export interface WorkoutResult {
  exercise: ExerciseProgress;
  isPR: boolean;
  deltaLoad: number;
}

export interface DashboardData {
  workoutsThisWeek: number;
  weeklyStreak: number;
  lastPR: {
    exerciseName: string;
    load: number;
    reps: number;
    date: string;
  } | null;
  mostImprovedExercise: {
    exerciseName: string;
    delta: number;
  } | null;
  chart: Array<{
    date: string;
    exerciseName: string;
    load: number;
    volume: number;
  }>;
}

export interface TrelloCard {
  id: string;
  name: string;
  desc: string;
  idList: string;
  dateLastActivity: string;
}

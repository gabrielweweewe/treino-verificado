import { calculateWeeklyStreak, isSameWeek, todayIso } from "@/lib/date";
import { formatExerciseDescription, isPersonalRecord, parseExerciseDescription } from "@/lib/markdown";
import { BOARD_NAME, LIST_NAMES, type DashboardData, type ExerciseProgress, type TrelloCard, volume } from "@/lib/types";

const TRELLO_BASE_URL = "https://api.trello.com/1";

function getCredentials() {
  const key = process.env.TRELLO_API_KEY;
  const token = process.env.TRELLO_TOKEN;

  if (!key || !token) {
    throw new Error("Credenciais Trello ausentes. Configure TRELLO_API_KEY e TRELLO_TOKEN.");
  }

  return { key, token };
}

async function trelloRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const { key, token } = getCredentials();
  const separator = path.includes("?") ? "&" : "?";
  const url = `${TRELLO_BASE_URL}${path}${separator}key=${key}&token=${token}`;

  const response = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Trello ${response.status}: ${errorText}`);
  }

  return response.json() as Promise<T>;
}

interface TrelloBoard {
  id: string;
  name: string;
}

interface TrelloList {
  id: string;
  name: string;
}

export async function getOrCreateBoard(): Promise<string> {
  const boards = await trelloRequest<TrelloBoard[]>("/members/me/boards?filter=open");
  const existing = boards.find((board) => board.name === BOARD_NAME);
  if (existing) return existing.id;

  const created = await trelloRequest<TrelloBoard>("/boards", {
    method: "POST",
    body: JSON.stringify({
      name: BOARD_NAME,
      defaultLists: false,
    }),
  });

  return created.id;
}

export async function getOrCreateList(boardId: string, listName: string): Promise<string> {
  const lists = await trelloRequest<TrelloList[]>(`/boards/${boardId}/lists?filter=open`);
  const existing = lists.find((list) => list.name === listName);
  if (existing) return existing.id;

  const created = await trelloRequest<TrelloList>("/lists", {
    method: "POST",
    body: JSON.stringify({
      name: listName,
      idBoard: boardId,
      pos: "bottom",
    }),
  });

  return created.id;
}

export async function bootstrapBoard() {
  const boardId = await getOrCreateBoard();
  const [exerciseListId, workoutListId, prListId] = await Promise.all([
    getOrCreateList(boardId, LIST_NAMES.EXERCISES),
    getOrCreateList(boardId, LIST_NAMES.WORKOUTS),
    getOrCreateList(boardId, LIST_NAMES.PRS),
  ]);

  return {
    boardId,
    lists: {
      exercises: exerciseListId,
      workouts: workoutListId,
      prs: prListId,
    },
  };
}

export async function getCardsByListId(listId: string): Promise<TrelloCard[]> {
  return trelloRequest<TrelloCard[]>(`/lists/${listId}/cards?fields=name,desc,idList,dateLastActivity`);
}

export async function findExerciseCardByName(exerciseListId: string, exerciseName: string): Promise<TrelloCard | null> {
  const cards = await getCardsByListId(exerciseListId);
  const normalized = exerciseName.trim().toLowerCase();
  const card = cards.find((item) => item.name.trim().toLowerCase() === normalized);
  return card ?? null;
}

export async function createExerciseCard(listId: string, exerciseName: string): Promise<TrelloCard> {
  const payload: ExerciseProgress = {
    cardId: "",
    name: exerciseName,
    lastLoad: null,
    lastReps: null,
    lastSets: null,
    lastDate: null,
    prLoad: null,
    prReps: null,
    history: [],
  };

  return trelloRequest<TrelloCard>("/cards", {
    method: "POST",
    body: JSON.stringify({
      idList: listId,
      name: exerciseName,
      desc: formatExerciseDescription(payload),
    }),
  });
}

export async function updateExerciseCard(cardId: string, description: string): Promise<void> {
  await trelloRequest(`/cards/${cardId}`, {
    method: "PUT",
    body: JSON.stringify({ desc: description }),
  });
}

export async function createWorkoutEntry(
  workoutListId: string,
  input: { exerciseName: string; load: number; reps: number; sets: number; date: string }
): Promise<TrelloCard> {
  return trelloRequest<TrelloCard>("/cards", {
    method: "POST",
    body: JSON.stringify({
      idList: workoutListId,
      name: `${input.date} - ${input.exerciseName}`,
      desc: `Exercício: ${input.exerciseName}\nCarga: ${input.load}\nReps: ${input.reps}\nSéries: ${input.sets}\nData: ${input.date}`,
    }),
  });
}

export async function checkAndUpdatePR(
  exerciseCard: TrelloCard,
  prListId: string,
  cardToMoveId: string,
  workout: { load: number; reps: number; sets: number; date: string }
): Promise<{ isPR: boolean; updated: ExerciseProgress; deltaLoad: number }> {
  const parsed = parseExerciseDescription(exerciseCard.id, exerciseCard.name, exerciseCard.desc);
  const previousLast = parsed.lastLoad ?? 0;
  const entry = { date: workout.date, load: workout.load, reps: workout.reps, sets: workout.sets };

  const updated: ExerciseProgress = {
    ...parsed,
    lastLoad: workout.load,
    lastReps: workout.reps,
    lastSets: workout.sets,
    lastDate: workout.date,
    history: [entry, ...parsed.history].slice(0, 5),
  };

  const isPR = isPersonalRecord(parsed.prLoad, parsed.prReps, workout.load, workout.reps);
  if (isPR) {
    updated.prLoad = workout.load;
    updated.prReps = workout.reps;
  }

  await updateExerciseCard(exerciseCard.id, formatExerciseDescription(updated));

  if (isPR) {
    await trelloRequest(`/cards/${cardToMoveId}`, {
      method: "PUT",
      body: JSON.stringify({
        idList: prListId,
      }),
    });
  }

  return {
    isPR,
    updated,
    deltaLoad: Number((workout.load - previousLast).toFixed(2)),
  };
}

export async function getOrCreateExercise(exerciseListId: string, exerciseName: string): Promise<TrelloCard> {
  const existing = await findExerciseCardByName(exerciseListId, exerciseName);
  if (existing) return existing;
  return createExerciseCard(exerciseListId, exerciseName);
}

export async function listExercises(listId: string): Promise<ExerciseProgress[]> {
  const cards = await getCardsByListId(listId);
  return cards.map((card) => parseExerciseDescription(card.id, card.name, card.desc));
}

function getMostImproved(exercises: ExerciseProgress[]): DashboardData["mostImprovedExercise"] {
  const ranked = exercises
    .map((exercise) => {
      if (exercise.history.length < 2) return null;
      const latest = exercise.history[0].load;
      const oldest = exercise.history[exercise.history.length - 1].load;
      return {
        exerciseName: exercise.name,
        delta: Number((latest - oldest).toFixed(2)),
      };
    })
    .filter((item): item is { exerciseName: string; delta: number } => item !== null)
    .sort((a, b) => b.delta - a.delta);

  return ranked[0] ?? null;
}

export async function getDashboardData(): Promise<DashboardData> {
  const { lists } = await bootstrapBoard();
  const [exercises, workouts, prs] = await Promise.all([
    listExercises(lists.exercises),
    getCardsByListId(lists.workouts),
    getCardsByListId(lists.prs),
  ]);

  const today = todayIso();
  const allWorkoutLikeCards = [...workouts, ...prs];

  const workoutsThisWeek = allWorkoutLikeCards.filter((card) => {
    const date = card.name.slice(0, 10);
    return /^\d{4}-\d{2}-\d{2}$/.test(date) && isSameWeek(today, date);
  }).length;

  const parsedWorkoutDates = allWorkoutLikeCards
    .map((card) => card.name.slice(0, 10))
    .filter((date) => /^\d{4}-\d{2}-\d{2}$/.test(date));

  const lastPRCard = prs
    .slice()
    .sort((a, b) => new Date(b.dateLastActivity).getTime() - new Date(a.dateLastActivity).getTime())[0];

  const lastPRMatch = lastPRCard?.desc.match(/Exercício:\s*(.+)\nCarga:\s*([0-9.,]+)\nReps:\s*(\d+)(?:\nSéries:\s*\d+)?\nData:\s*(\d{4}-\d{2}-\d{2})/);

  const chart = exercises.flatMap((exercise) =>
    exercise.history.map((entry) => ({
      date: entry.date,
      exerciseName: exercise.name,
      load: entry.load,
      volume: volume(entry),
    }))
  );

  chart.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return {
    workoutsThisWeek,
    weeklyStreak: calculateWeeklyStreak(parsedWorkoutDates),
    lastPR: lastPRMatch
      ? {
          exerciseName: lastPRMatch[1],
          load: Number(lastPRMatch[2].replace(",", ".")),
          reps: Number(lastPRMatch[3]),
          date: lastPRMatch[4],
        }
      : null,
    mostImprovedExercise: getMostImproved(exercises),
    chart: chart.slice(-20),
  };
}

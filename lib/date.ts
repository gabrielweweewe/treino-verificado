export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function startOfWeek(date: Date): Date {
  const copy = new Date(date);
  const day = copy.getDay();
  const distance = day === 0 ? -6 : 1 - day;
  copy.setDate(copy.getDate() + distance);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

export function isSameWeek(dateA: string, dateB: string): boolean {
  const a = startOfWeek(new Date(`${dateA}T00:00:00`));
  const b = startOfWeek(new Date(`${dateB}T00:00:00`));
  return a.getTime() === b.getTime();
}

export function calculateWeeklyStreak(workoutDates: string[]): number {
  if (workoutDates.length === 0) return 0;

  const uniqueWeeks = new Set<number>();
  for (const date of workoutDates) {
    uniqueWeeks.add(startOfWeek(new Date(`${date}T00:00:00`)).getTime());
  }

  const sorted = Array.from(uniqueWeeks).sort((a, b) => b - a);
  if (sorted.length === 0) return 0;

  let streak = 0;
  let current = startOfWeek(new Date()).getTime();

  for (const week of sorted) {
    if (week === current) {
      streak += 1;
      current -= 7 * 24 * 60 * 60 * 1000;
      continue;
    }
    if (streak === 0 && week === current - 7 * 24 * 60 * 60 * 1000) {
      streak += 1;
      current = week - 7 * 24 * 60 * 60 * 1000;
      continue;
    }
    break;
  }

  return streak;
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
  );
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function currentPeriod(): 'morning' | 'evening' {
  return new Date().getHours() < 15 ? 'morning' : 'evening';
}

export function formatRelative(iso: string): string {
  const then = new Date(iso).getTime();
  const diffMs = Date.now() - then;
  const minute = 60000;
  const hour = 3600000;
  const day = 86400000;

  if (diffMs < minute) return 'Just now';
  if (diffMs < hour) {
    const mins = Math.floor(diffMs / minute);
    return `${mins} min${mins > 1 ? 's' : ''} ago`;
  }
  if (diffMs < day) {
    const hours = Math.floor(diffMs / hour);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  }
  const days = Math.floor(diffMs / day);
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  return formatDate(iso);
}

export function computeStreak(checkInDates: string[]): number {
  const days = new Set(checkInDates.map((iso) => new Date(iso).toDateString()));
  const cursor = new Date();
  if (!days.has(cursor.toDateString())) {
    cursor.setDate(cursor.getDate() - 1);
  }
  let streak = 0;
  while (days.has(cursor.toDateString())) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export function startOfWeek(from: Date = new Date()): Date {
  const date = new Date(from);
  const day = date.getDay();
  date.setDate(date.getDate() - day);
  date.setHours(0, 0, 0, 0);
  return date;
}

/**
 * Pure click-counter logic, kept free of chrome APIs so it can be unit-tested
 * directly. The background worker persists the value; these helpers only
 * compute it.
 */

/** Largest value the badge can show before it switches to "99+". */
export const BADGE_MAX = 99

/** Next counter value. Never goes negative; missing/garbage input resets to 0. */
export const nextCount = (current: number): number => {
  if (!Number.isFinite(current) || current < 0) return 1
  return Math.floor(current) + 1
}

/** Render a count for the toolbar badge (Chrome truncates long badge text). */
export const formatBadgeText = (count: number): string => {
  if (!Number.isFinite(count) || count <= 0) return ''
  if (count > BADGE_MAX) return `${BADGE_MAX}+`
  return String(Math.floor(count))
}

import { describe, expect, it } from 'vitest'
import { BADGE_MAX, formatBadgeText, nextCount } from './counter'

describe('nextCount', () => {
  it('increments a normal value', () => {
    expect(nextCount(0)).toBe(1)
    expect(nextCount(41)).toBe(42)
  })

  it('floors fractional input', () => {
    expect(nextCount(2.9)).toBe(3)
  })

  it('resets invalid or negative input to 1', () => {
    expect(nextCount(-5)).toBe(1)
    expect(nextCount(Number.NaN)).toBe(1)
    expect(nextCount(Number.POSITIVE_INFINITY)).toBe(1)
  })
})

describe('formatBadgeText', () => {
  it('renders positive counts', () => {
    expect(formatBadgeText(1)).toBe('1')
    expect(formatBadgeText(BADGE_MAX)).toBe('99')
  })

  it('caps large counts at "99+"', () => {
    expect(formatBadgeText(BADGE_MAX + 1)).toBe('99+')
    expect(formatBadgeText(1000)).toBe('99+')
  })

  it('renders an empty badge for zero or invalid input', () => {
    expect(formatBadgeText(0)).toBe('')
    expect(formatBadgeText(-1)).toBe('')
    expect(formatBadgeText(Number.NaN)).toBe('')
  })
})

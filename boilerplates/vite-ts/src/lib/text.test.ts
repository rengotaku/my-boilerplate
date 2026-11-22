import { describe, expect, it } from 'vitest'
import { countWords, normalizeWhitespace } from './text'

describe('text', () => {
  // ケース 1: 正常な入力
  it('空白を畳んで語数を数える', () => {
    expect(normalizeWhitespace('  hello   world\n')).toBe('hello world')
    expect(countWords('  hello   world\n')).toBe(2)
  })

  // ケース 2: 空入力
  it('空文字なら語数は 0', () => {
    expect(normalizeWhitespace('')).toBe('')
    expect(countWords('')).toBe(0)
  })
})

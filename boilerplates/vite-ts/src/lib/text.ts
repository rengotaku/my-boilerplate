/**
 * 連続する空白（タブ・改行を含む）を 1 つの半角スペースに畳み、
 * 前後の空白を取り除く。
 */
export function normalizeWhitespace(text: string): string {
  return text.trim().replace(/\s+/g, ' ')
}

/**
 * 空白区切りの語数を数える。空文字（または空白だけ）なら 0 を返す。
 */
export function countWords(text: string): number {
  const normalized = normalizeWhitespace(text)
  if (normalized === '') {
    return 0
  }
  return normalized.split(' ').length
}

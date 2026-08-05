// 外部導線 URL / 問い合わせ先を1箇所に集約する設定モジュール。
//
// LP のセクション・ページ側は、CTA の href をここから import して組み立てる。
// URL・メールアドレスの直書きはこのファイルに閉じ、他ファイルに広げないこと。

/** 導線1件の到達可否を判別可能にする型。 */
export type LinkEntry = { status: "ready"; href: string } | { status: "preparing" };

const contactEmail = "contact@example.com";

export const links = {
  /**
   * 問い合わせ導線の例。初期値は mailto。外部フォーム等の URL が確定したら
   * href を差し替える。
   */
  contact: {
    status: "ready",
    href: `mailto:${contactEmail}`,
  } satisfies LinkEntry,
  /**
   * URL が未確定の導線の例。外部プラットフォーム（note / Booth / Google Forms 等）の
   * URL が決まるまで `preparing` にしておき、確定したら `{ status: "ready", href }` に
   * 差し替える（呼び出し側は `resolveHref` 経由で href の有無を判定するため、この型を
   * 変更するだけで UI 側の非活性表示が自動的に切り替わる）。
   */
  newsletter: { status: "preparing" } satisfies LinkEntry,
  /** 問い合わせ先メールアドレス（フッター等で表示用に参照する）。 */
  contactEmail,
} as const;

/**
 * `LinkEntry` から実際に遷移可能な href を取り出す。
 * `preparing` の場合は `undefined` を返し、呼び出し側（CTA ボタン等）が非活性表示にする。
 */
export function resolveHref(entry: LinkEntry): string | undefined {
  return entry.status === "ready" ? entry.href : undefined;
}

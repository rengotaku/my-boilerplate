/**
 * 実在する内部パスの一覧（ワイルドカード "*" の 404 フォールバックを除く）。
 *
 * src/router.tsx の Route 定義、scripts/prerender.mjs のプリレンダ対象、
 * scripts/verify-prerender.mjs の検証対象が単一ソースとして参照する。
 * 新しい Route を追加したら、ここにも必ずパスを追記すること。
 *
 * react-refresh の "only export components" 制約により、コンポーネントを含む
 * src/router.tsx から定数のみを分離している。
 */
export const KNOWN_PATHS = ["/", "/privacy"] as const;

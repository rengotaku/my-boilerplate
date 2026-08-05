/**
 * プライバシーポリシーページ（プレースホルダ）。
 *
 * scaffold 直後の内容はダミーの運営者情報・記載内容。実際に公開する前に、運営者名・
 * 連絡先・個人情報の取得方法・Cookie/アクセス解析の利用状況など、サイトの実装・運用
 * 実態に合わせて本文をすべて書き換えること（事実と異なる記載を残したまま公開しないこと）。
 */
const OPERATOR_NAME = "Your Company Name";
const CONTACT_EMAIL = "contact@example.com";
const ENACTED_ON = "YYYY-MM-DD";

export function PrivacyPage() {
  return (
    <section>
      <div className="mx-auto max-w-3xl px-4 py-16 md:px-6 md:py-20">
        <h1 className="text-2xl font-black tracking-tight text-foreground md:text-3xl">
          プライバシーポリシー
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">制定日: {ENACTED_ON}</p>

        <div className="mt-10 space-y-10 text-sm leading-relaxed text-foreground md:text-base">
          <div>
            <h2 className="text-lg font-bold text-foreground md:text-xl">運営者</h2>
            <p className="mt-3 text-muted-foreground">{OPERATOR_NAME}</p>
          </div>

          <div>
            <h2 className="text-lg font-bold text-foreground md:text-xl">
              個人情報の取得について
            </h2>
            <p className="mt-3 text-muted-foreground">
              当サイトが個人情報を取得する方法・目的をここに記載してください（例:
              問い合わせフォーム、メール受信、Cookie による自動収集の有無など）。
            </p>
          </div>

          <div>
            <h2 className="text-lg font-bold text-foreground md:text-xl">
              Cookie・アクセス解析について
            </h2>
            <p className="mt-3 text-muted-foreground">
              Cookie
              を用いたアクセス解析ツールを導入している場合はここに明記してください。
              未導入の場合はその旨を記載してください。
            </p>
          </div>

          <div>
            <h2 className="text-lg font-bold text-foreground md:text-xl">お問い合わせ</h2>
            <p className="mt-3 text-muted-foreground">
              個人情報の取扱いに関するお問い合わせは、下記メールアドレスまでご連絡ください。
            </p>
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="mt-2 inline-block font-medium text-foreground underline underline-offset-4 transition-colors hover:text-muted-foreground"
            >
              {CONTACT_EMAIL}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

// The privacy policy: what this site receives, what it is used for, and where it
// goes. Content lives in the repo (not the CMS), so it only changes on deploy. The
// page (pages/privacy.astro) and its Markdown twin (lib/build-privacy-markdown) both
// render from this one source.

export type PrivacyServiceRow = {
  service: string;
  purpose: string;
  data: string;
};

export type PrivacyServiceColumns = Readonly<Record<keyof PrivacyServiceRow, string>>;

export type PrivacyBlock =
  | { kind: 'paragraph'; text: string }
  | { kind: 'list'; items: readonly string[] }
  | { kind: 'table'; caption: string; columns: PrivacyServiceColumns; rows: readonly PrivacyServiceRow[] }
  // A sentence that carries the contact address as a mailto link.
  | { kind: 'mail'; before: string; address: string; after: string };

export type PrivacySection = {
  no: string;
  heading: string;
  // The `// …?` subtitle shown in the SectionHeading `more` slot.
  question: string;
  blocks: readonly PrivacyBlock[];
};

export type PrivacyContent = {
  title: string;
  kicker: string;
  lead: string;
  // The page's meta description (SEO).
  description: string;
  lastUpdatedLabel: string;
  // ISO `YYYY-MM-DD`, rendered into <time datetime>.
  lastUpdated: string;
  sections: readonly PrivacySection[];
};

export const privacy = {
  title: 'privacy',
  kicker: '// 個人情報のこと',
  lead: 'このサイトで受け取る情報と、その使いみち。',
  description: 'このサイトで受け取る情報と、その使いみち。',
  lastUpdatedLabel: 'last updated',
  lastUpdated: '2026-11-16',
  sections: [
    {
      no: '01',
      heading: 'collected',
      question: '// 何を受け取る？',
      blocks: [
        { kind: 'paragraph', text: '受け取るのは、お問い合わせフォームに書いてもらった内容だけです。' },
        { kind: 'list', items: ['お名前', 'メールアドレス', '本文'] },
        { kind: 'paragraph', text: '会員登録やログインはありません。' },
      ],
    },
    {
      no: '02',
      heading: 'purpose',
      question: '// 何に使う？',
      blocks: [
        {
          kind: 'paragraph',
          text: '受け取った内容はお問い合わせへの返信と、そのあとのやりとりにだけ使います。広告やメールマガジンには使いません。法律で求められたとき以外は、同意なしにほかの人へ渡すこともありません。',
        },
      ],
    },
    {
      no: '03',
      heading: 'third parties',
      question: '// どこに送られる？',
      blocks: [
        {
          kind: 'table',
          caption: 'サイトを動かすために、次のサービスを使っています。',
          columns: { service: 'サービス', purpose: '何のため', data: '送られるもの' },
          rows: [
            { service: 'Cloudflare Turnstile', purpose: '送信したのが人かどうかを確かめる', data: 'ブラウザと端末の情報' },
            { service: 'Resend', purpose: 'フォームの内容をぼくにメールで届ける', data: 'お名前、メールアドレス、本文' },
            { service: 'Discord', purpose: '新しいお問い合わせをぼくに知らせる', data: 'お名前、メールアドレス、本文（ぼく専用の非公開チャンネル）' },
            { service: 'Cloudflare Web Analytics', purpose: '閲覧数を数えて、サイトを良くする', data: '個人を特定しない集計データ' },
          ],
        },
      ],
    },
    {
      no: '04',
      heading: 'cookies',
      question: '// Cookie は？',
      blocks: [{ kind: 'paragraph', text: 'トラッキングや広告のための Cookie は使っていません。広告も出していません。' }],
    },
    {
      no: '05',
      heading: 'contact',
      question: '// 消してほしいときは？',
      blocks: [
        {
          kind: 'mail',
          before: '送った内容を消したいときや直したいとき、聞きたいことがあるときは、',
          address: 'contact@napochaan.com',
          after: ' に連絡してください。',
        },
      ],
    },
  ],
} as const satisfies PrivacyContent;

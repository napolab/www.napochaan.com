import * as s from './styles.css';

import { PageHeader } from '@components/page-header';
import { RichText } from '@components/rich-text';
import { formatJapaneseDate } from '@utils/format-japanese-date';

import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical';

type Props = {
  title: string;
  effectiveAt: string;
  body: SerializedEditorState;
};

// `/legal` の一覧ページは持たないため、パンくずは 2 階層。中間に legal クラムを置くと
// 存在しないページへのリンクになる(Breadcrumbs は最後以外を必ず Link で描画する)。
// 配列は inline JSX prop にしない(react-perf/jsx-no-new-array-as-prop)。
const buildCrumbs = (title: string) => [{ href: '/', label: 'home' }, { label: title }];

export const LegalDocumentView = ({ title, effectiveAt, body }: Props) => {
  const crumbs = buildCrumbs(title);
  // Payload の date フィールドは ISO タイムスタンプで返る。datetime 属性は暦日だけを載せる。
  const isoDay = effectiveAt.slice(0, 10);

  return (
    <>
      <PageHeader title={title} breadcrumbs={crumbs} titleTracking="tight" />
      {/* The page <h1> lives in PageHeader, so this renders no heading. */}
      <article className={s.body} aria-label="法務文書本文">
        <RichText data={body} />
        <footer className={s.footer}>
          <time className={s.effectiveAt} dateTime={isoDay}>
            {`${formatJapaneseDate(effectiveAt)} 施行`}
          </time>
        </footer>
      </article>
    </>
  );
};

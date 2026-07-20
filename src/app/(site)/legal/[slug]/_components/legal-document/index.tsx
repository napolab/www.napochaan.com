import * as s from './styles.css';

import { PageHeader } from '@components/page-header';
import { RichText } from '@components/rich-text';
import { dayjs } from '@utils/dayjs';
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
  // Payload の date フィールドは UTC インスタントで返る。datetime 属性は表示テキスト
  // (formatJapaneseDate、同じく Asia/Tokyo 変換)と同じ JST 暦日にする — 素の UTC スライスだと
  // 1 日ズレる(dayjs-timezone.md)。
  const isoDay = dayjs(effectiveAt).tz('Asia/Tokyo').format('YYYY-MM-DD');

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

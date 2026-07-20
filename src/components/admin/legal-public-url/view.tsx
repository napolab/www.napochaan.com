type Props = {
  slug: string;
  origin: string;
};

// admin サイドバーに公開 URL({origin}/legal/{slug})をクリック可能リンクで表示する純粋
// コンポーネント。origin は現環境の window.location.origin(admin と site は同一オリジン)。
// slug 未入力時はリンクを出さずプレースホルダ文言のみ。データ取得は wrapper(index.tsx)側。
export const LegalPublicURLView = ({ slug, origin }: Props) => {
  if (slug === '') {
    return <p className="field-description">slug を入力すると公開 URL が表示されます。</p>;
  }

  const href = `${origin}/legal/${slug}`;

  return (
    <div>
      <p className="field-label">公開 URL</p>
      <a href={href} target="_blank" rel="noreferrer">
        {href}
      </a>
    </div>
  );
};

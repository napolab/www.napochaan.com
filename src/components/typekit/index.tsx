type Props = {
  id: string;
};

export const OptimizeTypeKit = async ({ id }: Props) => {
  const url = `https://use.typekit.net/${id}.css`;
  const res = await fetch(url);
  const css = await res.text();

  return <style dangerouslySetInnerHTML={{ __html: css }} />;
};

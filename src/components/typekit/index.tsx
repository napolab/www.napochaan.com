type Props = {
  projectId: string;
};

export const OptimizeTypeKit = async ({ projectId }: Props) => {
  const url = `https://use.typekit.net/${projectId}.css`;
  const res = await fetch(url);
  const css = await res.text();

  return <style dangerouslySetInnerHTML={{ __html: css }} />;
};

type Props = {
  projectId: string;
};

const ts = Date.now();
export const OptimizeTypeKit = async ({ projectId }: Props) => {
  const url = `https://use.typekit.net/${projectId}.css?ts=${ts}`;
  const res = await fetch(url);
  const css = await res.text();

  return <style dangerouslySetInnerHTML={{ __html: css }} />;
};

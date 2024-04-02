type Props = {
  projectId: string;
};

export const OptimizeTypeKit = async ({ projectId }: Props) => {
  const url = `https://use.typekit.net/${projectId}.css?ts=${Date.now()}`;
  const res = await fetch(url, {
    next: {
      revalidate: 3600,
    },
  });
  const css = await res.text();

  return <style dangerouslySetInnerHTML={{ __html: css }} />;
};

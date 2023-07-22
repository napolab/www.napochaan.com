export const cloudflareImages = (id: string) => {
  const baseURL = `https://imagedelivery.net/TQ7GECK3x8OMl8rY8WdOxQ/${id}`;

  return {
    src: `${baseURL}/800x800`,
    srcSet: `${baseURL}/400x400 800w, ${baseURL}/800x800 1600w`,
    sizes: "(max-width: 1080px) 100vw, 1080px",
  };
};

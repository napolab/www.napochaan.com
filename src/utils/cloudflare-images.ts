export const cloudflareImages = (id: string) => {
  const baseURL = `https://imagedelivery.net/TQ7GECK3x8OMl8rY8WdOxQ/${id}`;

  return {
    src: `${baseURL}/1600x1600`,
    srcSet: `${baseURL}/800x800 800w, ${baseURL}/1600x1600 1600w`,
    sizes: "(max-width: 1080px) 100vw, 1080px",
  };
};

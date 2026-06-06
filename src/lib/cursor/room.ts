export const pathToRoom = (pathname: string): string => {
  const slug = pathname.replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  return slug === '' ? 'root' : slug;
};

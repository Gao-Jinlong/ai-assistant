export const getLocale = () => {
  const pathname = window.location.pathname;
  const match = pathname.match(/^\/([a-z]{2}(?:-[a-z]{2})?)(\/|$)/i);
  if (match) {
    return match[1];
  }
  return 'zh';
};

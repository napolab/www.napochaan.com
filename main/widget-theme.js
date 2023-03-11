(function () {
  const storageKey = 'theme';
  const classNameDark = 'dark';

  function setClassOnDocumentBody() {
    const html = document.getElementsByTagName('html')[0];
    html.classList.add(classNameDark);
  }

  const preferDarkQuery = '(prefers-color-scheme: dark)';
  const mql = window.matchMedia(preferDarkQuery);
  const supportsColorSchemeQuery = mql.media === preferDarkQuery;
  let localStorageTheme = null;
  try {
    localStorageTheme = JSON.parse(window.localStorage.getItem(storageKey));
  } catch (err) {}
  const localStorageExists = localStorageTheme !== null;

  if (localStorageExists) {
    if (localStorageTheme === classNameDark) {
      setClassOnDocumentBody();
    }
  } else if (supportsColorSchemeQuery) {
    setClassOnDocumentBody();
    window.localStorage.setItem(storageKey, JSON.stringify(classNameDark));
  }
})();
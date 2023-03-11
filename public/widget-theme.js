function widgetTheme() {
  try {
    const d = document.documentElement.classList;
    d.remove("light", "dark");
    const e = window.localStorage.getItem("theme");
    if (e === "system" || !e) {
      const t = "(prefers-color-scheme: dark)";
      const m = window.matchMedia(t);

      m.media !== t || m.matches ? d.add("dark") : d.add("light");
    } else if (e) {
      d.add(JSON.parse(e));
    }
  } catch (e) {}
}

widgetTheme();

export const addRootClass = (className: string, add = true) => {
  const cl = document.documentElement.classList;
  const hasClass = cl.contains(className);
  if (!hasClass && add !== false) {
    cl.add(className);
  } else if (hasClass && add === false) {
    cl.remove(className);
  }
};

export const removeRootClass = (className: string) => {
  addRootClass(className, false);
};

export const exitFullScreen = () => {
  if (document.exitFullscreen) {
    document.exitFullscreen();
    removeRootClass("fullscreen-widget");
  }
};

export const toggleFullScreen = (element: HTMLElement) => {
  if (!document.fullscreenElement) {
    element.requestFullscreen();
    addRootClass("fullscreen-widget");
  } else {
    exitFullScreen();
  }
};

export const toggleWidgetFullscreen = () => {
  const elem = document.getElementById("psychometric-widget");
  if (elem instanceof HTMLElement) {
    toggleFullScreen(elem);
  }
};

export const fetchSurveyEnabledSurveyModes = (): string[] => {
  const elem = document.getElementById("psychometric-widget");
  const enabled: string[] = [];
  if (elem instanceof HTMLElement) {
    enabled.pop();
    if (elem.classList.contains("show-jungian")) {
      enabled.push("jungian");
    }
    if (elem.classList.contains("show-big5") || enabled.length < 1) {
      enabled.push("big5");
    }
  }
  return enabled;
};

/* export const applyShadowRoot = () => {
  const elem = document.getElementById("psychometric-widget");
  elem.sh;
}; */

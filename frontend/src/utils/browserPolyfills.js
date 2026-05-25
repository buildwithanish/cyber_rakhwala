const createMediaQueryListStub = (query) => {
  const listeners = new Set();

  const mediaQueryList = {
    media: query,
    matches: false,
    onchange: null,
    addListener: (listener) => {
      if (typeof listener === 'function') {
        listeners.add(listener);
      }
    },
    removeListener: (listener) => {
      listeners.delete(listener);
    },
    addEventListener: (event, listener) => {
      if (event === 'change' && typeof listener === 'function') {
        listeners.add(listener);
      }
    },
    removeEventListener: (event, listener) => {
      if (event === 'change') {
        listeners.delete(listener);
      }
    },
    dispatchEvent: (event) => {
      listeners.forEach((listener) => listener(event));
      if (typeof mediaQueryList.onchange === 'function') {
        mediaQueryList.onchange(event);
      }
      return true;
    }
  };

  return mediaQueryList;
};

const ensureMatchMedia = () => {
  if (typeof window === 'undefined') {
    return;
  }

  const originalMatchMedia =
    typeof window.matchMedia === 'function' ? window.matchMedia.bind(window) : null;

  window.matchMedia = (query) => {
    const result = originalMatchMedia ? originalMatchMedia(query) : null;
    const mediaQueryList = result || createMediaQueryListStub(query);

    if (typeof mediaQueryList.addListener !== 'function') {
      mediaQueryList.addListener = (listener) => {
        if (typeof mediaQueryList.addEventListener === 'function') {
          mediaQueryList.addEventListener('change', listener);
        }
      };
    }

    if (typeof mediaQueryList.removeListener !== 'function') {
      mediaQueryList.removeListener = (listener) => {
        if (typeof mediaQueryList.removeEventListener === 'function') {
          mediaQueryList.removeEventListener('change', listener);
        }
      };
    }

    return mediaQueryList;
  };
};

ensureMatchMedia();

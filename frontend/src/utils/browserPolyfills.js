const createSafeMediaQueryList = (query, nativeResult = null) => {
  const listeners = new Set();

  const addListener = (listener) => {
    if (typeof listener === 'function') {
      listeners.add(listener);
    }
  };

  const removeListener = (listener) => {
    listeners.delete(listener);
  };

  const mediaQueryList = {
    media:
      typeof nativeResult?.media === 'string' && nativeResult.media.trim()
        ? nativeResult.media
        : String(query || ''),
    matches: Boolean(nativeResult?.matches),
    onchange: null,
    addListener,
    removeListener,
    addEventListener: (event, listener) => {
      if (event === 'change') {
        addListener(listener);
      }
    },
    removeEventListener: (event, listener) => {
      if (event === 'change') {
        removeListener(listener);
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

  if (nativeResult && typeof nativeResult.addEventListener === 'function') {
    mediaQueryList.addListener = (listener) => {
      if (typeof listener === 'function') {
        nativeResult.addEventListener('change', listener);
      }
    };
    mediaQueryList.removeListener = (listener) => {
      if (typeof listener === 'function') {
        nativeResult.removeEventListener?.('change', listener);
      }
    };
    mediaQueryList.dispatchEvent = (...args) =>
      typeof nativeResult.dispatchEvent === 'function'
        ? nativeResult.dispatchEvent(...args)
        : true;
  } else if (nativeResult && typeof nativeResult.addListener === 'function') {
    mediaQueryList.addListener = (listener) => {
      if (typeof listener === 'function') {
        nativeResult.addListener(listener);
      }
    };
    mediaQueryList.removeListener = (listener) => {
      if (typeof listener === 'function') {
        nativeResult.removeListener?.(listener);
      }
    };
  }

  return mediaQueryList;
};

const ensureMatchMedia = () => {
  if (typeof window === 'undefined') {
    return;
  }

  const originalMatchMedia =
    typeof window.matchMedia === 'function' ? window.matchMedia.bind(window) : null;

  const safeMatchMedia = (query) => {
    try {
      const nativeResult = originalMatchMedia ? originalMatchMedia(query) : null;
      return createSafeMediaQueryList(query, nativeResult);
    } catch {
      return createSafeMediaQueryList(query, null);
    }
  };

  const lockProperty = (target, key, value) => {
    if (!target) return;
    try {
      Object.defineProperty(target, key, {
        configurable: false,
        enumerable: true,
        writable: false,
        value
      });
    } catch {
      target[key] = value;
    }
  };

  lockProperty(window, 'matchMedia', safeMatchMedia);
  lockProperty(window, '__cyberSafeMatchMedia', safeMatchMedia);

  if (typeof globalThis !== 'undefined') {
    lockProperty(globalThis, 'matchMedia', safeMatchMedia);
  }

  if (typeof self !== 'undefined') {
    lockProperty(self, 'matchMedia', safeMatchMedia);
  }

  if (typeof window.MediaQueryList !== 'undefined') {
    const prototype = window.MediaQueryList?.prototype;
    if (prototype && typeof prototype.addListener !== 'function') {
      prototype.addListener = function addListener(listener) {
        return this.addEventListener?.('change', listener);
      };
    }
    if (prototype && typeof prototype.removeListener !== 'function') {
      prototype.removeListener = function removeListener(listener) {
        return this.removeEventListener?.('change', listener);
      };
    }
  }
};

ensureMatchMedia();

import { noop } from 'lib/utils';
import { useEffect, useRef } from 'react';
import { transitionEvent, animationEvent } from '../lib/supportEvents';

export const useWaitEvent = (mode: 'transition' | 'animation', cb, element, durationFallback) => {
  useLayoutEffect(() => {
    if (!element || !cb) {
      return noop;
    }
    if (transitionEvent.supported) {
      element.addEventListener(transitionEvent.name, cb);
      return () => element.removeEventListener(transitionEvent.name, cb);
    }
    const timeout = setTimeout(cb, durationFallback);
    return () => clearTimeout(timeout);
  }, [cb, element]);

  return {
    waitTransitionFinish,
  };
};

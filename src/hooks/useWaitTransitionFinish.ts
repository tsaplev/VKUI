import { useCallback } from 'react';
import { transitionEvent } from '../lib/supportEvents';
import { useEventListener } from './useEventListener';
import { useTimeout } from './useTimeout';

export const useWaitTransitionFinish = (cb: () => void, durationFallback: number) => {
  const fallbackTimeout = useTimeout(cb, durationFallback);
  const transitionObserver = useEventListener(transitionEvent.name, cb);

  const on = useCallback((el: HTMLElement) => {
    if (!el) {
      return;
    }
    if (transitionEvent.supported) {
      transitionObserver.add(el);
    } else {
      fallbackTimeout.set();
    }
  }, []);

  return { on };
};

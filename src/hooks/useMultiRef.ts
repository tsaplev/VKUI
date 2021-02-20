import { Ref, useRef } from 'react';
import { useIsomorphicLayoutEffect } from '../lib/useIsomorphicLayoutEffect';
import { setRef } from '../lib/utils';

export function useMultiRef<RefType = HTMLElement>(...refs: Array<Ref<RefType>>) {
  const ref = useRef<RefType>(null);
  useIsomorphicLayoutEffect(() => {
    refs.forEach((parentRef) => setRef(ref.current, parentRef));
  }, refs);
  return ref;
};

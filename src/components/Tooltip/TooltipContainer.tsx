import React, { createContext, forwardRef, HtmlHTMLAttributes, useMemo, useState } from 'react';
import { multiRef } from '../../lib/utils';

export const TooltipContainerContext = createContext({
  container: null as (HTMLElement | null),
  fixed: false,
});

export const TooltipContainer = forwardRef<
HTMLDivElement,
HtmlHTMLAttributes<HTMLDivElement> & { fixed?: boolean }
>(({ fixed = false, ...props }, ref) => {
  const [container, setContainer] = useState<HTMLDivElement>(null);
  const containerRef = useMemo(() => multiRef(ref, setContainer as any), [ref]);
  return (
    <div {...props} ref={containerRef}>
      <TooltipContainerContext.Provider value={useMemo(() => ({ container, fixed }), [container, fixed])}>
        {props.children}
      </TooltipContainerContext.Provider>
    </div>
  );
});

TooltipContainer.displayName = 'TooltipContainer';

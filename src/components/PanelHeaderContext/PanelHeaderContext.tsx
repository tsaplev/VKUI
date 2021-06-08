import { FC, HTMLAttributes, useRef, useState } from 'react';
import FixedLayout from '../FixedLayout/FixedLayout';
import { classNames } from '../../lib/classNames';
import { getClassName } from '../../helpers/getClassName';
import { animationEvent } from '../../lib/supportEvents';
import { withAdaptivity, AdaptivityProps, ViewWidth } from '../../hoc/withAdaptivity';
import { useDOM } from '../../lib/dom';
import { HasPlatform } from '../../types';
import { useIsomorphicLayoutEffect } from '../../lib/useIsomorphicLayoutEffect';
import { noop } from '../../lib/utils';

export interface PanelHeaderContextProps extends HTMLAttributes<HTMLDivElement>, HasPlatform, AdaptivityProps {
  opened: boolean;
  onClose: VoidFunction;
}

export interface PanelHeaderContextState {
  closing: boolean;
}

export const PanelHeaderContext: FC<PanelHeaderContextProps> = ({
  children,
  opened,
  onClose,
  platform,
  viewWidth,
  hasMouse,
  ...restProps
}) => {
  const { document } = useDOM();
  const [closing, setClosing] = useState(false);
  const elementRef = useRef<HTMLDivElement>();
  const animationFinishTimeout = useRef<ReturnType<typeof setTimeout>>();
  const isDesktop = viewWidth >= ViewWidth.SMALL_TABLET;

  useIsomorphicLayoutEffect(() => {
    if (!opened || !isDesktop) {
      return noop;
    }
    function onOuterClick(event: Event) {
      if (elementRef.current && !elementRef.current.contains(event.target as Node)) {
        onClose();
        document.removeEventListener('click', onOuterClick);
      }
    };
    document.addEventListener('click', onOuterClick);
    return () => document.removeEventListener('click', onOuterClick);
  }, [opened, isDesktop]);

  useIsomorphicLayoutEffect(() => {
    if (opened === false && !closing) {
      setClosing(true);
      waitAnimationFinish(elementRef.current, () => setClosing(false));
    }
  }, [opened]);

  function waitAnimationFinish(el: HTMLElement, eventHandler: VoidFunction) {
    if (!el) {
      return;
    }
    if (animationEvent.supported) {
      elementRef.current.removeEventListener(animationEvent.name, eventHandler);
      elementRef.current.addEventListener(animationEvent.name, eventHandler);
    } else {
      clearTimeout(animationFinishTimeout.current);
      animationFinishTimeout.current = setTimeout(eventHandler, 200);
    }
  };

  const baseClassNames = getClassName('PanelHeaderContext', platform);

  return (
    <FixedLayout {...restProps} vkuiClass={classNames(baseClassNames, {
      'PanelHeaderContext--opened': opened,
      'PanelHeaderContext--closing': closing,
      'PanelHeaderContext--desktop': isDesktop,
    })} vertical="top">
      <div vkuiClass="PanelHeaderContext__in" ref={elementRef}>
        <div vkuiClass="PanelHeaderContext__content">
          {(opened || closing) && children}
        </div>
      </div>
      {!isDesktop && (opened || closing) && <div onClick={onClose} vkuiClass="PanelHeaderContext__fade" />}
    </FixedLayout>
  );
};

PanelHeaderContext.defaultProps = {
  opened: false,
};

export default withAdaptivity(PanelHeaderContext, {
  viewWidth: true,
  hasMouse: true,
});

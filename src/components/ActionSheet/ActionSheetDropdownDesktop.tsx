import { FC, useMemo, CSSProperties, HTMLAttributes, RefObject } from 'react';
import { getClassName } from '../../helpers/getClassName';
import { classNames } from '../../lib/classNames';
import { useDOM } from '../../lib/dom';
import { usePlatform } from '../../hooks/usePlatform';
import { useAdaptivity } from '../../hooks/useAdaptivity';
import { useGlobalEventListener } from '../../hooks/useGlobalEventListener';
import { ActionSheetProps } from './ActionSheet';
import './ActionSheet.css';

interface Props extends HTMLAttributes<HTMLDivElement> {
  closing: boolean;
  onClose(): void;
  popupDirection?: ActionSheetProps['popupDirection'];
  toggleRef: Element;
  elementRef: RefObject<HTMLDivElement>;
}

export const ActionSheetDropdownDesktop: FC<Props> = ({
  children,
  elementRef,
  toggleRef,
  closing,
  popupDirection,
  onClose,
  ...restProps
}) => {
  const { window } = useDOM();
  const platform = usePlatform();
  const { sizeY } = useAdaptivity();

  const dropdownStyles = useMemo<CSSProperties>(() => {
    if (!toggleRef || !elementRef || !elementRef.current) {
      return {
        left: '0',
        top: '0',
        opacity: '0',
        pointerEvents: 'none',
      };
    }

    const toggleRect = toggleRef.getBoundingClientRect();
    const elementRect = elementRef.current.getBoundingClientRect();
    const isTop = popupDirection === 'top' || typeof popupDirection === 'function' && popupDirection(elementRef) === 'top';

    return {
      left: toggleRect.left + toggleRect.width - elementRect.width + window.pageXOffset,
      top: toggleRect.top + window.pageYOffset + (isTop ? -elementRect.height : toggleRect.height),
      opacity: 1,
      pointerEvents: 'auto',
    };
  }, [toggleRef, elementRef?.current]);

  useGlobalEventListener(window, 'click', (e) => {
    const dropdownElement = elementRef?.current;
    if (dropdownElement && !dropdownElement.contains(e.target as Node)) {
      onClose();
    }
  });

  return (
    <div
      {...restProps}
      ref={elementRef}
      onClick={(e) => e.stopPropagation()}
      style={dropdownStyles}
      vkuiClass={classNames(getClassName('ActionSheet', platform), 'ActionSheet--desktop', {
        'ActionSheet--closing': closing,
      }, `ActionSheet--sizeY-${sizeY}`)}
    >
      {children}
    </div>
  );
};

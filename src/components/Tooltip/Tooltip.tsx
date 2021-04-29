import React, { ReactElement, ReactNode, Fragment, isValidElement, FC, useLayoutEffect, useState, useMemo, useRef, useEffect } from 'react';
import { classNames } from '../../lib/classNames';
import { getClassName } from '../../helpers/getClassName';
import ReactDOM from 'react-dom';
import { useDOM } from '../../lib/dom';
import Subhead from '../Typography/Subhead/Subhead';
import { tooltipContainerAttr } from './TooltipContainer';
import { useExternRef } from '../../hooks/useExternRef';

interface TooltipPortalProps extends Partial<TooltipProps> {
  target?: HTMLElement;
}

const isDOMTypeElement = (element: ReactElement): element is React.DOMElement<any, any> => {
  return React.isValidElement(element) && typeof element.type === 'string';
};

const baseClassName = getClassName('Tooltip');

const TooltipPortal: FC<TooltipPortalProps> = ({
  target,
  header,
  text,
  offsetY,
  offsetX,
  alignX,
  alignY,
  cornerOffset,
  mode,
  onClose,
}) => {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const { document } = useDOM();
  /* eslint-disable no-restricted-properties */
  const fixedPortal = useMemo(() => target.closest(`[${tooltipContainerAttr}=fixed]`) != null, []);
  const portalTarget = useMemo(() => target.closest(`[${tooltipContainerAttr}]`), []);
  /* eslint-enable no-restricted-properties */
  const el = useRef();

  useEffect(() => {
    document.addEventListener('click', onClose);
    return () => document.removeEventListener('click', onClose);
  }, [onClose]);

  const getBoundingTargetRect = () => {
    const targetBounds = target.getBoundingClientRect();
    const portalBounds = portalTarget.getBoundingClientRect();

    return {
      width: targetBounds.width,
      height: targetBounds.height,
      x: targetBounds.left - portalBounds.left,
      y: targetBounds.top - portalBounds.top,
    };
  };

  useLayoutEffect(() => {
    const coords = getBoundingTargetRect();
    setPos({
      x: coords.x + offsetX + (alignX === 'right' ? coords.width - el.current.offsetWidth : 0),
      y: coords.y + (alignY === 'top' ? -el.current.offsetHeight - offsetY : coords.height + offsetY),
    });
  }, []);

  return ReactDOM.createPortal(
    <div vkuiClass={
      classNames(
        baseClassName,
        `Tooltip--x-${alignX}`,
        `Tooltip--y-${alignY}`,
        `Tooltip--${mode}`,
        {
          'Tooltip--fixed': fixedPortal,
        },
      )}>
      <div vkuiClass="Tooltip__container" style={{ top: pos.y, left: pos.x }} ref={el}>
        <div vkuiClass="Tooltip__corner" style={{ [alignX]: 20 + cornerOffset }} />
        <div vkuiClass="Tooltip__content">
          {header && <Subhead weight="semibold" vkuiClass="Tooltip__title">{header}</Subhead>}
          {text && <Subhead weight="regular" vkuiClass="Tooltip__text">{text}</Subhead>}
        </div>
      </div>
    </div>, portalTarget);
};

export interface TooltipProps {
  /**
   * **Важно**: если в `children` передан React-компонент, то необходимо убедиться в том, что он поддерживает
   * свойство `getRootRef`, которое должно возвращаться ссылку на корневой DOM-элемент компонента,
   * иначе тултип показан не будет. Если передан React-element, то такой проблемы нет.
   */
  children: ReactNode;
  mode: 'accent' | 'light';
  /**
   * Если передан `false`, то рисуется просто `children`.
   */
  isShown: boolean;
  /**
   * Текст тултипа.
   */
  text?: ReactNode;
  /**
   * Заголовок тултипа.
   */
  header?: ReactNode;
  /**
   * Положение по горизонтали (прижатие к левому или правому краю `children`).
   */
  alignX?: 'left' | 'right';
  /**
   * Положение по вертикали (расположение над или под `children`).
   */
  alignY?: 'top' | 'bottom';
  /**
   * Сдвиг по горизонтали (относительно портала, в котором рисуется тултип).
   */
  offsetX?: number;
  /**
   * Сдвиг по вертикали (относительно портала, в котором рисуется тултип).
   */
  offsetY?: number;
  /**
   * Сдвиг треугольника (относительно ширины тултипа).
   */
  cornerOffset?: number;
  /**
   * Callback, который вызывается при клике по любому месту в пределах экрана.
   */
  onClose(): void;
}

export interface TooltipState {
  ready: boolean;
}

function getChildrenRef(node?: ReactNode) {
  if (!isValidElement(node)) {
    return null;
  }
  return isDOMTypeElement(node) ? node.ref : node.props.getRootRef;
}

const Tooltip: FC<TooltipProps> = ({ children = null, isShown, ...portalProps }) => {
  const targetRef = useExternRef<HTMLElement>(getChildrenRef(children));

  const [isReady, setReady] = useState(false);
  useLayoutEffect(() => targetRef.current && setReady(true), []);

  const child = isValidElement(children) ? React.cloneElement(children, {
    [isDOMTypeElement(children) ? 'ref' : 'getRootRef']: targetRef,
  }) : children;

  if (!isShown || !isReady) {
    return child;
  }

  return (
    <Fragment>
      {child}
      <TooltipPortal {...portalProps} target={targetRef.current} />
    </Fragment>
  );
};

Tooltip.defaultProps = {
  offsetX: 0,
  offsetY: 15,
  alignX: 'left',
  alignY: 'bottom',
  cornerOffset: 0,
  isShown: true,
  mode: 'accent',
};

export default Tooltip;

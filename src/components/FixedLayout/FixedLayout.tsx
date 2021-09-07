import { FC, HTMLAttributes, useState, useContext, useEffect } from 'react';
import { getClassName } from '../../helpers/getClassName';
import { classNames } from '../../lib/classNames';
import { transitionEndEventName, TransitionStartEventDetail, transitionStartEventName } from '../View/View';
import { HasRef, HasRootRef } from '../../types';
import { usePanelContext } from '../Panel/usePanelContext';
import { SplitColContext } from '../SplitCol/SplitCol';
import { TooltipContainer } from '../Tooltip/TooltipContainer';
import { PanelContextProps } from '../Panel/PanelContext';
import { useDOM } from '../../lib/dom';
import { IOS } from '../../lib/platform';
import { warnOnce } from '../../lib/warnOnce';
import { usePlatform } from '../../hooks/usePlatform';
import { useGlobalEventListener } from '../../hooks/useGlobalEventListener';
import { useExternRef } from '../../hooks/useExternRef';
import './FixedLayout.css';

export interface FixedLayoutProps extends
  HTMLAttributes<HTMLDivElement>,
  HasRootRef<HTMLDivElement>,
  HasRef<HTMLDivElement> {
  vertical?: 'top' | 'bottom';
  /**
   * Это свойство определяет, будет ли фон компонента окрашен в цвет фона контента.
   * Это часто необходимо для фиксированных кнопок в нижней части экрана.
   */
  filled?: boolean;
}

export interface FixedLayoutState {
  position: 'absolute' | null;
  top: number;
  bottom: number;
  width: string;
}

const warn = warnOnce('FixedLayout');

const FixedLayout: FC<FixedLayoutProps & PanelContextProps> = ({
  children,
  style,
  vertical,
  getRootRef,
  getRef,
  filled,
  ...restProps
}) => {
  const [state, setState] = useState<FixedLayoutState>({
    position: 'absolute',
    top: null,
    bottom: null,
    width: '',
  });
  const { window, document } = useDOM();
  const platform = usePlatform();
  const { getPanelNode, panel } = usePanelContext();
  const currentPanel = getPanelNode();
  const splitCol = useContext(SplitColContext);

  const rootRef = useExternRef(getRootRef);

  if (process.env.NODE_ENV === 'development' && !currentPanel) {
    warn('Panel element not found');
  }

  const canTargetPanelScroll = () => {
    // Всегда предпологаем, что может быть скролл в случае, если нет document
    return !currentPanel || currentPanel.scrollHeight > currentPanel.clientHeight;
  };

  useEffect(doResize, []);

  useGlobalEventListener(window, 'resize', doResize);
  useGlobalEventListener(document, transitionStartEventName, (e: CustomEvent<TransitionStartEventDetail>) => {
    let panelScroll = e.detail.scrolls[panel] || 0;

    // support for unstable ViewInfinite
    if (Array.isArray(panelScroll)) {
      const scrolls = panelScroll as number[];
      panelScroll = scrolls[scrolls.length - 1];
    }

    const fromPanelHasScroll = panel === e.detail.from && panelScroll > 0;
    const toPanelHasScroll = panel === e.detail.to && panelScroll > 0;

    // если переход назад на Android - анимация только у панели с которой уходим (detail.from), и подстраиваться под скролл надо только на ней
    // на iOS переход между панелями горизонтальный, поэтому там нужно подстраивать хедеры на обеих панелях
    const panelAnimated = platform === IOS || !(panel === e.detail.to && e.detail.isBack);

    // Для панелей, с которых уходим всегда выставляется скролл
    // Для панелей на которые приходим надо смотреть, есть ли браузерный скролл и применяется ли к ней анимация перехода:
    if (fromPanelHasScroll || toPanelHasScroll && canTargetPanelScroll && panelAnimated) {
      setState({
        position: 'absolute',
        top: vertical === 'top' || fromPanelHasScroll ? rootRef.current.offsetTop + panelScroll : null,
        bottom: vertical === 'bottom' && !fromPanelHasScroll ? -panelScroll : null,
        width: '',
      });
    }
  });
  useGlobalEventListener(document, transitionEndEventName, () => {
    setState({
      position: null,
      top: null,
      bottom: null,
    });

    doResize();
  });

  function doResize() {
    const { colRef } = splitCol;

    if (colRef && colRef.current) {
      const node: HTMLElement = colRef.current;
      const width = node.offsetWidth;

      setState({ width: `${width}px`, position: null });
    } else {
      setState({ width: '', position: null });
    }
  };

  return (
    <TooltipContainer
      {...restProps}
      fixed
      ref={rootRef}
      vkuiClass={classNames(getClassName('FixedLayout', platform), {
        'FixedLayout--filled': filled,
      }, `FixedLayout--${vertical}`)}
      style={{ ...style, ...state }}
    >
      <div vkuiClass="FixedLayout__in" ref={getRef}>{children}</div>
    </TooltipContainer>
  );
};

export default FixedLayout;

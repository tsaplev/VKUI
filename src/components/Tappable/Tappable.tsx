import * as React from 'react';
import Touch, { TouchEvent, TouchProps } from '../Touch/Touch';
import TouchRootContext from '../Touch/TouchContext';
import { classNames } from '../../lib/classNames';
import { getClassName } from '../../helpers/getClassName';
import { ANDROID } from '../../lib/platform';
import { getOffsetRect } from '../../lib/offset';
import { coordX, coordY, VKUITouchEvent } from '../../lib/touch';
import { HasRootRef, Ref } from '../../types';
import { hasHover } from '@vkontakte/vkjs';
import { shouldTriggerClickOnEnterOrSpace } from '../../lib/accessibility';
import { useIsomorphicLayoutEffect } from '../../lib/useIsomorphicLayoutEffect';
import { FocusVisible, FocusVisibleMode } from '../FocusVisible/FocusVisible';
import { useTimeout } from '../../hooks/useTimeout';
import { useExternRef } from '../../hooks/useExternRef';
import { usePlatform } from '../../hooks/usePlatform';
import { useAdaptivity } from '../../hooks/useAdaptivity';
import './Tappable.css';

export interface TappableProps extends React.AllHTMLAttributes<HTMLElement>, HasRootRef<HTMLElement> {
  Component?: React.ElementType;
  /**
   * Длительность показа active-состояния
   */
  activeEffectDelay?: number;
  stopPropagation?: boolean;
  /**
   * Указывает, должен ли компонент реагировать на hover-состояние
   */
  hasHover?: boolean;
  /**
   * Указывает, должен ли компонент реагировать на active-состояние
   */
  hasActive?: boolean;
  /**
   * Стиль подсветки active-состояния. Если передать произвольную строку, она добавится как css-класс во время active
   */
  activeMode?: 'opacity' | 'background' | string;
  /**
   * Стиль подсветки hover-состояния. Если передать произвольную строку, она добавится как css-класс во время hover
   */
  hoverMode?: 'opacity' | 'background' | string;
  /**
   * Стиль аутлайна focus visible.
   */
  focusVisibleMode?: FocusVisibleMode;
}

interface Wave {
  x: number;
  y: number;
  id: string;
}

export interface RootComponentProps extends TouchProps {
  ref?: Ref<HTMLElement>;
}

export type StorageItem = () => void;

export interface Storage {
  [index: string]: StorageItem;
}

export type GetStorage = () => StorageItem;

const ts = () => +Date.now();

export const ACTIVE_DELAY = 70;
export const ACTIVE_EFFECT_DELAY = 600;

let storage: Storage = {};

/*
 * Очищает таймауты и хранилище для всех экземпляров компонента, кроме переданного
 */
function deactivateOtherInstances(exclude?: string) {
  Object.keys(storage).filter((id: string) => id !== exclude).forEach((id: string) => {
    storage[id]();
    delete storage[id];
  });
}

type TappableContextProps = { insideTappable?: boolean; onEnter?: VoidFunction; onLeave?: VoidFunction };
const TappableContext = React.createContext<TappableContextProps>({ insideTappable: false });

const Tappable: React.FC<TappableProps> = ({
  children,
  Component,
  onClick,
  onKeyDown,
  activeEffectDelay,
  stopPropagation,
  getRootRef,
  hasHover: _hasHover,
  hoverMode,
  hasActive: _hasActive,
  activeMode,
  focusVisibleMode,
  ...restProps
}) => {
  Component = Component || (restProps.href ? 'a' : 'div') as React.ElementType;
  const platform = usePlatform();
  const { sizeX, hasMouse } = useAdaptivity();
  const insideTouchRoot = React.useContext(TouchRootContext);
  const parentHandlers = React.useContext(TappableContext);

  const id = React.useRef(Math.round(Math.random() * 1e8).toString(16)).current;
  const [clicks, setClicks] = React.useState<Wave[]>([]);
  const [active, setActive] = React.useState(false);
  const [hovered, setHovered] = React.useState(false);
  const [childHover, setChildHover] = React.useState(false);
  const isSlide = React.useRef(false);
  const containerRef = useExternRef(getRootRef);

  const startedAt = React.useRef<number>(null);
  useIsomorphicLayoutEffect(()=> {
    startedAt.current = active ? ts() : null;
  }, [active]);

  const hasActive = _hasActive && !childHover;
  const hasHover = _hasHover && !childHover;
  const isCustomElement: boolean = Component !== 'a' && Component !== 'button' && !restProps.contentEditable;
  const isPresetHoverMode = ['opacity', 'background'].includes(hoverMode);
  const isPresetActiveMode = ['opacity', 'background'].includes(activeMode);

  /*
   * Устанавливает активное выделение
   */
  const start = React.useCallback(() => {
    if (hasActive) {
      setActive(true);
    }
    deactivateOtherInstances(id);
  }, [hasActive]);

  const activeTimeout = useTimeout(start, ACTIVE_DELAY);
  const stopTimeout = useTimeout(stop, activeEffectDelay);

  /*
   * Снимает активное выделение
   */
  function stop() {
    setActive(false);
    activeTimeout.clear();
    stopTimeout.clear();
    delete storage[id];
  };
  React.useEffect(() => stop, []);

  /*
   * Реализует эффект при тапе для Андроида
   */
  const onDown = React.useCallback((e: VKUITouchEvent) => {
    if (platform === ANDROID) {
      const { top, left } = getOffsetRect(containerRef.current);
      const x = coordX(e) - left;
      const y = coordY(e) - top;

      setClicks((clicks) => [...clicks, { x, y, id: Date.now().toString() }]);
    }
  }, [platform]);

  /*
   * [a11y]
   * Обрабатывает событие onkeydown
   * для кастомных доступных элементов:
   * - role="link" (активация по Enter)
   * - role="button" (активация по Space и Enter)
   */
  function a11yOnKeyDown(e: React.KeyboardEvent<HTMLElement>) {
    if (shouldTriggerClickOnEnterOrSpace(e)) {
      e.preventDefault();
      containerRef.current.click();
    }

    if (typeof onKeyDown === 'function') {
      return onKeyDown(e);
    }
  }

  const handlePropagation = React.useCallback((e: TouchEvent['originalEvent']) => {
    !insideTouchRoot && stopPropagation && e.stopPropagation();
  }, [insideTouchRoot, stopPropagation]);

  const onStart = React.useCallback(({ originalEvent }: TouchEvent) => {
    handlePropagation(originalEvent);

    if (hasActive) {
      if (originalEvent.touches && originalEvent.touches.length > 1) {
        deactivateOtherInstances();
        return;
      }

      if (platform === ANDROID) {
        onDown(originalEvent);
      }

      activeTimeout.set();

      storage[id] = stop;
    }
  }, [handlePropagation, hasActive]);

  const onMove = React.useCallback(({ originalEvent, shiftXAbs, shiftYAbs }: TouchEvent) => {
    handlePropagation(originalEvent);
    if (shiftXAbs > 20 || shiftYAbs > 20) {
      isSlide.current = true;
      stop();
    }
  }, [handlePropagation]);

  const onEnd = React.useCallback(({ originalEvent }: TouchEvent) => {
    handlePropagation(originalEvent);

    if (originalEvent.touches && originalEvent.touches.length > 0) {
      isSlide.current = false;
      stop();
      return;
    }

    if (active) {
      const now = ts();
      if (now - startedAt.current >= 100) {
        // Долгий тап, выключаем подсветку
        stop();
      } else {
        // Короткий тап, оставляем подсветку
        // TODO activeEffectDelay - now + state.ts
        stopTimeout.set();
      }
    } else if (!isSlide.current) {
      // Очень короткий тап, включаем подсветку
      start();

      stopTimeout.set();
      activeTimeout.clear();
    }

    isSlide.current = false;
  }, [handlePropagation, active]);

  const onEnter = React.useCallback(() => {
    parentHandlers.onEnter && parentHandlers.onEnter();
    setHovered(true);
  }, [parentHandlers.onLeave]);

  const onLeave = React.useCallback(() => {
    parentHandlers.onLeave && parentHandlers.onLeave();
    setHovered(false);
  }, [parentHandlers.onEnter]);

  // TODO: replace with derived state?
  useIsomorphicLayoutEffect(() => {
    restProps.disabled && setHovered(false);
  }, [restProps.disabled]);

  const classes = classNames(
    getClassName('Tappable', platform),
    `Tappable--sizeX-${sizeX}`,
    {
      'Tappable--active': hasActive && active,
      'Tappable--inactive': !active,
      'Tappable--mouse': hasMouse,
      [`Tappable--hover-${hoverMode}`]: hasHover && hovered && isPresetHoverMode,
      [`Tappable--active-${activeMode}`]: hasActive && active && isPresetActiveMode,
      [hoverMode]: hasHover && hovered && !isPresetHoverMode,
      [activeMode]: hasActive && active && !isPresetActiveMode,
    });

  const RootComponent = restProps.disabled
    ? Component
    : Touch;

  const props: RootComponentProps = {};
  if (!restProps.disabled) {
    props.Component = Component;
    /* eslint-disable */
    props.onStart = onStart;
    props.onMove = onMove;
    props.onEnd = onEnd;
    props.onClick = onClick;
    props.onKeyDown = isCustomElement ? a11yOnKeyDown : onKeyDown;
    props.onEnter = onEnter;
    props.onLeave = onLeave;
    /* eslint-enable */
    props.getRootRef = containerRef;
  } else {
    props.ref = containerRef;
  }

  if (isCustomElement) {
    props['aria-disabled'] = restProps.disabled;
  }

  const role: string = restProps.href ? 'link' : 'button';

  const contextValue = React.useMemo<TappableContextProps>(() => ({
    insideTappable: true,
    onEnter: () => setChildHover(true),
    onLeave: () => setChildHover(false),
  }), []);

  return (
    <RootComponent
      type={Component === 'button' ? 'button' : undefined}
      tabIndex={isCustomElement && !restProps.disabled ? 0 : undefined}
      role={isCustomElement ? role : undefined}
      {...restProps}
      vkuiClass={classes}
      {...props}
    >
      <TappableContext.Provider value={contextValue}>
        {children}
      </TappableContext.Provider>
      {platform === ANDROID && !hasMouse && hasActive && activeMode === 'background' && (
        <span aria-hidden="true" vkuiClass="Tappable__waves">
          {clicks.map((wave) => (
            <Wave {...wave} key={wave.id} onClear={() => setClicks(clicks.filter((c) => c.id !== wave.id))} />
          ))}
        </span>
      )}
      {hasHover && <span aria-hidden="true" vkuiClass="Tappable__hoverShadow" />}
      {!restProps.disabled && <FocusVisible mode={focusVisibleMode} />}
    </RootComponent>
  );
};

Tappable.defaultProps = {
  stopPropagation: false,
  disabled: false,
  focusVisibleMode: 'inside',
  hasHover,
  hoverMode: 'background',
  hasActive: true,
  activeMode: 'background',
  activeEffectDelay: ACTIVE_EFFECT_DELAY,
};

export default Tappable;

function Wave({ x, y, onClear }: Wave & { onClear: VoidFunction }) {
  const timeout = useTimeout(onClear, 225);
  React.useEffect(() => timeout.set(), []);
  return <span vkuiClass="Tappable__wave" style={{ top: y, left: x }} />;
}

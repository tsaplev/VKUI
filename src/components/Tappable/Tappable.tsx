import * as React from 'react';
import Touch, { TouchEvent, TouchProps } from '../Touch/Touch';
import TouchRootContext from '../Touch/TouchContext';
import { classNames } from '../../lib/classNames';
import { getClassName } from '../../helpers/getClassName';
import { ANDROID } from '../../lib/platform';
import { getOffsetRect } from '../../lib/offset';
import { coordX, coordY, VKUITouchEvent } from '../../lib/touch';
import { HasPlatform, HasRootRef, Ref } from '../../types';
import { withPlatform } from '../../hoc/withPlatform';
import { hasHover } from '@vkontakte/vkjs';
import { withAdaptivity, AdaptivityProps } from '../../hoc/withAdaptivity';
import { shouldTriggerClickOnEnterOrSpace } from '../../lib/accessibility';
import { FocusVisible, FocusVisibleMode } from '../FocusVisible/FocusVisible';
import { useTimeout } from '../../hooks/useTimeout';
import { useExternRef } from '../../hooks/useExternRef';
import { useIsomorphicLayoutEffect } from '../../lib/useIsomorphicLayoutEffect';
import './Tappable.css';

export interface TappableProps extends React.AllHTMLAttributes<HTMLElement>, HasRootRef<HTMLElement>, HasPlatform, AdaptivityProps {
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

const Tappable: React.FC<TappableProps & {
  insideTouchRoot: boolean;
  onEnter: VoidFunction;
  onLeave: VoidFunction;
}> = ({
  children,
  Component,
  onClick,
  onKeyDown,
  activeEffectDelay,
  stopPropagation,
  getRootRef,
  platform,
  sizeX,
  hasMouse,
  hasHover: _hasHover,
  hoverMode,
  hasActive: _hasActive,
  activeMode,
  focusVisibleMode,
  onEnter: _onEnter,
  onLeave: _onLeave,
  insideTouchRoot,
  ...restProps
}) => {
  Component = Component || (restProps.href ? 'a' : 'div') as React.ElementType;
  const id = React.useRef(Math.round(Math.random() * 1e8).toString(16)).current;
  const [clicks, setClicks] = React.useState<Wave[]>([]);
  const [active, setActive] = React.useState(false);
  const [hovered, setHovered] = React.useState(false);
  const [childHover, setChildHover] = React.useState(false);
  const isSlide = React.useRef(false);
  const containerRef = useExternRef(getRootRef);

  const hasActive = _hasActive && !childHover;
  const hasHover = _hasHover && !childHover;

  const activeTimeout = useTimeout(start, ACTIVE_DELAY);
  const stopTimeout = useTimeout(stop, activeEffectDelay);

  const startedAt = React.useRef<number>(null);
  useIsomorphicLayoutEffect(()=> {
    startedAt.current = active ? ts() : null;
  }, [active]);

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

  function onStart({ originalEvent }: TouchEvent) {
    !insideTouchRoot && stopPropagation && originalEvent.stopPropagation();

    if (hasActive) {
      if (originalEvent.touches && originalEvent.touches.length > 1) {
        deactivateOtherInstances();
        return;
      }

      if (platform === ANDROID) {
        onDown(originalEvent);
      }

      activeTimeout.set();

      // FIXME ref
      storage[id] = () => stop();
    }
  }

  function onMove({ originalEvent, shiftXAbs, shiftYAbs }: TouchEvent) {
    !insideTouchRoot && stopPropagation && originalEvent.stopPropagation();
    if (shiftXAbs > 20 || shiftYAbs > 20) {
      isSlide.current = true;
      stop();
    }
  };

  function onEnd({ originalEvent }: TouchEvent) {
    !insideTouchRoot && stopPropagation && originalEvent.stopPropagation();

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
  };

  /*
   * Реализует эффект при тапе для Андроида
   */
  function onDown(e: VKUITouchEvent) {
    if (platform === ANDROID) {
      const { top, left } = getOffsetRect(containerRef.current);
      const x = coordX(e) - left;
      const y = coordY(e) - top;

      setClicks([...clicks, { x, y, id: Date.now().toString() }]);
    }
  };

  function onEnter() {
    _onEnter && _onEnter();
    setHovered(true);
  }

  function onLeave() {
    _onLeave && _onLeave();
    setHovered(false);
  };

  /*
   * Устанавливает активное выделение
   */
  function start() {
    if (hasActive) {
      setActive(true);
    }
    deactivateOtherInstances(id);
  }

  /*
   * Снимает активное выделение
   */
  function stop() {
    setActive(false);
    activeTimeout.clear();
    stopTimeout.clear();
    delete storage[id];
  };

  React.useEffect(() => () => stop(), []);
  // TODO: replace with derived state?
  useIsomorphicLayoutEffect(() => {
    restProps.disabled && setHovered(false);
  }, [restProps.disabled]);

  function removeWave({ id }: Wave) {
    setClicks(clicks.filter((c) => c.id !== id));
  }

  const isCustomElement: boolean = Component !== 'a' && Component !== 'button' && !restProps.contentEditable;

  const isPresetHoverMode = ['opacity', 'background'].includes(hoverMode);
  const isPresetActiveMode = ['opacity', 'background'].includes(activeMode);

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
            <Wave {...wave} key={wave.id} onClear={() => removeWave(wave)} />
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

const TappableContexts = (props: TappableProps) => {
  const insideTouchRoot = React.useContext(TouchRootContext);
  const { onEnter, onLeave } = React.useContext(TappableContext);
  return <Tappable {...props} insideTouchRoot={insideTouchRoot} onEnter={onEnter} onLeave={onLeave} />;
};

export default withAdaptivity(withPlatform(TappableContexts), { sizeX: true, hasMouse: true });

function Wave({ x, y, onClear }: Wave & { onClear: VoidFunction }) {
  const timeout = useTimeout(onClear, 225);
  React.useEffect(() => timeout.set(), []);
  return <span vkuiClass="Tappable__wave" style={{ top: y, left: x }} />;
}

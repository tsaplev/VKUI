import * as React from 'react';
import Touch, { TouchEvent, TouchEventHandler, TouchProps } from '../Touch/Touch';
import TouchRootContext from '../Touch/TouchContext';
import { classNames } from '../../lib/classNames';
import { getClassName } from '../../helpers/getClassName';
import { ANDROID } from '../../lib/platform';
import { getOffsetRect } from '../../lib/offset';
import { coordX, coordY, VKUITouchEvent, VKUITouchEventHander } from '../../lib/touch';
import { HasPlatform, HasRootRef, Ref } from '../../types';
import { withPlatform } from '../../hoc/withPlatform';
import { hasHover } from '@vkontakte/vkjs';
import { setRef } from '../../lib/utils';
import { withAdaptivity, AdaptivityProps } from '../../hoc/withAdaptivity';
import { shouldTriggerClickOnEnterOrSpace } from '../../lib/accessibility';
import { FocusVisible, FocusVisibleMode } from '../FocusVisible/FocusVisible';
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

export interface TappableState {
  clicks?: {
    [index: string]: {
      x: number;
      y: number;
    };
  };
  hovered?: boolean;
  active?: boolean;
  ts?: number;
  childHover?: boolean;
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

const TappableContext = React.createContext<{ insideTappable?: boolean; onEnter?: VoidFunction; onLeave?: VoidFunction }>({ insideTappable: false });

class Tappable extends React.Component<TappableProps & {
  insideTouchRoot: boolean;
  onEnter: VoidFunction;
  onLeave: VoidFunction;
}, TappableState> {
  constructor(props: TappableProps) {
    super(props);
    this.id = Math.round(Math.random() * 1e8).toString(16);

    this.state = {
      clicks: {},
      active: false,
      ts: null,
      childHover: false,
    };
    this.isSlide = false;
  }

  get hasActive() {
    return this.props.hasActive && !this.state.childHover;
  }

  get hasHover() {
    return this.props.hasHover && !this.state.childHover;
  }

  id: string;

  isSlide: boolean;

  container: HTMLElement;

  stopTimeout: ReturnType<typeof setTimeout>;;
  activeTimeout: ReturnType<typeof setTimeout>;;
  wavesTimeout: ReturnType<typeof setTimeout>;;

  static defaultProps = {
    stopPropagation: false,
    disabled: false,
    focusVisibleMode: 'inside',
    hasHover,
    hoverMode: 'background',
    hasActive: true,
    activeMode: 'background',
    activeEffectDelay: ACTIVE_EFFECT_DELAY,
  };

  /*
   * [a11y]
   * Обрабатывает событие onkeydown
   * для кастомных доступных элементов:
   * - role="link" (активация по Enter)
   * - role="button" (активация по Space и Enter)
   */
  onKeyDown: React.KeyboardEventHandler = (e: React.KeyboardEvent<HTMLElement>) => {
    const { onKeyDown } = this.props;

    if (shouldTriggerClickOnEnterOrSpace(e)) {
      e.preventDefault();
      this.container.click();
    }

    {
      if (typeof onKeyDown === 'function') {
        return onKeyDown(e);
      }
    }
  };

  /*
   * Обрабатывает событие touchstart
   */
  onStart: TouchEventHandler = ({ originalEvent }: TouchEvent) => {
    !this.props.insideTouchRoot && this.props.stopPropagation && originalEvent.stopPropagation();

    if (this.hasActive) {
      if (originalEvent.touches && originalEvent.touches.length > 1) {
        deactivateOtherInstances();
        return;
      }

      if (this.props.platform === ANDROID) {
        this.onDown(originalEvent);
      }

      this.activeTimeout = setTimeout(this.start, ACTIVE_DELAY);

      storage[this.id] = () => this.stop();
    }
  };

  /*
   * Обрабатывает событие touchmove
   */
  onMove: TouchEventHandler = ({ originalEvent, shiftXAbs, shiftYAbs }: TouchEvent) => {
    !this.props.insideTouchRoot && this.props.stopPropagation && originalEvent.stopPropagation();
    if (shiftXAbs > 20 || shiftYAbs > 20) {
      this.isSlide = true;
      this.stop();
    }
  };

  /*
   * Обрабатывает событие touchend
   */
  onEnd: TouchEventHandler = ({ originalEvent }: TouchEvent) => {
    !this.props.insideTouchRoot && this.props.stopPropagation && originalEvent.stopPropagation();
    const now = ts();

    if (originalEvent.touches && originalEvent.touches.length > 0) {
      this.isSlide = false;
      this.stop();
      return;
    }

    if (this.state.active) {
      if (now - this.state.ts >= 100) {
        // Долгий тап, выключаем подсветку
        this.stop();
      } else {
        // Короткий тап, оставляем подсветку
        this.stopTimeout = setTimeout(this.stop, this.props.activeEffectDelay - now + this.state.ts);
      }
    } else if (!this.isSlide) {
      // Очень короткий тап, включаем подсветку
      this.start();

      this.stopTimeout = setTimeout(this.stop, this.props.activeEffectDelay);
      clearTimeout(this.activeTimeout);
    }

    this.isSlide = false;
  };

  /*
   * Реализует эффект при тапе для Андроида
   */
  onDown: VKUITouchEventHander = (e: VKUITouchEvent) => {
    if (this.props.platform === ANDROID) {
      const { top, left } = getOffsetRect(this.container);
      const x = coordX(e) - left;
      const y = coordY(e) - top;
      const key = 'wave' + Date.now().toString();

      this.setState((state: TappableState): TappableState => {
        return {
          clicks: {
            ...state.clicks,
            [key]: {
              x,
              y,
            },
          },
        };
      });

      this.wavesTimeout = setTimeout(() => {
        this.setState((state: TappableState): TappableState => {
          let clicks = { ...state.clicks };
          delete clicks[key];
          return { clicks };
        });
      }, 225);
    }
  };

  onEnter = () => {
    this.props.onEnter && this.props.onEnter();
    this.setState({ hovered: true });
  };

  onLeave = () => {
    this.props.onLeave && this.props.onLeave();
    this.setState({ hovered: false });
  };

  /*
   * Устанавливает активное выделение
   */
  start: VoidFunction = () => {
    if (!this.state.active && this.hasActive) {
      this.setState({
        active: true,
        ts: ts(),
      });
    }
    deactivateOtherInstances(this.id);
  };

  /*
   * Снимает активное выделение
   */
  stop: VoidFunction = () => {
    if (this.state.active) {
      this.setState({
        active: false,
        ts: null,
      });
    }
    clearTimeout(this.activeTimeout);
    clearTimeout(this.stopTimeout);
    delete storage[this.id];
  };

  /*
   * Берет ref на DOM-ноду из экземпляра Touch
   */
  getRef: React.RefCallback<HTMLElement> = (container) => {
    this.container = container;
    setRef(container, this.props.getRootRef);
  };

  componentWillUnmount() {
    this.stop();
    clearTimeout(this.wavesTimeout);
  }

  componentDidUpdate(prevProps: TappableProps) {
    if (!prevProps.disabled && this.props.disabled) {
      this.setState({ hovered: false });
    }
  }

  render() {
    const { hasHover, hasActive } = this;
    const { clicks, active, hovered } = this.state;

    const defaultComponent: React.ElementType = this.props.href ? 'a' : 'div';

    const {
      children,
      Component = defaultComponent,
      onClick,
      onKeyDown,
      activeEffectDelay,
      stopPropagation,
      getRootRef,
      platform,
      sizeX,
      hasMouse,
      hasHover: propsHasHover,
      hoverMode,
      hasActive: propsHasActive,
      activeMode,
      focusVisibleMode,
      onEnter,
      onLeave,
      insideTouchRoot,
      ...restProps
    } = this.props;

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
      props.onStart = this.onStart;
      props.onMove = this.onMove;
      props.onEnd = this.onEnd;
      props.onClick = onClick;
      props.onKeyDown = isCustomElement ? this.onKeyDown : onKeyDown;
      props.onEnter = () => this.onEnter();
      props.onLeave = () => this.onLeave();
      /* eslint-enable */
      props.getRootRef = this.getRef;
    } else {
      props.ref = this.getRef;
    }

    if (isCustomElement) {
      props['aria-disabled'] = restProps.disabled;
    }

    const role: string = restProps.href ? 'link' : 'button';

    return (
      <RootComponent
        type={Component === 'button' ? 'button' : undefined}
        tabIndex={isCustomElement && !restProps.disabled ? 0 : undefined}
        role={isCustomElement ? role : undefined}
        {...restProps}
        vkuiClass={classes}
        {...props}
      >
        <TappableContext.Provider
          value={{
            insideTappable: true,
            onEnter: () => this.setState({ childHover: true }),
            onLeave: () => this.setState({ childHover: false }),
          }}
        >
          {children}
        </TappableContext.Provider>
        {platform === ANDROID && !hasMouse && hasActive && activeMode === 'background' && (
          <span aria-hidden="true" vkuiClass="Tappable__waves">
            {Object.keys(clicks).map((k: string) => (
              <span vkuiClass="Tappable__wave" style={{ top: clicks[k].y, left: clicks[k].x }} key={k} />
            ))}
          </span>
        )}
        {hasHover && <span aria-hidden="true" vkuiClass="Tappable__hoverShadow" />}
        {!restProps.disabled && <FocusVisible mode={focusVisibleMode} />}
      </RootComponent>
    );
  }
}

const TappableContexts = (props: TappableProps) => {
  const insideTouchRoot = React.useContext(TouchRootContext);
  const { onEnter, onLeave } = React.useContext(TappableContext);
  return <Tappable {...props} insideTouchRoot={insideTouchRoot} onEnter={onEnter} onLeave={onLeave} />;
};

export default withAdaptivity(withPlatform(TappableContexts), { sizeX: true, hasMouse: true });

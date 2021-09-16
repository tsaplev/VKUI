import * as React from 'react';
import { classNames } from '../../lib/classNames';
import { transitionEvent, animationEvent } from '../../lib/supportEvents';
import { getClassName } from '../../helpers/getClassName';
import { IOS, ANDROID, VKCOM } from '../../lib/platform';
import Touch, { TouchEvent } from '../Touch/Touch';
import { HasPlatform } from '../../types';
import { withPlatform } from '../../hoc/withPlatform';
import { withContext } from '../../hoc/withContext';
import { ConfigProviderContext, ConfigProviderContextInterface } from '../ConfigProvider/ConfigProviderContext';
import { createCustomEvent } from '../../lib/utils';
import { SplitColContext, SplitColContextProps } from '../SplitCol/SplitCol';
import { AppRootPortal } from '../AppRoot/AppRootPortal';
import { canUseDOM, withDOM, DOMProps } from '../../lib/dom';
import { ScrollContext, ScrollContextInterface } from '../AppRoot/ScrollContext';
import { getNavId, NavIdProps } from '../../lib/getNavId';
import { warnOnce } from '../../lib/warnOnce';
import './View.css';

const warn = warnOnce('View');
export const transitionStartEventName = 'VKUI:View:transition-start';
export const transitionEndEventName = 'VKUI:View:transition-end';

enum SwipeBackResults { fail = 1, success}

interface Scrolls {
  [index: string]: number;
}

export type TransitionStartEventDetail = {
  scrolls: Scrolls;
  from: string;
  to: string;
  isBack: boolean;
};

interface ViewsScrolls {
  [index: string]: Scrolls;
}

export let scrollsCache: ViewsScrolls = {};

const swipeBackExcludedTags = ['input', 'textarea'];

export interface ViewProps extends React.HTMLAttributes<HTMLElement>, HasPlatform, NavIdProps {
  activePanel: string;
  /**
   * @deprecated будет удалено в 5.0.0. Используйте одноименное свойство у `SplitLayout`.
   *
   * Свойство для отрисовки `Alert`, `ActionSheet` и `ScreenSpinner`.
   */
  popout?: React.ReactNode;
  /**
   * @deprecated будет удалено в 5.0.0. Используйте одноименное свойство у `SplitLayout`.
   *
   * Свойство для отрисовки `ModalRoot`.
   */
  modal?: React.ReactNode;
  onTransition?(params: { isBack: boolean; from: string; to: string }): void;
  /**
   * callback свайпа назад
   */
  onSwipeBack?(): void;
  /**
   * callback начала анимации свайпа назад.
   */
  onSwipeBackStart?(): void;
  /**
   * callback завершения анимации отмененного пользователем свайпа
   */
  onSwipeBackCancel?(): void;
  history?: string[];
  /**
   * @ignore
   */
  splitCol?: SplitColContextProps;
  /**
   * @ignore
   */
  configProvider?: ConfigProviderContextInterface;
  /**
   * @ignore
   */
  scroll?: ScrollContextInterface;
}

export interface ViewState {
  animated: boolean;
  startT?: Date;

  activePanel: string;
  isBack: boolean;
  prevPanel: string;

  swipingBack: boolean;
  swipeBackShift: number;
  swipeBackResult: SwipeBackResults;

  browserSwipe: boolean;
}

class View extends React.Component<ViewProps & DOMProps, ViewState> {
  constructor(props: ViewProps) {
    super(props);

    this.state = {
      animated: false,

      activePanel: props.activePanel,
      isBack: undefined,
      prevPanel: null,

      swipingBack: false,
      swipeBackShift: 0,
      swipeBackResult: null,

      browserSwipe: false,
    };
  }

  private readonly scrolls: Scrolls = scrollsCache[getNavId(this.props)] || {};

  static defaultProps: Partial<ViewProps> = {
    history: [],
  };

  private transitionFinishTimeout: ReturnType<typeof setTimeout>;
  private animationFinishTimeout: ReturnType<typeof setTimeout>;

  get document() {
    return this.props.document;
  }

  get window() {
    return this.props.window;
  }

  get panels() {
    return React.Children.toArray(this.props.children) as React.ReactElement[];
  }

  panelNodes: { [id: string]: HTMLDivElement } = {};

  componentWillUnmount() {
    const id = getNavId(this.props);
    if (id) {
      scrollsCache[id] = this.scrolls;
    }
  }

  componentDidUpdate(prevProps: ViewProps, prevState: ViewState) {
    const { scrolls } = this;

    this.props.popout && !prevProps.popout && this.blurActiveElement();
    this.props.modal && !prevProps.modal && this.blurActiveElement();

    // Нужен переход
    if (prevProps.activePanel !== this.props.activePanel || prevState.swipeBackResult === SwipeBackResults.fail && !this.state.swipeBackResult) {
      const animated = !prevState.browserSwipe && !prevState.swipingBack;

      const panelIds = this.panels.map((panel) => getNavId(panel.props, warn));
      const isBack = animated && panelIds.indexOf(this.props.activePanel) < panelIds.indexOf(prevProps.activePanel);

      this.blurActiveElement();

      this.setState({
        activePanel: this.props.activePanel,
        prevPanel: animated ? prevProps.activePanel : null,
        browserSwipe: false,
        swipingBack: false,
        swipeBackResult: null,
        swipeBackShift: 0,
        animated,
        isBack,
      });
    }

    // Начался переход
    if (!prevState.animated && this.state.animated || !prevState.swipingBack && this.state.swipingBack) {
      const { prevPanel, activePanel, isBack } = this.state;
      this.document.dispatchEvent(createCustomEvent(this.window, transitionStartEventName, {
        detail: {
          from: prevPanel,
          to: activePanel,
          isBack,
          scrolls,
        },
      }));

      if (this.state.swipingBack) {
        this.props.onSwipeBackStart && this.props.onSwipeBackStart();
      }

      scrolls[prevPanel] = this.props.scroll.getScroll().y;
      this.panelNodes[prevPanel].scrollTop = scrolls[prevPanel];
      if (isBack) {
        this.panelNodes[activePanel].scrollTop = scrolls[activePanel];
      }

      if (this.state.animated) {
        if (this.shouldDisableTransitionMotion()) {
          this.transitionEndHandler();
        } else {
          this.fallbackAnimationFinish(this.transitionEndHandler);
        }
      }
    }

    // Началась анимация завершения свайпа назад.
    if (!prevState.swipeBackResult && this.state.swipeBackResult) {
      this.fallbackTransitionFinish(this.swipingBackTransitionEndHandler);
    }

    // transition finished
    if (prevState.prevPanel && !this.state.prevPanel && !this.state.browserSwipe) {
      if (prevState.isBack) {
        if (this.state.activePanel !== prevState.prevPanel) {
          delete scrolls[prevState.prevPanel];
        }
        this.props.scroll.scrollTo(0, scrolls[this.state.activePanel]);
      }
      this.document.dispatchEvent(createCustomEvent(this.window, transitionEndEventName));
      this.props.onTransition && this.props.onTransition({
        isBack: prevState.isBack,
        from: prevState.prevPanel,
        to: this.state.activePanel,
      });
    }
  }

  shouldDisableTransitionMotion(): boolean {
    return this.props.configProvider.transitionMotionEnabled === false ||
      !this.props.splitCol.animate;
  }

  fallbackTransitionFinish(eventHandler: VoidFunction): void {
    if (!transitionEvent.supported) {
      clearTimeout(this.transitionFinishTimeout);
      this.transitionFinishTimeout = setTimeout(eventHandler, this.props.platform === ANDROID || this.props.platform === VKCOM ? 300 : 600);
    }
  }

  fallbackAnimationFinish(eventHandler: VoidFunction): void {
    if (!animationEvent.supported) {
      clearTimeout(this.animationFinishTimeout);
      this.animationFinishTimeout = setTimeout(eventHandler, this.props.platform === ANDROID || this.props.platform === VKCOM ? 300 : 600);
    }
  }

  blurActiveElement(): void {
    if (typeof this.window !== 'undefined' && this.document.activeElement) {
      (this.document.activeElement as HTMLElement).blur();
    }
  }

  transitionEndHandler = (e?: React.AnimationEvent): void => {
    if (!e || [
      'vkui-animation-ios-next-forward',
      'vkui-animation-ios-prev-back',
      'vkui-animation-view-next-forward',
      'vkui-animation-view-prev-back',
    ].includes(e.animationName)) {
      this.setState({
        prevPanel: null,
        animated: false,
        isBack: undefined,
      });
    }
  };

  swipingBackTransitionEndHandler = (e?: React.TransitionEvent): void => {
    // indexOf because of vendor prefixes in old browsers
    if (!e || e?.propertyName.includes('transform') && e?.target === this.panelNodes[this.state.activePanel]) {
      switch (this.state.swipeBackResult) {
        case SwipeBackResults.fail:
          this.onSwipeBackCancel();
          break;
        case SwipeBackResults.success:
          this.onSwipeBackSuccess();
      }
    }
  };

  onSwipeBackSuccess(): void {
    this.props.onSwipeBack && this.props.onSwipeBack();
  }

  onSwipeBackCancel(): void {
    this.props.onSwipeBackCancel && this.props.onSwipeBackCancel();
    this.setState({ swipeBackResult: null });
  }

  onMoveX = (e: TouchEvent): void => {
    const { platform, configProvider } = this.props;
    const target = e.originalEvent.target as HTMLElement;
    if (swipeBackExcludedTags.includes(target?.tagName?.toLowerCase()) || platform !== IOS) {
      return;
    }

    if (!configProvider.isWebView && (e.startX <= 70 || e.startX >= this.window.innerWidth - 70) && !this.state.browserSwipe) {
      this.setState({ browserSwipe: true });
    }

    if (configProvider.isWebView && this.props.onSwipeBack) {
      if (this.state.animated && e.startX <= 70) {
        return;
      }

      if (e.startX <= 70 && !this.state.swipingBack && this.props.history.length > 1) {
        this.setState({
          swipingBack: true,
          isBack: true,
          startT: e.startT,
          prevPanel: this.state.activePanel,
          activePanel: this.props.history.slice(-2)[0],
        });
      }
      if (this.state.swipingBack) {
        let swipeBackShift;
        if (e.shiftX < 0) {
          swipeBackShift = 0;
        } else if (e.shiftX > this.window.innerWidth - e.startX) {
          swipeBackShift = this.window.innerWidth;
        } else {
          swipeBackShift = e.shiftX;
        }
        this.setState({ swipeBackShift });
      }
    }
  };

  onEnd = (e: TouchEvent): void => {
    if (this.state.swipingBack) {
      const speed = this.state.swipeBackShift / (Date.now() - this.state.startT.getTime()) * 1000;
      if (this.state.swipeBackShift === 0) {
        this.onSwipeBackCancel();
      } else if (this.state.swipeBackShift >= this.window.innerWidth) {
        this.onSwipeBackSuccess();
      } else if (speed > 250 || e.startX + this.state.swipeBackShift > this.window.innerWidth / 2) {
        this.setState({ swipeBackResult: SwipeBackResults.success });
      } else {
        this.setState({ swipeBackResult: SwipeBackResults.fail });
      }
    }
  };

  calcPanelSwipeStyles(panelId: string): React.CSSProperties {
    if (!canUseDOM) {
      return {};
    }

    const isPrev = this.state.swipingBack && panelId === this.state.prevPanel;
    const isNext = this.state.swipingBack && panelId === this.state.activePanel;

    if (!isPrev && !isNext || this.state.swipeBackResult) {
      return {};
    }

    let prevPanelTranslate = `${this.state.swipeBackShift}px`;
    let nextPanelTranslate = `${-50 + this.state.swipeBackShift * 100 / this.window.innerWidth / 2}%`;
    let prevPanelShadow = 0.3 * (this.window.innerWidth - this.state.swipeBackShift) / this.window.innerWidth;

    if (this.state.swipeBackResult) {
      return isPrev ? { boxShadow: `-2px 0 12px rgba(0, 0, 0, ${prevPanelShadow})` } : {};
    }

    if (isNext) {
      return {
        transform: `translate3d(${nextPanelTranslate}, 0, 0)`,
        WebkitTransform: `translate3d(${nextPanelTranslate}, 0, 0)`,
      };
    }
    if (isPrev) {
      return {
        transform: `translate3d(${prevPanelTranslate}, 0, 0)`,
        WebkitTransform: `translate3d(${prevPanelTranslate}, 0, 0)`,
        boxShadow: `-2px 0 12px rgba(0, 0, 0, ${prevPanelShadow})`,
      };
    }

    return {};
  }

  render() {
    const {
      popout, modal, platform,
      activePanel: _1, splitCol, configProvider, history, nav,
      onTransition, onSwipeBack, onSwipeBackStart, onSwipeBackCancel,
      window, document, scroll,
      ...restProps
    } = this.props;
    const { prevPanel, activePanel, swipeBackResult, swipingBack, animated, isBack } = this.state;
    const disableAnimation = this.shouldDisableTransitionMotion();

    return (
      <Touch
        Component="section"
        {...restProps}
        vkuiClass={classNames(getClassName('View', platform), {
          'View--animated': !disableAnimation && animated,
          'View--swiping-back': !disableAnimation && swipingBack,
          'View--no-motion': disableAnimation,
        })}
        onMoveX={this.onMoveX}
        onEnd={this.onEnd}
      >
        <div vkuiClass="View__panels">
          {this.panels.map((panel: React.ReactElement) => {
            const panelId = getNavId(panel.props, warn);
            if (![activePanel, prevPanel].includes(panelId)) {
              return null;
            }
            const isAnimationTarget = animated && panelId === (isBack ? prevPanel : activePanel);

            return (
              <div
                vkuiClass={classNames('View__panel', {
                  'View__panel--active': !swipingBack && !animated && panelId === activePanel,
                  'View__panel--prev': !swipingBack && animated && panelId === prevPanel,
                  'View__panel--next': !swipingBack && animated && panelId === activePanel,
                  'View__panel--swipe-back-prev': swipingBack && panelId === prevPanel,
                  'View__panel--swipe-back-next': swipingBack && panelId === activePanel,
                  'View__panel--swipe-back-success': swipeBackResult === SwipeBackResults.success,
                  'View__panel--swipe-back-failed': swipeBackResult === SwipeBackResults.fail,
                })}
                onAnimationEnd={isAnimationTarget ? this.transitionEndHandler : null}
                onTransitionEnd={swipeBackResult && panelId === activePanel ? this.swipingBackTransitionEndHandler : null}
                ref={(el) => this.panelNodes[panelId] = el}
                data-vkui-active-panel={panelId === activePanel ? 'true' : ''}
                style={this.calcPanelSwipeStyles(panelId)}
                key={panelId}
              >
                <div vkuiClass="View__panel-in">
                  {panel}
                </div>
              </div>
            );
          })}
        </div>
        <AppRootPortal>
          {!!popout && <div vkuiClass="View__popout">{popout}</div>}
          {!!modal && <div vkuiClass="View__modal">{modal}</div>}
        </AppRootPortal>
      </Touch>
    );
  }
}

export default withContext(withContext(
  withContext(
    withPlatform(withDOM<ViewProps>(View)),
    SplitColContext, 'splitCol'),
  ConfigProviderContext, 'configProvider'),
ScrollContext, 'scroll');

import * as React from 'react';
import { getClassName } from '../../helpers/getClassName';
import { classNames } from '../../lib/classNames';
import { withPlatform } from '../../hoc/withPlatform';
import { HasPlatform } from '../../types';
import { TouchEvent } from '../Touch/Touch';
import { withAdaptivity, AdaptivityProps, ViewHeight, ViewWidth } from '../../hoc/withAdaptivity';
import ModalRootContext, { useModalRegistry } from '../ModalRoot/ModalRootContext';
import { ModalType } from '../ModalRoot/types';
import { getNavId, NavIdProps } from '../../lib/getNavId';
import { warnOnce } from '../../lib/warnOnce';
import { ModalCardBase, ModalCardBaseProps } from '../ModalCardBase/ModalCardBase';
import { ANDROID, VKCOM } from '../../lib/platform';
import { rubber } from '../../lib/touch';
import { usePlatform } from '../../hooks/usePlatform';
import { setTransformStyle } from '../../lib/styles';
import './ModalCard.css';

export interface ModalCardProps extends HasPlatform, AdaptivityProps, NavIdProps, ModalCardBaseProps {}

const warn = warnOnce('ModalCard');

function useCardGestures(id: string, innerElement: React.RefObject<HTMLElement>, onClose: VoidFunction) {
  const modalContext = React.useContext(ModalRootContext);
  const [dragging, setDragging] = React.useState(false);
  const platform = usePlatform();
  const startTranslate = React.useRef<number>();

  const frame = React.useRef<number>();
  function animateTranslate(percent: number) {
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      setTransformStyle(innerElement.current, `translate3d(0, ${percent}%, 0)`);
    });
  }

  function getGesture(shiftY: number) {
    const shiftYPercent = shiftY / innerElement.current.offsetHeight * 100;
    const shiftYCurrent = rubber(shiftYPercent, 72, 1.2, platform === ANDROID || platform === VKCOM);
    const translateYCurrent = Math.max(0, startTranslate.current + shiftYCurrent);
    return { shiftYPercent, translateYCurrent };
  }

  function onStart() {
    startTranslate.current = modalContext.getState(id).translateY;
  }

  function onMove({ originalEvent, shiftY }: TouchEvent) {
    const target = originalEvent.target as HTMLElement;
    if (innerElement.current.contains(target)) {
      setDragging(true);
      const gesture = getGesture(shiftY);

      animateTranslate(gesture.translateYCurrent);
      modalContext.setMaskOpacity(id);
    }
  }

  function onEnd({ duration, shiftY }: TouchEvent) {
    if (dragging) {
      const gesture = getGesture(shiftY);
      const { translateYCurrent } = gesture;
      const expectTranslateY = translateYCurrent / duration * 240 * 0.6 * (gesture.shiftYPercent < 0 ? -1 : 1);
      const hidden = translateYCurrent + expectTranslateY >= 30;
      const translateY = hidden ? 100 : 0;

      if (hidden) {
        onClose();
      } else {
        animateTranslate(translateY);
      }

      modalContext.setMaskOpacity(id);
    }

    setDragging(false);
  }

  return { onStart, onMove, onEnd };
}

const ModalCard: React.FC<ModalCardProps> = (props: ModalCardProps) => {
  const {
    icon,
    header,
    subheader,
    children,
    actions,
    actionsLayout,
    onClose: _onClose,
    platform,
    viewWidth,
    viewHeight,
    hasMouse,
    nav,
    ...restProps
  } = props;

  const isDesktop = viewWidth >= ViewWidth.SMALL_TABLET && (hasMouse || viewHeight >= ViewHeight.MEDIUM);

  const id = getNavId(props, warn);
  const modalContext = React.useContext(ModalRootContext);
  const {
    refs,
    innerElement,
    onClose,
  } = useModalRegistry(id, ModalType.CARD);
  const gestures = useCardGestures(id, innerElement, onClose);
  const handlers = modalContext.isTouch ? gestures : {};

  return (
    <div
      {...restProps}
      vkuiClass={classNames(getClassName('ModalCard', platform), {
        'ModalCard--desktop': isDesktop,
      })}
    >
      <ModalCardBase
        {...handlers}
        vkuiClass="ModalCard__in"
        getRootRef={refs.innerElement}
        icon={icon}
        header={header}
        subheader={subheader}
        actions={actions}
        actionsLayout={actionsLayout}
        onClose={_onClose || modalContext.onClose}
      >
        {children}
      </ModalCardBase>
    </div>
  );
};

ModalCard.defaultProps = {
  actionsLayout: 'horizontal',
};

export default withAdaptivity(withPlatform(ModalCard), {
  viewWidth: true,
  viewHeight: true,
  hasMouse: true,
});

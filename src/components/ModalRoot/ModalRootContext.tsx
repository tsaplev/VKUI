import * as React from 'react';
import { useIsomorphicLayoutEffect } from '../../lib/useIsomorphicLayoutEffect';
import { ModalElements, ModalsStateEntry, ModalType } from './types';
import { transitionEvent } from '../../lib/supportEvents';
import { noop } from '../../lib/utils';

export type ModalRegistryEntry = ModalElements & Required<Pick<ModalsStateEntry, 'type' | 'id'>>;
type ModalRefs = { [k in keyof ModalElements]: (e: ModalElements[k]) => void };

export interface ModalRootContextInterface {
  updateModalHeight: VoidFunction;
  registerModal(data: ModalRegistryEntry): void;
  onClose?: VoidFunction;
  isInsideModal: boolean;
  exitingId?: string;
  animateExit: (id: string, el: HTMLElement) => void;
  onExit: (id: string) => void;
  enteringId?: string;
  animateEnter: (id: string, el: HTMLElement) => void;
  onEnter: (id: string) => void;
}

export const ModalRootContext = React.createContext<ModalRootContextInterface>({
  updateModalHeight: noop,
  registerModal: noop,
  isInsideModal: false,
  animateExit: noop,
  onExit: noop,
  animateEnter: noop,
  onEnter: noop,
});

/**
 * All referenced elements must be static
 */
export function useModalRegistry(id: string, type: ModalType) {
  const {
    registerModal,
    exitingId,
    animateExit,
    onExit,
    enteringId,
    animateEnter,
    onEnter,
  } = React.useContext(ModalRootContext);
  const elements = React.useRef<ModalElements>({}).current;
  useIsomorphicLayoutEffect(() => {
    registerModal({ ...elements, type, id });
    // unset refs on  unmount to prevent leak
    const reset = Object.keys(elements).reduce<ModalRegistryEntry>(
      (acc, k: keyof ModalElements) => ({ ...acc, [k]: null }),
      { type, id });
    return () => registerModal(reset);
  }, []);

  const refs = React.useRef<Required<ModalRefs>>({
    modalElement: (e) => elements.modalElement = e,
    innerElement: (e) => elements.innerElement = e,
    headerElement: (e) => elements.headerElement = e,
    contentElement: (e) => elements.contentElement = e,
  }).current;

  const exiting = exitingId === id;
  React.useEffect(() => {
    if (exiting) {
      waitTransitionFinish(elements.innerElement, () => onExit(id));
      animateExit(id, elements.innerElement);
    }
  }, [exiting]);

  const entering = enteringId === id;
  React.useEffect(() => {
    // mounted check
    entering && requestAnimationFrame(() => {
      if (elements.innerElement) {
        waitTransitionFinish(elements.innerElement, () => onEnter(id));
        animateEnter(id, elements.innerElement);
      }
    });
  }, [entering]);

  return {
    refs,
  };
}

function waitTransitionFinish(el: HTMLElement, eventHandler: () => void) {
  if (!transitionEvent.supported) {
    setTimeout(eventHandler, 400);
    return;
  }
  const onceHandler = () => {
    el.removeEventListener(transitionEvent.name, onceHandler);
    eventHandler();
  };
  el.addEventListener(transitionEvent.name, onceHandler);
}

export default ModalRootContext;

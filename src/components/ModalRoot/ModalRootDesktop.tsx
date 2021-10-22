import * as React from 'react';
import { classNames } from '../../lib/classNames';
import { HasPlatform } from '../../types';
import { withPlatform } from '../../hoc/withPlatform';
import { withContext } from '../../hoc/withContext';
import ModalRootContext, { ModalRootContextInterface } from './ModalRootContext';
import {
  ConfigProviderContext,
  ConfigProviderContextInterface,
  WebviewType,
} from '../ConfigProvider/ConfigProviderContext';
import { ANDROID, VKCOM } from '../../lib/platform';
import { getClassName } from '../../helpers/getClassName';
import { DOMProps, withDOM } from '../../lib/dom';
import { getNavId } from '../../lib/getNavId';
import { warnOnce } from '../../lib/warnOnce';
import { FocusTrap } from '../FocusTrap/FocusTrap';
import { ModalTransitionProps, withModalManager } from './useModalManager';
import './ModalRoot.css';

const warn = warnOnce('ModalRoot');

export interface ModalRootProps extends HasPlatform {
  activeModal?: string | null;
  /**
   * @ignore
   */
  configProvider?: ConfigProviderContextInterface;

  /**
   * Будет вызвано при закрытии активной модалки с её id
   */
  onClose?(modalId: string): void;
}

class ModalRootDesktopComponent extends React.Component<ModalRootProps & DOMProps & ModalTransitionProps> {
  private getModalRootContext(): ModalRootContextInterface {
    return {
      updateModalHeight: () => undefined,
      registerModal: ({ id, ...data }) => Object.assign(this.props.modalsState[id], data),
      onClose: () => this.props.closeActiveModal(),
      isInsideModal: true,
      animateEnter: (_id, el) => {
        el.style.opacity = '1';
      },
      enteringId: this.props.enteringModal,
      onEnter: (id) => this.props.onEnter(id),
      animateExit: (_id, el) => {
        el.style.opacity = '0';
      },
      exitingId: this.props.exitingModal,
      onExit: (id) => this.props.onExit(id),
    };
  }

  private get timeout() {
    return this.props.platform === ANDROID || this.props.platform === VKCOM ? 320 : 400;
  }

  private get modals() {
    return React.Children.toArray(this.props.children) as React.ReactElement[];
  }

  render() {
    const { exitingModal, activeModal, enteringModal } = this.props;

    if (!activeModal && !exitingModal) {
      return null;
    }

    return (
      <ModalRootContext.Provider value={this.getModalRootContext()}>
        <div
          vkuiClass={classNames(getClassName('ModalRoot', this.props.platform), {
            'ModalRoot--vkapps': this.props.configProvider.webviewType === WebviewType.VKAPPS,
          }, 'ModalRoot--desktop')}
        >
          <div
            vkuiClass="ModalRoot__mask"
            onClick={this.props.closeActiveModal}
            style={{ opacity: activeModal ? null : 0 }}
          />
          <div vkuiClass="ModalRoot__viewport">
            {this.modals.map((Modal: React.ReactElement) => {
              const modalId = getNavId(Modal.props, warn);
              if (modalId !== activeModal && modalId !== exitingModal) {
                return null;
              }

              const key = `modal-${modalId}`;

              return (
                <FocusTrap
                  restoreFocus={false}
                  onClose={this.props.closeActiveModal}
                  timeout={this.timeout}
                  key={key}
                  vkuiClass={classNames('ModalRoot__modal', {
                    'ModalRoot__modal--active': !exitingModal && !enteringModal && modalId === activeModal,
                    'ModalRoot__modal--prev': modalId === exitingModal,
                    'ModalRoot__modal--next': exitingModal && modalId === activeModal,
                  })}
                >{Modal}</FocusTrap>
              );
            })}
          </div>
        </div>
      </ModalRootContext.Provider>
    );
  }
}

export const ModalRootDesktop = withContext(
  withPlatform(
    withDOM<ModalRootProps>(
      withModalManager()(ModalRootDesktopComponent),
    ),
  ),
  ConfigProviderContext, 'configProvider');

import { AllHTMLAttributes, FC, ReactNode, MouseEvent, useRef, useState, Fragment } from 'react';
import { classNames } from '../../lib/classNames';
import { getTitleFromChildren } from '../../lib/utils';
import { usePlatform } from '../../hooks/usePlatform';
import { getClassName } from '../../helpers/getClassName';
import { useAdaptivity } from '../../hooks/useAdaptivity';
import { useDOM } from '../../lib/dom';
import { ANDROID, IOS, VKCOM } from '../../lib/platform';
import { Icon24Cancel } from '@vkontakte/icons';
import IconButton from '../IconButton/IconButton';
import { useGlobalEventListener } from '../../hooks/useGlobalEventListener';
import Tappable from '../Tappable/Tappable';
import './Removable.css';

export interface RemovableProps {
  /**
   * iOS only. Текст в выезжающей кнопке для удаления ячейки.
   */
  removePlaceholder?: ReactNode;
  /**
   * Коллбэк срабатывает при клике на контрол удаления.
   */
  onRemove?: (e: MouseEvent, rootEl?: HTMLElement) => void;
}

interface RemovableOwnProps extends AllHTMLAttributes<HTMLElement>, RemovableProps {
  /**
   * Расположение кнопки удаления.
   */
  align?: 'start' | 'center';
}

export const Removable: FC<RemovableOwnProps> = ({
  children,
  onRemove,
  removePlaceholder = 'Удалить',
  align = 'center',
  ...restProps
}: RemovableOwnProps) => {
  const platform = usePlatform();
  const { sizeY } = useAdaptivity();
  const { document } = useDOM();

  const removeButtonRef = useRef(null);
  const [removeOffset, updateRemoveOffset] = useState(0);

  useGlobalEventListener(document, 'click', removeOffset > 0 && (() => {
    updateRemoveOffset(0);
  }));

  const onRemoveTransitionEnd = () => {
    if (removeOffset > 0) {
      removeButtonRef?.current?.focus();
    }
  };

  const onRemoveActivateClick = (e: MouseEvent) => {
    e.nativeEvent.stopPropagation();
    e.preventDefault();

    if (removeButtonRef?.current) {
      updateRemoveOffset(removeButtonRef?.current.offsetWidth);
    }
  };

  const onRemoveClick = (e: MouseEvent) => {
    e.nativeEvent.stopImmediatePropagation();
    e.preventDefault();
    onRemove && onRemove(e);
  };

  const removePlaceholderString: string = getTitleFromChildren(removePlaceholder);

  return (
    <div
      {...restProps}
      vkuiClass={classNames(
        getClassName('Removable', platform),
        `Removable--${align}`,
        `Removable--sizeY-${sizeY}`,
      )}
    >
      {(platform === ANDROID || platform === VKCOM) && (
        <div vkuiClass="Removable__content">
          {children}

          <IconButton
            aria-label={removePlaceholderString}
            vkuiClass="Removable__action"
            onClick={onRemoveClick}
          >
            <Icon24Cancel role="presentation" />
          </IconButton>
        </div>
      )}

      {platform === IOS && (
        <Fragment>
          <div vkuiClass="Removable__content" style={{ transform: `translateX(-${removeOffset}px)` }}>
            <IconButton
              hasActive={false}
              hasHover={false}
              aria-label={removePlaceholderString}
              vkuiClass="Removable__action Removable__toggle"
              onClick={onRemoveActivateClick}
            >
              <i vkuiClass="Removable__toggle-in" role="presentation" />
            </IconButton>
            {children}

            <span vkuiClass="Removable__offset" aria-hidden="true"></span>
          </div>

          <Tappable
            Component="button"
            hasActive={false}
            hasHover={false}
            disabled={removeOffset > 0}
            getRootRef={removeButtonRef}
            vkuiClass="Removable__remove"
            onClick={onRemoveClick}
            onTransitionEnd={onRemoveTransitionEnd}
            style={{ transform: `translateX(-${removeOffset}px)` }}
          >
            <span vkuiClass="Removable__remove-in">{removePlaceholder}</span>
          </Tappable>
        </Fragment>
      )}
    </div>
  );
};

export type PopupDirectionFunction = (elRef: React.RefObject<HTMLDivElement>) => 'top' | 'bottom';

export interface ActionSheetProps extends React.HTMLAttributes<HTMLDivElement> {
  header?: React.ReactNode;
  text?: React.ReactNode;
  onClose?: VoidFunction;
  /**
   * Desktop only
   */
  toggleRef: Element;
  /**
   * Desktop only
   */
  popupDirection?: 'top' | 'bottom' | PopupDirectionFunction;
  /**
   * iOS only
   */
  iosCloseItem: React.ReactNode;
}

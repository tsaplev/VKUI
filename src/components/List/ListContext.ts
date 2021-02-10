import { createContext } from 'react';
import { noop } from '../../lib/utils';

export interface ListContextInterface {
  isDragging: boolean;
  toggleDrag(value: boolean): void;
}

export const ListContext = createContext<ListContextInterface>({
  isDragging: false,
  toggleDrag: noop,
});

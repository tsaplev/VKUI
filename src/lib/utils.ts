import { ReactNode } from 'react';

// Является ли переданное значение числовым
export function isNumeric(value: any): boolean {
  return !isNaN(parseFloat(value)) && isFinite(value);
}

// Является ли переданное значение функцией
export function isFunction(value: any): boolean {
  return typeof value === 'function';
}

export function hasReactNode(value: ReactNode): boolean {
  return value !== undefined && value !== false && value !== null;
}

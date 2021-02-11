import 'typescript/lib/lib.dom';

interface UnsafeSelectors {
  querySelector: ParentNode['querySelector'];
  querySelectorAll: ParentNode['querySelectorAll'];
}

interface UnsafeElementClasses {
  closest: Element['closest'];
  readonly classList: Element['classList'];
}

declare global {
  interface Document {
    /** Selectors are unsafe - cast "as UnsafeDocument" if you really need to */
    querySelector: null;
    /** Selectors are unsafe - cast "as UnsafeDocument" if you really need to */
    querySelectorAll: null;
  }

  type UnsafeDocument = UnsafeSelectors;

  interface HTMLElement {
    /** Selectors are unsafe - cast "as UnsafeHTMLElement" if you really need to */
    querySelector: null;
    /** Selectors are unsafe - cast "as UnsafeHTMLElement" if you really need to */
    querySelectorAll: null;
    /** Selectors are unsafe - cast "as UnsafeHTMLElement" if you really need to */
    closest: null;
    /** Selectors are unsafe - cast "as UnsafeHTMLElement" if you really need to */
    readonly classList: null;
  }

  type UnsafeHTMLElement = UnsafeSelectors & UnsafeElementClasses;
}

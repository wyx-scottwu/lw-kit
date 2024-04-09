import { TImportCss } from "./type";
interface IPrintByIframe {
  importCss?: TImportCss;
  cssAllInherit?: boolean;
  iframeId: string;
  printContent: Element;
}

declare namespace lwKit {
  export function isIE(): boolean
  export function isEdge(): boolean
  export function printByIframe(options: IPrintByIframe): void;
}

declare module 'lw-kit' {
  export = lwKit
}
import { isNil, isFunction, isUndefined } from 'lodash';

const STYLE_TAG_REGEX = /<style\s*[\s\S]*<\/style>/i;

export function isIE() {
  if ('documentMode' in document) return true;
  return navigator.userAgent.indexOf('MSIE') !== -1;
}

export function isEdge() {
  if ('documentMode' in window) return true;
  return !isIE()
}

/**
 * Description
 * @param {Image} image image load item
 * @returns {Promise} image loaded result
 */
function loadIframeImage(image: { naturalWidth: number; complete: boolean; }) {
  return new Promise<void>(resolve => {
    const pollImage = () => {
      !image ||
        isUndefined(image.naturalWidth) ||
        image.naturalWidth === 0 ||
        !image.complete
        ? setTimeout(pollImage, 500)
        : resolve();
    };
    pollImage();
  });
}

/**
 * Description
 * @param {Array<Image>} images - ready to be judge loaded
 * @returns {Array<Promise<Boolean>>} images loaded result
 */
function loadIframeImages(images: HTMLImageElement[]) {
  const promises = images.map(image => {
    if (image.src && image.src !== window.location.href) {
      return loadIframeImage(image);
    }
  });
  return Promise.all(promises);
}

export function performPrint(iframeElement: HTMLIFrameElement, opt: { importCss?: TImportCss; cssAllInherit?: boolean; iframeId?: string; printContent?: Element; callback?: Function; }) {
  try {
    iframeElement.focus();
    if (isEdge() || isIE()) {
      try {
        iframeElement.contentWindow?.document.execCommand('print', false);
      } catch (e) {
        iframeElement.contentWindow?.print();
      }
    } else {
      // Other browsers
      iframeElement.contentWindow?.print();
    }
    if (isFunction(opt.callback)) {
      iframeElement.contentWindow?.addEventListener('afterprint', opt.callback);
    }
  } catch (error) {
    console.log(error);
  }
}

/**
 * Description
 * @param {Object} options
 * @param {Function} [options.importCss] - to import CSS
 * @param {boolean} [options.cssAllInherit=true] - default true, to ensure if use inherited styles
 * @param {string} [options.iframeId] - use to add id property for style tag
 * @param {Element} [options.printContent] - 
 * @return void
 */
type TImportCss = () => string;
export function printByIframe(options: { importCss?: TImportCss; cssAllInherit?: boolean; iframeId: string; printContent: Element; }) {
  const { importCss, cssAllInherit = true, iframeId, printContent } = options;
  if (isNil(iframeId)) {
    throw new Error(`'iframeId' cannot be empty`);
  }
  const printIframe = document.getElementById(iframeId);
  if (printIframe) printIframe.parentNode?.removeChild(printIframe);
  const _iframe = document.createElement('iframe');
  _iframe.id = iframeId;
  Object.assign(_iframe.style, {
    position: 'absolute',
    width: '0',
    height: '0',
    visibility: 'hidden'
  })
  let css = '';
  if (isFunction(importCss)) {
    const importedCss = importCss();
    // 是否包含style标签
    if (!STYLE_TAG_REGEX.test(importedCss)) {
      const printMediaStyle = document.createElement('style');
      printMediaStyle.media = 'all';
      printMediaStyle.innerHTML = importedCss;
      css += printMediaStyle.outerHTML;
    } else {
      css += importedCss;
    }
  }
  const stylesheetSelector = cssAllInherit
    ? 'link[rel=stylesheet], style'
    : 'link[media=print], style[media=print]';

  const printMedias = document.querySelectorAll(stylesheetSelector);
  const printMediaStr = Array.prototype.filter
    .call(printMedias, Boolean)
    .map(_ => _.outerHTML)
    .join('');
  css += printMediaStr;

  _iframe.srcdoc =
    '<!DOCTYPE html><html><head><title></title><meta charset="UTF-8">' +
    css +
    '</head><body></body></html>';

  _iframe.onload = function (e) {
    let printDocument = _iframe.contentWindow || _iframe.contentDocument;
    if (printDocument && 'document' in printDocument) {
      printDocument = printDocument.document;
    }

    if (printDocument && printDocument instanceof Document) {
      printDocument.body.innerHTML = printContent.outerHTML;
    }
    // If printing images, wait for them to load inside the iframe
    const images = printDocument?.getElementsByTagName('img') || [];

    if (images.length > 0) {
      loadIframeImages(Array.from(images)).then(() =>
        performPrint(_iframe, options)
      );
    } else {
      performPrint(_iframe, options);
    }
  };
  document.body.appendChild(_iframe);
}

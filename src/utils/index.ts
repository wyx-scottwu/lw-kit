
export function isIE() {
  if ('documentMode' in document) return true;
  return navigator.userAgent.indexOf('MSIE') !== -1;
}

export function isEdge() {
  if ('documentMode' in window) return true;
  return !isIE()
}

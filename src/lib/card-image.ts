import fontUrl from '@fontsource-variable/space-grotesk/files/space-grotesk-latin-wght-normal.woff2?url';

/**
 * An SVG drawn as an image cannot load the page's fonts, so the card's Latin font is embedded as
 * a data URL before saving. If that fails the image still saves, with the system font.
 */
async function fontFace(): Promise<string> {
  try {
    const buffer = await (await fetch(fontUrl)).arrayBuffer();
    let binary = '';
    for (const byte of new Uint8Array(buffer)) binary += String.fromCharCode(byte);
    return `@font-face{font-family:'Space Grotesk Variable';font-weight:300 700;src:url(data:font/woff2;base64,${btoa(binary)}) format('woff2');}`;
  } catch {
    return '';
  }
}

/** Renders an SVG element to a PNG at its viewBox size times `scale`. */
export async function svgToPng(svg: SVGSVGElement, scale = 1): Promise<Blob> {
  const { width, height } = svg.viewBox.baseVal;
  const clone = svg.cloneNode(true) as SVGSVGElement;
  clone.setAttribute('width', String(width));
  clone.setAttribute('height', String(height));
  const style = document.createElementNS('http://www.w3.org/2000/svg', 'style');
  style.textContent = await fontFace();
  clone.prepend(style);

  const image = new Image();
  image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(new XMLSerializer().serializeToString(clone))}`;
  await image.decode();

  const canvas = document.createElement('canvas');
  canvas.width = width * scale;
  canvas.height = height * scale;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas is not available');
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve, reject) => canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('PNG encoding failed'))), 'image/png'));
}

/** Saves the image as a normal browser download. */
export function saveImage(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** True where the browser can hand an image to the system share sheet (most phones). */
export function canShareImages(): boolean {
  if (typeof navigator === 'undefined' || typeof navigator.canShare !== 'function') return false;
  return navigator.canShare({ files: [new File([], 'card.png', { type: 'image/png' })] });
}

/** Opens the system share sheet with the image and the result text. Closing the sheet is not an error. */
export async function shareImage(blob: Blob, filename: string, text: string): Promise<void> {
  try {
    await navigator.share({ files: [new File([blob], filename, { type: blob.type })], text });
  } catch (error) {
    if ((error as Error).name !== 'AbortError') throw error;
  }
}

type BrowserTextDetector = {
  detect: (source: CanvasImageSource) => Promise<Array<{ rawValue?: string }>>;
};

type BrowserTextDetectorConstructor = new () => BrowserTextDetector;

export function getTextDetectorConstructor(): BrowserTextDetectorConstructor | undefined {
  if (typeof window === "undefined") {
    return undefined;
  }

  return (window as Window & { TextDetector?: BrowserTextDetectorConstructor }).TextDetector;
}

export async function detectTextBlocksFromCanvas(canvas: HTMLCanvasElement) {
  const detectorConstructor = getTextDetectorConstructor();

  if (!detectorConstructor) {
    return null;
  }

  const detector = new detectorConstructor();
  const blocks = await detector.detect(canvas);

  return blocks.map((block) => block.rawValue ?? "").filter(Boolean);
}

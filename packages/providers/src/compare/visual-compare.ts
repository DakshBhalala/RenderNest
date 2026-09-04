import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';

export interface VisualCompareResult {
  similarity: number;
  changed: boolean;
  diffPercentage: number;
  diffBuffer: Buffer;
  width: number;
  height: number;
}

export async function comparePngBuffers(
  bufferA: Buffer,
  bufferB: Buffer,
  tolerance: number = 0.1
): Promise<VisualCompareResult> {
  const imgA = PNG.sync.read(bufferA);
  const imgB = PNG.sync.read(bufferB);

  const width = Math.max(imgA.width, imgB.width);
  const height = Math.max(imgA.height, imgB.height);

  // Normalize image A to common width/height
  const canvasA = new PNG({ width, height });
  PNG.bitblt(imgA, canvasA, 0, 0, imgA.width, imgA.height, 0, 0);

  // Normalize image B to common width/height
  const canvasB = new PNG({ width, height });
  PNG.bitblt(imgB, canvasB, 0, 0, imgB.width, imgB.height, 0, 0);

  const diff = new PNG({ width, height });

  const diffPixels = pixelmatch(
    canvasA.data,
    canvasB.data,
    diff.data,
    width,
    height,
    {
      threshold: tolerance,
      includeAA: true,
      diffColor: [255, 0, 96], // Vibrant pink/red highlight for differences
    }
  );

  const totalPixels = width * height;
  const diffRatio = totalPixels > 0 ? diffPixels / totalPixels : 0;
  const similarity = Math.max(0, Math.min(1, 1 - diffRatio));
  const changed = diffPixels > 0;
  const diffPercentage = Number((diffRatio * 100).toFixed(2));

  const diffBuffer = PNG.sync.write(diff);

  return {
    similarity: Number(similarity.toFixed(4)),
    changed,
    diffPercentage,
    diffBuffer,
    width,
    height,
  };
}

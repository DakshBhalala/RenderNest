import { extractCleanText, extractCleanMarkdown } from '../packages/providers/src/extract/content-extractor';
import { LocalExtractionProvider } from '../packages/providers/src/extract/local-extractor';

export interface SoakResult {
  iterations: number;
  initialMemoryMb: number;
  finalMemoryMb: number;
  peakMemoryMb: number;
  memoryDeltaMb: number;
  avgDurationPerIterMs: number;
  leakDetected: boolean;
  passed: boolean;
}

export async function runSoakSuite(iterations: number = 60): Promise<SoakResult> {
  console.log(`💧 Running Long-Duration Soak & Memory Stability Suite (${iterations} cycles)...\n`);

  const htmlSample = `
    <!DOCTYPE html><html><head><title>Soak Test Document</title></head><body>
      <h1>High Concurrency Soak Test</h1>
      <p>Continuous memory profile evaluation for worker processes.</p>
      ${'<div><p>Sample repeating content paragraph with numbers and words.</p></div>'.repeat(30)}
    </body></html>
  `;

  const extractor = new LocalExtractionProvider();

  // Warm-up cycle to allow V8 to compile modules and initialize runtime caches
  extractCleanText(htmlSample, 'https://soak.test/warmup');
  extractCleanMarkdown(htmlSample, 'https://soak.test/warmup');
  await extractor.extract({
    html: htmlSample,
    url: 'https://soak.test/warmup',
    schema: { title: 'string', content: 'string' },
  });

  if (global.gc) {
    global.gc();
  }

  const initialMem = process.memoryUsage().heapUsed / 1024 / 1024;
  let peakMem = initialMem;
  const memorySnapshots: number[] = [initialMem];
  const startTime = Date.now();

  for (let i = 1; i <= iterations; i++) {
    // Perform extraction and parsing cycle
    extractCleanText(htmlSample, `https://soak.test/page-${i}`);
    extractCleanMarkdown(htmlSample, `https://soak.test/page-${i}`);
    await extractor.extract({
      html: htmlSample,
      url: `https://soak.test/page-${i}`,
      schema: { title: 'string', content: 'string' },
    });

    if (i % 15 === 0) {
      const currentMem = process.memoryUsage().heapUsed / 1024 / 1024;
      memorySnapshots.push(currentMem);
      if (currentMem > peakMem) peakMem = currentMem;
      console.log(`  [Cycle ${i}/${iterations}] Current Heap: ${currentMem.toFixed(2)} MB (Peak: ${peakMem.toFixed(2)} MB)`);
    }
  }

  if (global.gc) {
    global.gc();
  }

  const duration = Date.now() - startTime;
  const finalMem = process.memoryUsage().heapUsed / 1024 / 1024;
  const deltaMem = finalMem - initialMem;
  const avgDuration = duration / iterations;

  // Memory leak defined as sustained growth exceeding 40MB without leveling off
  const leakDetected = deltaMem > 40;
  const passed = !leakDetected;

  console.log(`\nSoak Test Summary:`);
  console.log(`  Initial Heap : ${initialMem.toFixed(2)} MB`);
  console.log(`  Final Heap   : ${finalMem.toFixed(2)} MB`);
  console.log(`  Net Delta    : ${deltaMem > 0 ? '+' : ''}${deltaMem.toFixed(2)} MB`);
  console.log(`  Peak Heap    : ${peakMem.toFixed(2)} MB`);
  console.log(`  Throughput   : ${(iterations / (duration / 1000)).toFixed(1)} ops/sec (${avgDuration.toFixed(2)} ms/op)`);
  console.log(`  Status       : ${passed ? 'STABLE (No unbounded memory leaks)' : 'FAIL: Excessive memory growth'}`);

  return {
    iterations,
    initialMemoryMb: Math.round(initialMem * 100) / 100,
    finalMemoryMb: Math.round(finalMem * 100) / 100,
    peakMemoryMb: Math.round(peakMem * 100) / 100,
    memoryDeltaMb: Math.round(deltaMem * 100) / 100,
    avgDurationPerIterMs: Math.round(avgDuration * 100) / 100,
    leakDetected,
    passed,
  };
}

if (require.main === module) {
  runSoakSuite(60).then(({ passed }) => {
    process.exit(passed ? 0 : 1);
  });
}

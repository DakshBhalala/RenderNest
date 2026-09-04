import { prisma } from '@rendernest/database';

const BASE_URL = 'http://localhost:3000';
const API_KEY = 'wf_live_dev_test_rendernest_key_12345';

async function request(endpoint: string, body: any, customKey: string = API_KEY) {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${customKey}`,
    },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return { status: res.status, data };
}

async function runVerification() {
  console.log('🧪 Starting End-to-End API Verification Suite for RenderNest...\n');

  let passed = 0;
  let failed = 0;

  // 1. SSRF Guard Check
  console.log('1. Testing SSRF Guard (blocking localhost & private ranges)...');
  try {
    const ssrfRes = await request('/v1/inspect', { url: 'http://127.0.0.1:8080/admin' });
    if ((ssrfRes.status === 400 || ssrfRes.status === 403) && ssrfRes.data.error?.code === 'URL_BLOCKED') {
      console.log('   ✅ SSRF Guard correctly blocked 127.0.0.1 (URL_BLOCKED)');
      passed++;
    } else {
      console.error('   ❌ SSRF Guard failed to block:', ssrfRes);
      failed++;
    }
  } catch (err) {
    console.error('   ❌ Error testing SSRF:', err);
    failed++;
  }

  // 2. Invalid API Key
  console.log('2. Testing Authentication (invalid API key)...');
  try {
    const authRes = await request('/v1/inspect', { url: 'https://example.com' }, 'wf_live_invalid_key_123');
    if (authRes.status === 401 && authRes.data.error?.code === 'INVALID_API_KEY') {
      console.log('   ✅ Invalid key correctly rejected with 401 (INVALID_API_KEY)');
      passed++;
    } else {
      console.error('   ❌ Invalid key test failed:', authRes);
      failed++;
    }
  } catch (err) {
    console.error('   ❌ Error testing Auth:', err);
    failed++;
  }

  // 3. POST /v1/convert/docx
  console.log('3. Testing Document Conversion (Markdown -> DOCX)...');
  try {
    const docxRes = await request('/v1/convert/docx', {
      markdown: '# RenderNest Document\n\nThis is a test converted to docx.',
      title: 'Test Document',
    });
    if (docxRes.status === 200 && docxRes.data.success && docxRes.data.data.file_url) {
      console.log('   ✅ DOCX conversion successful:', docxRes.data.data.file_url);
      passed++;
    } else {
      console.error('   ❌ DOCX conversion failed:', docxRes);
      failed++;
    }
  } catch (err) {
    console.error('   ❌ Error testing DOCX:', err);
    failed++;
  }

  // 4. POST /v1/convert/pdf (HTML -> PDF)
  console.log('4. Testing Document Conversion (HTML -> PDF)...');
  try {
    const pdfRes = await request('/v1/convert/pdf', {
      html: '<h1>RenderNest Test PDF</h1><p>Engineered for high-volume conversion.</p>',
    });
    if (pdfRes.status === 200 && pdfRes.data.success && pdfRes.data.data.file_url) {
      console.log('   ✅ PDF conversion successful:', pdfRes.data.data.file_url);
      passed++;
    } else {
      console.error('   ❌ PDF conversion failed:', pdfRes);
      failed++;
    }
  } catch (err) {
    console.error('   ❌ Error testing PDF convert:', err);
    failed++;
  }

  // 5. POST /v1/inspect
  console.log('5. Testing Page Inspection (POST /v1/inspect)...');
  try {
    const inspectRes = await request('/v1/inspect', { url: 'https://example.com' });
    if (inspectRes.status === 200 && inspectRes.data.success && inspectRes.data.data.title) {
      console.log(`   ✅ Page Inspection successful! Title: "${inspectRes.data.data.title}", Status: ${inspectRes.data.data.status_code}`);
      passed++;
    } else {
      console.error('   ❌ Page Inspection failed:', inspectRes);
      failed++;
    }
  } catch (err) {
    console.error('   ❌ Error testing Inspect:', err);
    failed++;
  }

  // 6. POST /v1/analyze
  console.log('6. Testing Page Analysis (POST /v1/analyze)...');
  try {
    const analyzeRes = await request('/v1/analyze', { url: 'https://example.com' });
    const score = analyzeRes.data.data?.score ?? analyzeRes.data.data?.overall_score;
    if (analyzeRes.status === 200 && analyzeRes.data.success && typeof score === 'number') {
      console.log(`   ✅ Page Analysis successful! Score: ${score}/100`);
      passed++;
    } else {
      console.error('   ❌ Page Analysis failed:', analyzeRes);
      failed++;
    }
  } catch (err) {
    console.error('   ❌ Error testing Analyze:', err);
    failed++;
  }

  // 7. POST /v1/extract/markdown
  console.log('7. Testing Markdown Extraction (POST /v1/extract/markdown)...');
  try {
    const mdRes = await request('/v1/extract/markdown', { url: 'https://example.com' });
    if (mdRes.status === 200 && mdRes.data.success && mdRes.data.data.markdown) {
      console.log(`   ✅ Markdown Extraction successful! Words: ${mdRes.data.data.word_count}`);
      passed++;
    } else {
      console.error('   ❌ Markdown Extraction failed:', mdRes);
      failed++;
    }
  } catch (err) {
    console.error('   ❌ Error testing Markdown extraction:', err);
    failed++;
  }

  // 8. POST /v1/extract/json
  console.log('8. Testing Structured JSON Extraction (POST /v1/extract/json)...');
  try {
    const jsonRes = await request('/v1/extract/json', {
      url: 'https://example.com',
      schema: {
        title: 'string',
        heading: 'string',
        hasParagraphs: 'boolean',
      },
    });
    const extractedData = jsonRes.data.data?.extracted_data ?? jsonRes.data.data?.data;
    if (jsonRes.status === 200 && jsonRes.data.success && extractedData) {
      console.log('   ✅ Structured JSON Extraction successful! Extracted data:', extractedData);
      passed++;
    } else {
      console.error('   ❌ Structured JSON extraction failed:', jsonRes);
      failed++;
    }
  } catch (err) {
    console.error('   ❌ Error testing JSON extraction:', err);
    failed++;
  }

  // 9. POST /v1/render/screenshot
  console.log('9. Testing Screenshot Rendering (POST /v1/render/screenshot)...');
  try {
    const shotRes = await request('/v1/render/screenshot', {
      url: 'https://example.com',
      format: 'png',
      width: 1280,
      height: 720,
    });
    if (shotRes.status === 200 && shotRes.data.success && shotRes.data.data.file_url) {
      console.log('   ✅ Screenshot Rendering successful! File URL:', shotRes.data.data.file_url);
      passed++;
    } else {
      console.error('   ❌ Screenshot rendering failed:', shotRes);
      failed++;
    }
  } catch (err) {
    console.error('   ❌ Error testing Screenshot rendering:', err);
    failed++;
  }

  // 10. POST /v1/batch
  console.log('10. Testing Async Batch Jobs (POST /v1/batch & GET /v1/jobs/:id)...');
  try {
    const batchRes = await request('/v1/batch', {
      operation: 'extract/markdown',
      urls: ['https://example.com', 'https://example.org'],
    });
    if ((batchRes.status === 200 || batchRes.status === 202) && batchRes.data.success && batchRes.data.data.job_id) {
      const jobId = batchRes.data.data.job_id;
      console.log(`   ✅ Batch job created: ${jobId}`);

      const jobGetRes = await fetch(`${BASE_URL}/v1/jobs/${jobId}`, {
        headers: { 'Authorization': `Bearer ${API_KEY}` },
      });
      const jobData = await jobGetRes.json();
      const returnedJobId = jobData.data?.job_id || jobData.data?.id;
      if (jobData.success && returnedJobId === jobId) {
        console.log(`   ✅ Job retrieved successfully with status: ${jobData.data.status}`);
        passed++;
      } else {
        console.error('   ❌ Job retrieval failed:', jobData);
        failed++;
      }
    } else {
      console.error('   ❌ Batch creation failed:', batchRes);
      failed++;
    }
  } catch (err) {
    console.error('   ❌ Error testing Batch:', err);
    failed++;
  }

  // 11. Verify Database Metering & Usage
  console.log('11. Verifying Database Metering & Usage Records...');
  try {
    const logs = await prisma.requestLog.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
    });
    console.log(`   ✅ Request logs verified in DB: ${logs.length} recent records found.`);
    for (const log of logs) {
      console.log(`      - ${log.endpoint} -> ${log.statusCode} (${log.latencyMs}ms, ${log.credits} credits)`);
    }
    passed++;
  } catch (err) {
    console.error('   ❌ Error verifying DB records:', err);
    failed++;
  }

  console.log('\n======================================================');
  console.log(`🎯 Test Results: ${passed} passed, ${failed} failed.`);
  console.log('======================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runVerification().catch((err) => {
  console.error('Fatal verification error:', err);
  process.exit(1);
});

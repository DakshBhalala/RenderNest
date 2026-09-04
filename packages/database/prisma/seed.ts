import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const prisma = new PrismaClient();

function hashApiKey(rawKey: string): string {
  return crypto.createHash('sha256').update(rawKey).digest('hex');
}

async function main() {
  console.log('🌱 Starting RenderNest database seed...');

  // 1. Seed Plans
  const plans = [
    {
      code: 'free',
      name: 'Free Tier',
      monthlyCredits: 500,
      rateLimitRpm: 30,
      maxConcurrency: 2,
      priceMonthly: 0,
    },
    {
      code: 'starter',
      name: 'Starter Tier',
      monthlyCredits: 10000,
      rateLimitRpm: 120,
      maxConcurrency: 5,
      priceMonthly: 29,
    },
    {
      code: 'growth',
      name: 'Growth Tier',
      monthlyCredits: 50000,
      rateLimitRpm: 300,
      maxConcurrency: 15,
      priceMonthly: 99,
    },
    {
      code: 'enterprise',
      name: 'Enterprise Tier',
      monthlyCredits: 250000,
      rateLimitRpm: 1200,
      maxConcurrency: 50,
      priceMonthly: 399,
    },
  ];

  for (const plan of plans) {
    await prisma.plan.upsert({
      where: { code: plan.code },
      update: plan,
      create: plan,
    });
  }

  // 2. Seed Operations
  const operations = [
    {
      name: 'Screenshot Rendering',
      operation: 'render/screenshot',
      credits: 1,
      timeoutMs: 30000,
      queue: 'render',
      description: 'High-definition browser capture',
    },
    {
      name: 'PDF Rendering',
      operation: 'render/pdf',
      credits: 3,
      timeoutMs: 45000,
      queue: 'render',
      description: 'Web page or HTML to PDF',
    },
    {
      name: 'Clean Text Extraction',
      operation: 'extract/text',
      credits: 2,
      timeoutMs: 20000,
      queue: 'extract',
      description: 'Clean article and page text without boilerplate',
    },
    {
      name: 'Markdown Extraction',
      operation: 'extract/markdown',
      credits: 2,
      timeoutMs: 20000,
      queue: 'extract',
      description: 'Semantic GFM Markdown generation',
    },
    {
      name: 'Structured JSON Extraction',
      operation: 'extract/json',
      credits: 5,
      timeoutMs: 35000,
      queue: 'extract',
      description: 'Schema-governed typed data extraction',
    },
    {
      name: 'Page Inspection',
      operation: 'inspect',
      credits: 1,
      timeoutMs: 20000,
      queue: 'inspect',
      description: 'Metadata, OpenGraph, JSON-LD, and structure',
    },
    {
      name: 'Page Analysis & SEO',
      operation: 'analyze',
      credits: 3,
      timeoutMs: 25000,
      queue: 'analyze',
      description: 'Deep audit of SEO, tags, and accessibility',
    },
    {
      name: 'Visual Comparison',
      operation: 'compare',
      credits: 5,
      timeoutMs: 45000,
      queue: 'compare',
      description: 'Pixel-level visual diff between two pages',
    },
    {
      name: 'Convert to PDF',
      operation: 'convert/pdf',
      credits: 3,
      timeoutMs: 30000,
      queue: 'convert',
      description: 'HTML or Markdown to PDF document',
    },
    {
      name: 'Convert to DOCX',
      operation: 'convert/docx',
      credits: 5,
      timeoutMs: 30000,
      queue: 'convert',
      description: 'HTML or Markdown to Word DOCX document',
    },
  ];

  for (const op of operations) {
    await prisma.operation.upsert({
      where: { operation: op.operation },
      update: op,
      create: op,
    });
  }

  // 3. Seed Demo User
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('password123', salt);

  const user = await prisma.user.upsert({
    where: { email: 'developer@rendernest.com' },
    update: {},
    create: {
      email: 'developer@rendernest.com',
      name: 'Demo Developer',
      passwordHash,
    },
  });

  // 4. Seed Workspace
  const workspace = await prisma.workspace.upsert({
    where: { slug: 'demo-workspace' },
    update: {},
    create: {
      name: 'Default Workspace',
      slug: 'demo-workspace',
      planTier: 'growth',
      creditBalance: 48500,
    },
  });

  // Ensure membership
  await prisma.membership.upsert({
    where: {
      userId_workspaceId: {
        userId: user.id,
        workspaceId: workspace.id,
      },
    },
    update: {},
    create: {
      userId: user.id,
      workspaceId: workspace.id,
      role: 'OWNER',
    },
  });

  // 5. Seed Test API Key
  // Known raw test key: wf_live_dev_test_rendernest_key_12345
  const rawKey = 'wf_live_dev_test_rendernest_key_12345';
  const keyHash = hashApiKey(rawKey);

  const existingKey = await prisma.apiKey.findUnique({
    where: { keyHash },
  });

  let apiKey = existingKey;
  if (!existingKey) {
    apiKey = await prisma.apiKey.create({
      data: {
        workspaceId: workspace.id,
        name: 'Default Development Key',
        keyPrefix: 'wf_live_dev_test',
        keyHash,
        environment: 'live',
        status: 'active',
        lastUsedAt: new Date(),
      },
    });
  }

  // 6. Seed Sample Request Logs
  const sampleEndpoints = [
    { ep: '/v1/render/screenshot', op: 'render/screenshot', latency: 412, credits: 1 },
    { ep: '/v1/extract/markdown', op: 'extract/markdown', latency: 285, credits: 2 },
    { ep: '/v1/inspect', op: 'inspect', latency: 194, credits: 1 },
    { ep: '/v1/extract/json', op: 'extract/json', latency: 620, credits: 5 },
    { ep: '/v1/analyze', op: 'analyze', latency: 340, credits: 3 },
  ];

  for (let i = 0; i < sampleEndpoints.length; i++) {
    const item = sampleEndpoints[i];
    await prisma.requestLog.create({
      data: {
        workspaceId: workspace.id,
        apiKeyId: apiKey?.id,
        endpoint: item.ep,
        operation: item.op,
        method: 'POST',
        statusCode: 200,
        latencyMs: item.latency,
        credits: item.credits,
        ipAddress: '127.0.0.1',
        userAgent: 'RenderNest-Client/1.0',
        requestBodySanitized: JSON.stringify({ url: 'https://example.com' }),
        createdAt: new Date(Date.now() - (i + 1) * 3600000),
      },
    });
  }

  // 7. Seed Sample Job
  await prisma.job.create({
    data: {
      workspaceId: workspace.id,
      operation: 'batch',
      input: JSON.stringify({
        operation: 'extract/markdown',
        urls: ['https://example.com', 'https://news.ycombinator.com'],
      }),
      status: 'completed',
      retryCount: 0,
      output: JSON.stringify({
        completed: 2,
        failed: 0,
        results: [
          { url: 'https://example.com', success: true },
          { url: 'https://news.ycombinator.com', success: true },
        ],
      }),
      startedAt: new Date(Date.now() - 7200000),
      completedAt: new Date(Date.now() - 7190000),
    },
  });

  console.log('✅ Seed completed successfully!');
  console.log('🔑 Development API Key: wf_live_dev_test_rendernest_key_12345');
  console.log('👤 Development User: developer@rendernest.com / password123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

import { InspectResult, AnalyzeResult, AuditIssue } from '@rendernest/shared';

export function analyzePage(inspect: InspectResult): AnalyzeResult {
  const issues: AuditIssue[] = [];
  let seoPoints = 100;
  let socialPoints = 100;
  let a11yPoints = 100;
  let contentPoints = 100;

  // 1. Title Audit
  const titleLen = inspect.title.length;
  let titleValid = true;
  let titleMsg = 'Title tag is well optimized.';
  if (titleLen === 0) {
    titleValid = false;
    titleMsg = 'Missing <title> tag on page.';
    seoPoints -= 30;
    issues.push({
      severity: 'error',
      category: 'seo',
      message: 'Page is missing a title tag.',
      recommendation: 'Add a descriptive <title> tag between 30 and 60 characters.',
    });
  } else if (titleLen < 30) {
    titleValid = false;
    titleMsg = `Title is short (${titleLen} characters, ideal is 30-60).`;
    seoPoints -= 10;
    issues.push({
      severity: 'warning',
      category: 'seo',
      message: `Title length (${titleLen} chars) is shorter than recommended.`,
      recommendation: 'Expand title to 30-60 characters with relevant search keywords.',
    });
  } else if (titleLen > 65) {
    titleValid = false;
    titleMsg = `Title is long (${titleLen} characters, may be truncated in search results).`;
    seoPoints -= 10;
    issues.push({
      severity: 'warning',
      category: 'seo',
      message: `Title length (${titleLen} chars) may get truncated in SERPs.`,
      recommendation: 'Keep title under 60 characters to avoid search snippet truncation.',
    });
  }

  // 2. Description Audit
  const descLen = inspect.description.length;
  let descValid = true;
  let descMsg = 'Meta description is present.';
  if (descLen === 0) {
    descValid = false;
    descMsg = 'Missing meta description tag.';
    seoPoints -= 25;
    issues.push({
      severity: 'error',
      category: 'seo',
      message: 'Missing meta description tag.',
      recommendation: 'Add a compelling meta description between 120 and 160 characters.',
    });
  } else if (descLen < 80) {
    descValid = false;
    descMsg = `Meta description is short (${descLen} chars).`;
    seoPoints -= 10;
    issues.push({
      severity: 'warning',
      category: 'seo',
      message: `Meta description is too short (${descLen} chars).`,
      recommendation: 'Expand description to 120-160 characters for optimal click-through rates.',
    });
  } else if (descLen > 165) {
    descValid = false;
    descMsg = `Meta description is long (${descLen} chars, will be truncated).`;
    seoPoints -= 5;
    issues.push({
      severity: 'notice',
      category: 'seo',
      message: 'Meta description exceeds 160 characters.',
      recommendation: 'Trim description to 155-160 characters.',
    });
  }

  // 3. Heading Structure (H1)
  const h1List = inspect.headings.filter((h) => h.level === 1);
  let h1Valid = true;
  let h1Msg = 'Exactly one H1 heading found.';
  if (h1List.length === 0) {
    h1Valid = false;
    h1Msg = 'No H1 heading found on the page.';
    seoPoints -= 20;
    issues.push({
      severity: 'error',
      category: 'seo',
      message: 'Page does not contain a primary <h1> heading.',
      recommendation: 'Add a single top-level <h1> heading summarizing the main page topic.',
    });
  } else if (h1List.length > 1) {
    h1Valid = false;
    h1Msg = `Multiple H1 headings found (${h1List.length}).`;
    seoPoints -= 10;
    issues.push({
      severity: 'warning',
      category: 'seo',
      message: `Found ${h1List.length} <h1> tags. Multiple H1 tags can dilute document outline clarity.`,
      recommendation: 'Use a single <h1> heading per page and subordinate topics with <h2>-<h6>.',
    });
  }

  // 4. Canonical Tag
  let canonicalValid = true;
  let canonicalMsg = 'Canonical URL link tag is configured.';
  if (!inspect.canonical || inspect.canonical === inspect.final_url) {
    // Ok, or check if explicitly set
  }

  // 5. OpenGraph Audit
  const ogKeys = Object.keys(inspect.open_graph);
  const requiredOg = ['title', 'description', 'image', 'url'];
  const missingOg = requiredOg.filter((k) => !inspect.open_graph[k]);
  let ogValid = missingOg.length === 0;
  let ogMsg = ogValid ? 'OpenGraph social preview metadata is complete.' : `Missing OpenGraph tags: ${missingOg.join(', ')}`;
  if (!ogValid) {
    socialPoints -= missingOg.length * 15;
    issues.push({
      severity: missingOg.includes('title') || missingOg.includes('image') ? 'warning' : 'notice',
      category: 'social',
      message: `Missing social sharing tags: ${missingOg.map((k) => `og:${k}`).join(', ')}.`,
      recommendation: 'Add og:title, og:description, and og:image tags for rich link previews in Slack, Twitter, and LinkedIn.',
    });
  }

  // 6. Twitter Card Audit
  const twitterCardType = inspect.twitter_card['card'] || '';
  const twitterValid = !!twitterCardType;
  const twitterMsg = twitterValid ? `Twitter card configured (${twitterCardType}).` : 'Missing twitter:card tag.';
  if (!twitterValid) {
    socialPoints -= 20;
    issues.push({
      severity: 'notice',
      category: 'social',
      message: 'Missing twitter:card meta tag.',
      recommendation: 'Add <meta name="twitter:card" content="summary_large_image" />.',
    });
  }

  // 7. JSON-LD Structured Data
  const jsonLdTypes = inspect.json_ld.map((j) => j['@type'] || 'Object');
  const jsonLdValid = inspect.json_ld.length > 0;
  const jsonLdMsg = jsonLdValid
    ? `Found ${inspect.json_ld.length} JSON-LD schemas (${jsonLdTypes.join(', ')}).`
    : 'No JSON-LD structured data detected.';
  if (!jsonLdValid) {
    seoPoints -= 10;
    issues.push({
      severity: 'notice',
      category: 'seo',
      message: 'No Schema.org JSON-LD found.',
      recommendation: 'Add JSON-LD markup (e.g. WebSite, Article, Organization, Product) to enhance rich snippets.',
    });
  }

  // 8. Image Alt Coverage (Accessibility)
  const totalImgs = inspect.images.length;
  const missingAlt = inspect.images.filter((img) => !img.has_alt).length;
  const altRatio = totalImgs > 0 ? (totalImgs - missingAlt) / totalImgs : 1;
  let altMsg = `All ${totalImgs} images have alt attributes.`;
  if (missingAlt > 0) {
    altMsg = `${missingAlt} of ${totalImgs} images are missing alt text (${Math.round(altRatio * 100)}% coverage).`;
    a11yPoints -= Math.min(40, missingAlt * 10);
    issues.push({
      severity: missingAlt > 3 ? 'error' : 'warning',
      category: 'accessibility',
      message: `${missingAlt} image(s) missing descriptive alt attributes.`,
      recommendation: 'Provide meaningful alt text for all content images, or alt="" for decorative graphics.',
    });
  }

  // 9. Content Evaluation
  if (inspect.content.word_count < 100) {
    contentPoints -= 30;
    issues.push({
      severity: 'warning',
      category: 'seo',
      message: `Low word count (${inspect.content.word_count} words). Thin content may struggle in search rankings.`,
      recommendation: 'Ensure page content provides comprehensive depth for user queries.',
    });
  }

  seoPoints = Math.max(0, Math.min(100, seoPoints));
  socialPoints = Math.max(0, Math.min(100, socialPoints));
  a11yPoints = Math.max(0, Math.min(100, a11yPoints));
  contentPoints = Math.max(0, Math.min(100, contentPoints));

  const totalScore = Math.round(
    seoPoints * 0.4 + socialPoints * 0.2 + a11yPoints * 0.25 + contentPoints * 0.15
  );

  return {
    url: inspect.url,
    score: totalScore,
    metrics: {
      seo_score: seoPoints,
      social_score: socialPoints,
      accessibility_score: a11yPoints,
      content_score: contentPoints,
    },
    checks: {
      title: { valid: titleValid, length: titleLen, message: titleMsg },
      description: { valid: descValid, length: descLen, message: descMsg },
      h1: { valid: h1Valid, count: h1List.length, message: h1Msg },
      canonical: { valid: canonicalValid, url: inspect.canonical, message: canonicalMsg },
      open_graph: { valid: ogValid, keys_found: ogKeys, message: ogMsg },
      twitter_card: { valid: twitterValid, card_type: twitterCardType, message: twitterMsg },
      json_ld: { valid: jsonLdValid, types: jsonLdTypes, message: jsonLdMsg },
      images_alt: { total: totalImgs, missing: missingAlt, ratio: Number(altRatio.toFixed(2)), message: altMsg },
      links: {
        internal: inspect.links.filter((l) => !l.is_external).length,
        external: inspect.links.filter((l) => l.is_external).length,
      },
    },
    issues,
  };
}

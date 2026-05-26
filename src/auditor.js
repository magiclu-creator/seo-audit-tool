const fetch = require('node-fetch');
const cheerio = require('cheerio');

/**
 * Comprehensive SEO Audit Engine
 * Analyzes a webpage and returns detailed SEO metrics
 */
class SEOAuditor {
  constructor(url) {
    this.url = url;
    this.results = {
      url,
      score: 0,
      grade: '',
      timestamp: new Date().toISOString(),
      checks: [],
      summary: {},
    };
  }

  async audit() {
    try {
      const startTime = Date.now();
      const response = await fetch(this.url, {
        headers: {
          'User-Agent': 'SEO-Audit-Bot/1.0 (compatible)',
          'Accept': 'text/html',
        },
        timeout: 15000,
        redirect: 'follow',
      });

      const loadTime = Date.now() - startTime;
      const html = await response.text();
      const $ = cheerio.load(html);
      const headers = response.headers;

      // Run all checks
      this.checkMeta($, headers);
      this.checkHeadings($);
      this.checkImages($);
      this.checkLinks($);
      this.checkContent($);
      this.checkPerformance($, loadTime, html);
      this.checkMobile($);
      this.checkStructuredData($);
      this.checkSecurity(response, headers);
      this.checkSocial($);
      this.checkAccessibility($);
      this.checkTechnical($, headers);

      // Calculate overall score
      this.calculateScore();

      return this.results;
    } catch (error) {
      return {
        url: this.url,
        error: `Failed to audit: ${error.message}`,
        score: 0,
        grade: 'F',
      };
    }
  }

  addCheck(category, name, status, message, details = null) {
    this.results.checks.push({ category, name, status, message, details });
  }

  // === META TAGS ===
  checkMeta($, headers) {
    // Title
    const title = $('title').text().trim();
    if (title) {
      const len = title.length;
      if (len >= 30 && len <= 60) {
        this.addCheck('Meta', 'Title Tag', 'pass', `Title is ${len} characters (optimal: 30-60)`, { value: title, length: len });
      } else if (len > 0) {
        this.addCheck('Meta', 'Title Tag', 'warn', `Title is ${len} characters (recommended: 30-60)`, { value: title, length: len });
      }
    } else {
      this.addCheck('Meta', 'Title Tag', 'fail', 'No title tag found');
    }

    // Meta description
    const desc = $('meta[name="description"]').attr('content') || '';
    if (desc) {
      const len = desc.length;
      if (len >= 120 && len <= 160) {
        this.addCheck('Meta', 'Meta Description', 'pass', `Description is ${len} chars (optimal: 120-160)`, { value: desc, length: len });
      } else {
        this.addCheck('Meta', 'Meta Description', 'warn', `Description is ${len} chars (recommended: 120-160)`, { value: desc, length: len });
      }
    } else {
      this.addCheck('Meta', 'Meta Description', 'fail', 'No meta description found');
    }

    // Viewport
    const viewport = $('meta[name="viewport"]').attr('content');
    if (viewport) {
      this.addCheck('Meta', 'Viewport', 'pass', 'Viewport meta tag present');
    } else {
      this.addCheck('Meta', 'Viewport', 'fail', 'No viewport meta tag (bad for mobile)');
    }

    // Charset
    const charset = $('meta[charset]').attr('charset') || $('meta[http-equiv="Content-Type"]').attr('content');
    if (charset) {
      this.addCheck('Meta', 'Charset', 'pass', 'Character encoding declared');
    } else {
      this.addCheck('Meta', 'Charset', 'warn', 'No charset declaration found');
    }

    // Canonical
    const canonical = $('link[rel="canonical"]').attr('href');
    if (canonical) {
      this.addCheck('Meta', 'Canonical URL', 'pass', `Canonical: ${canonical}`);
    } else {
      this.addCheck('Meta', 'Canonical URL', 'warn', 'No canonical URL specified');
    }

    // Robots
    const robots = $('meta[name="robots"]').attr('content');
    if (robots) {
      this.addCheck('Meta', 'Robots', 'info', `Robots: ${robots}`);
    }
  }

  // === HEADINGS ===
  checkHeadings($) {
    const h1 = $('h1');
    if (h1.length === 1) {
      this.addCheck('Headings', 'H1 Tag', 'pass', `One H1 found: "${h1.first().text().trim().substring(0, 60)}"`);
    } else if (h1.length === 0) {
      this.addCheck('Headings', 'H1 Tag', 'fail', 'No H1 tag found');
    } else {
      this.addCheck('Headings', 'H1 Tag', 'warn', `Multiple H1 tags found (${h1.length}). Should have exactly one.`);
    }

    const h2Count = $('h2').length;
    const h3Count = $('h3').length;
    
    if (h2Count > 0) {
      this.addCheck('Headings', 'Heading Structure', 'pass', `Found ${h2Count} H2s and ${h3Count} H3s`);
    } else {
      this.addCheck('Headings', 'Heading Structure', 'warn', 'No H2 tags found. Add subheadings for better structure.');
    }

    // Check heading hierarchy
    let hierarchyOk = true;
    let prevLevel = 0;
    $('h1, h2, h3, h4, h5, h6').each((i, el) => {
      const level = parseInt(el.tagName[1]);
      if (level > prevLevel + 1 && prevLevel !== 0) hierarchyOk = false;
      prevLevel = level;
    });
    
    if (!hierarchyOk) {
      this.addCheck('Headings', 'Hierarchy', 'warn', 'Heading levels skip (e.g., H1 → H3). Maintain proper hierarchy.');
    }
  }

  // === IMAGES ===
  checkImages($) {
    const images = $('img');
    const totalImages = images.length;
    let missingAlt = 0;
    let emptyAlt = 0;
    let missingDimensions = 0;

    images.each((i, el) => {
      const alt = $(el).attr('alt');
      if (alt === undefined) missingAlt++;
      else if (alt === '') emptyAlt++;
      
      if (!$(el).attr('width') || !$(el).attr('height')) {
        missingDimensions++;
      }
    });

    if (totalImages === 0) {
      this.addCheck('Images', 'Image Count', 'info', 'No images found on page');
      return;
    }

    if (missingAlt === 0) {
      this.addCheck('Images', 'Alt Text', 'pass', `All ${totalImages} images have alt attributes`);
    } else {
      this.addCheck('Images', 'Alt Text', 'fail', `${missingAlt} of ${totalImages} images missing alt text`);
    }

    if (missingDimensions > 0) {
      this.addCheck('Images', 'Dimensions', 'warn', `${missingDimensions} images missing width/height (causes layout shift)`);
    } else {
      this.addCheck('Images', 'Dimensions', 'pass', 'All images have width/height attributes');
    }

    // Check for lazy loading
    let lazyCount = 0;
    images.each((i, el) => {
      if ($(el).attr('loading') === 'lazy') lazyCount++;
    });
    
    if (lazyCount > 0) {
      this.addCheck('Images', 'Lazy Loading', 'pass', `${lazyCount} images use lazy loading`);
    } else if (totalImages > 3) {
      this.addCheck('Images', 'Lazy Loading', 'warn', 'Consider adding lazy loading for images below the fold');
    }
  }

  // === LINKS ===
  checkLinks($) {
    const links = $('a[href]');
    let internal = 0;
    let external = 0;
    let nofollow = 0;
    let broken = 0;

    links.each((i, el) => {
      const href = $(el).attr('href') || '';
      if (href.startsWith('http') && !href.includes(this.url)) {
        external++;
      } else if (href.startsWith('/') || href.startsWith('#') || href.startsWith(this.url)) {
        internal++;
      }
      if ($(el).attr('rel') && $(el).attr('rel').includes('nofollow')) nofollow++;
    });

    this.addCheck('Links', 'Link Count', 'info', `${internal} internal, ${external} external links`);

    if (internal > 0) {
      this.addCheck('Links', 'Internal Links', 'pass', `${internal} internal links found`);
    } else {
      this.addCheck('Links', 'Internal Links', 'warn', 'No internal links found. Add links to other pages.');
    }
  }

  // === CONTENT ===
  checkContent($) {
    // Remove scripts and styles for word count
    const bodyClone = $('body').clone();
    bodyClone.find('script, style, nav, header, footer').remove();
    const text = bodyClone.text().replace(/\s+/g, ' ').trim();
    const wordCount = text.split(/\s+/).filter(w => w.length > 0).length;

    if (wordCount >= 300) {
      this.addCheck('Content', 'Word Count', 'pass', `${wordCount} words (good for SEO)`);
    } else if (wordCount >= 100) {
      this.addCheck('Content', 'Word Count', 'warn', `${wordCount} words (recommended: 300+)`);
    } else {
      this.addCheck('Content', 'Word Count', 'fail', `Only ${wordCount} words. Thin content hurts SEO.`);
    }

    // Check for paragraphs
    const paragraphs = $('p').length;
    if (paragraphs > 0) {
      this.addCheck('Content', 'Paragraphs', 'pass', `${paragraphs} paragraph elements found`);
    }

    // Check for lists
    const lists = $('ul, ol').length;
    if (lists > 0) {
      this.addCheck('Content', 'Lists', 'pass', `${lists} lists found (good for featured snippets)`);
    }
  }

  // === PERFORMANCE ===
  checkPerformance($, loadTime, html) {
    const sizeKB = Math.round(Buffer.byteLength(html, 'utf8') / 1024);
    
    if (loadTime < 1000) {
      this.addCheck('Performance', 'Load Time', 'pass', `${loadTime}ms (excellent)`);
    } else if (loadTime < 3000) {
      this.addCheck('Performance', 'Load Time', 'warn', `${loadTime}ms (could be faster)`);
    } else {
      this.addCheck('Performance', 'Load Time', 'fail', `${loadTime}ms (too slow!)`);
    }

    if (sizeKB < 100) {
      this.addCheck('Performance', 'Page Size', 'pass', `${sizeKB}KB (excellent)`);
    } else if (sizeKB < 500) {
      this.addCheck('Performance', 'Page Size', 'warn', `${sizeKB}KB (consider optimizing)`);
    } else {
      this.addCheck('Performance', 'Page Size', 'fail', `${sizeKB}KB (too large, optimize!)`);
    }

    // Check for render-blocking resources
    const scripts = $('script[src]').length;
    const stylesheets = $('link[rel="stylesheet"]').length;
    
    if (scripts > 5) {
      this.addCheck('Performance', 'Scripts', 'warn', `${scripts} external scripts (consider bundling)`);
    }
    if (stylesheets > 3) {
      this.addCheck('Performance', 'Stylesheets', 'warn', `${stylesheets} external stylesheets (consider bundling)`);
    }

    // Check for preconnect
    const preconnect = $('link[rel="preconnect"]').length;
    if (preconnect > 0) {
      this.addCheck('Performance', 'Preconnect', 'pass', `${preconnect} preconnect hints found`);
    }
  }

  // === MOBILE ===
  checkMobile($) {
    const viewport = $('meta[name="viewport"]').attr('content') || '';
    if (viewport.includes('width=device-width')) {
      this.addCheck('Mobile', 'Responsive', 'pass', 'Proper viewport configuration');
    } else {
      this.addCheck('Mobile', 'Responsive', 'fail', 'Missing responsive viewport');
    }

    // Check for font-size on body
    const bodyStyle = $('body').attr('style') || '';
    if (bodyStyle.includes('font-size')) {
      this.addCheck('Mobile', 'Font Size', 'info', 'Body has inline font-size');
    }
  }

  // === STRUCTURED DATA ===
  checkStructuredData($) {
    const jsonLd = $('script[type="application/ld+json"]');
    if (jsonLd.length > 0) {
      this.addCheck('Structured Data', 'JSON-LD', 'pass', `${jsonLd.length} JSON-LD block(s) found`);
    } else {
      this.addCheck('Structured Data', 'JSON-LD', 'warn', 'No JSON-LD structured data found');
    }

    // Open Graph
    const ogTitle = $('meta[property="og:title"]').attr('content');
    const ogDesc = $('meta[property="og:description"]').attr('content');
    const ogImage = $('meta[property="og:image"]').attr('content');

    if (ogTitle && ogDesc && ogImage) {
      this.addCheck('Structured Data', 'Open Graph', 'pass', 'Complete Open Graph tags');
    } else if (ogTitle || ogDesc) {
      this.addCheck('Structured Data', 'Open Graph', 'warn', 'Partial Open Graph tags (missing: ' + 
        [!ogTitle && 'title', !ogDesc && 'description', !ogImage && 'image'].filter(Boolean).join(', ') + ')');
    } else {
      this.addCheck('Structured Data', 'Open Graph', 'fail', 'No Open Graph tags (bad for social sharing)');
    }

    // Twitter Card
    const twitterCard = $('meta[name="twitter:card"]').attr('content');
    if (twitterCard) {
      this.addCheck('Structured Data', 'Twitter Card', 'pass', 'Twitter Card tags present');
    } else {
      this.addCheck('Structured Data', 'Twitter Card', 'warn', 'No Twitter Card tags');
    }
  }

  // === SECURITY ===
  checkSecurity(response, headers) {
    if (this.url.startsWith('https')) {
      this.addCheck('Security', 'HTTPS', 'pass', 'Site uses HTTPS');
    } else {
      this.addCheck('Security', 'HTTPS', 'fail', 'Site does not use HTTPS (critical!)');
    }

    const hsts = headers.get('strict-transport-security');
    if (hsts) {
      this.addCheck('Security', 'HSTS', 'pass', 'HSTS header present');
    } else {
      this.addCheck('Security', 'HSTS', 'warn', 'Missing HSTS header');
    }

    const csp = headers.get('content-security-policy');
    if (csp) {
      this.addCheck('Security', 'CSP', 'pass', 'Content Security Policy present');
    }
  }

  // === SOCIAL META ===
  checkSocial($) {
    const ogImage = $('meta[property="og:image"]').attr('content');
    if (ogImage) {
      this.addCheck('Social', 'OG Image', 'pass', `OG Image: ${ogImage.substring(0, 80)}`);
    }

    const twitterSite = $('meta[name="twitter:site"]').attr('content');
    if (twitterSite) {
      this.addCheck('Social', 'Twitter Handle', 'pass', `Twitter: ${twitterSite}`);
    }
  }

  // === ACCESSIBILITY ===
  checkAccessibility($) {
    // Language
    const lang = $('html').attr('lang');
    if (lang) {
      this.addCheck('Accessibility', 'Language', 'pass', `Language: ${lang}`);
    } else {
      this.addCheck('Accessibility', 'Language', 'warn', 'No lang attribute on <html>');
    }

    // Skip links
    const skipLink = $('a[href="#main"], a[href="#content"]').length;
    if (skipLink > 0) {
      this.addCheck('Accessibility', 'Skip Links', 'pass', 'Skip navigation link found');
    }

    // ARIA landmarks
    const main = $('main, [role="main"]').length;
    if (main > 0) {
      this.addCheck('Accessibility', 'Landmarks', 'pass', 'Main landmark found');
    } else {
      this.addCheck('Accessibility', 'Landmarks', 'warn', 'No <main> landmark found');
    }
  }

  // === TECHNICAL ===
  checkTechnical($, headers) {
    // Sitemap reference
    const sitemap = $('a[href*="sitemap"]').length;
    this.addCheck('Technical', 'Sitemap', sitemap > 0 ? 'pass' : 'info', 
      sitemap > 0 ? 'Sitemap link found' : 'No sitemap link on page (check /sitemap.xml)');

    // Favicon
    const favicon = $('link[rel="icon"], link[rel="shortcut icon"]').length;
    if (favicon > 0) {
      this.addCheck('Technical', 'Favicon', 'pass', 'Favicon found');
    } else {
      this.addCheck('Technical', 'Favicon', 'warn', 'No favicon specified');
    }

    // Server header
    const server = headers.get('server');
    if (server) {
      this.addCheck('Technical', 'Server', 'info', `Server: ${server}`);
    }

    // Cache headers
    const cache = headers.get('cache-control');
    if (cache) {
      this.addCheck('Technical', 'Cache Control', 'pass', `Cache-Control: ${cache}`);
    } else {
      this.addCheck('Technical', 'Cache Control', 'warn', 'No cache-control header');
    }
  }

  // === SCORE CALCULATION ===
  calculateScore() {
    let total = 0;
    let passed = 0;
    let warnings = 0;
    let failures = 0;

    this.results.checks.forEach(check => {
      total++;
      if (check.status === 'pass') passed++;
      else if (check.status === 'warn') warnings++;
      else if (check.status === 'fail') failures++;
    });

    // Score: pass = 100%, warn = 50%, fail = 0%
    const maxScore = total * 100;
    const actualScore = (passed * 100) + (warnings * 50);
    this.results.score = total > 0 ? Math.round((actualScore / maxScore) * 100) : 0;

    // Grade
    if (this.results.score >= 90) this.results.grade = 'A';
    else if (this.results.score >= 80) this.results.grade = 'B';
    else if (this.results.score >= 70) this.results.grade = 'C';
    else if (this.results.score >= 60) this.results.grade = 'D';
    else this.results.grade = 'F';

    this.results.summary = {
      total,
      passed,
      warnings,
      failures,
      info: total - passed - warnings - failures,
    };
  }
}

module.exports = SEOAuditor;

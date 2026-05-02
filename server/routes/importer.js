const router = require('express').Router();
const fetch = require('node-fetch');
const cheerio = require('cheerio');
const auth = require('../middleware/auth');

// Import from Dev.to by article URL or username
router.post('/devto', auth, async (req, res) => {
  const { url, username } = req.body;

  // Import single article by URL
  if (url) {
    try {
      // Extract slug from URL like https://dev.to/user/article-slug-1234
      const match = url.match(/dev\.to\/([^/]+)\/([^/?]+)/);
      if (!match) return res.status(400).json({ message: 'Invalid Dev.to URL' });
      const [, , slug] = match;

      const apiRes = await fetch(`https://dev.to/api/articles/${match[1]}/${slug}`);
      if (!apiRes.ok) return res.status(400).json({ message: 'Article not found on Dev.to' });
      const article = await apiRes.json();

      res.json({
        title: article.title,
        subtitle: article.description || '',
        content: article.body_markdown || article.body_html || '',
        coverImage: article.cover_image || article.social_image || '',
        tags: (article.tags || []).slice(0, 5),
        importedFrom: url,
      });
    } catch (e) {
      res.status(500).json({ message: 'Failed to fetch from Dev.to: ' + e.message });
    }
    return;
  }

  // Import list of articles from a Dev.to username
  if (username) {
    try {
      const apiRes = await fetch(`https://dev.to/api/articles?username=${username}&per_page=10`);
      if (!apiRes.ok) return res.status(400).json({ message: 'User not found on Dev.to' });
      const articles = await apiRes.json();
      res.json(articles.map(a => ({
        id: a.id,
        title: a.title,
        subtitle: a.description || '',
        coverImage: a.cover_image || a.social_image || '',
        tags: (a.tag_list || []).slice(0, 5),
        url: a.url,
        readTime: a.reading_time_minutes || 1,
        publishedAt: a.published_at,
      })));
    } catch (e) {
      res.status(500).json({ message: 'Failed: ' + e.message });
    }
    return;
  }

  res.status(400).json({ message: 'Provide url or username' });
});

// Import full article content for a specific Dev.to article ID
router.post('/devto/article/:id', auth, async (req, res) => {
  try {
    const apiRes = await fetch(`https://dev.to/api/articles/${req.params.id}`);
    if (!apiRes.ok) return res.status(400).json({ message: 'Article not found' });
    const article = await apiRes.json();
    res.json({
      title: article.title,
      subtitle: article.description || '',
      content: article.body_markdown || '',
      coverImage: article.cover_image || article.social_image || '',
      tags: (article.tags || []).slice(0, 5),
      importedFrom: article.url,
    });
  } catch (e) {
    res.status(500).json({ message: 'Failed: ' + e.message });
  }
});

// Scrape any URL — extract title + main content
router.post('/url', auth, async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ message: 'URL required' });

  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; WriteStack/2.0)' },
      timeout: 10000,
    });
    if (!response.ok) return res.status(400).json({ message: 'Could not fetch URL' });
    const html = await response.text();
    const $ = cheerio.load(html);

    // Extract title
    const title =
      $('h1').first().text().trim() ||
      $('meta[property="og:title"]').attr('content') ||
      $('title').text().trim() ||
      'Imported Article';

    // Extract description
    const subtitle =
      $('meta[property="og:description"]').attr('content') ||
      $('meta[name="description"]').attr('content') || '';

    // Extract cover image
    const coverImage =
      $('meta[property="og:image"]').attr('content') ||
      $('article img').first().attr('src') || '';

    // Extract main content — try article, main, .post-content etc.
    let content = '';
    const selectors = ['article', '[role="main"]', 'main', '.post-content', '.article-body', '.entry-content', '.content'];
    for (const sel of selectors) {
      const el = $(sel).first();
      if (el.length && el.text().trim().length > 200) {
        // Convert to rough markdown
        el.find('h1,h2,h3,h4').each((_, e) => {
          const tag = $(e).prop('tagName').toLowerCase();
          const hashes = tag === 'h1' ? '#' : tag === 'h2' ? '##' : '###';
          $(e).replaceWith(`\n\n${hashes} ${$(e).text().trim()}\n\n`);
        });
        el.find('p').each((_, e) => { $(e).replaceWith(`\n\n${$(e).text().trim()}\n\n`); });
        el.find('li').each((_, e) => { $(e).replaceWith(`\n- ${$(e).text().trim()}`); });
        el.find('code').each((_, e) => { $(e).replaceWith(`\`${$(e).text()}\``); });
        content = el.text().replace(/\n{3,}/g, '\n\n').trim();
        break;
      }
    }

    if (!content) {
      // Fallback: body text
      $('script,style,nav,header,footer,aside').remove();
      content = $('body').text().replace(/\s+/g, ' ').trim().slice(0, 10000);
    }

    res.json({ title, subtitle, content, coverImage, tags: [], importedFrom: url });
  } catch (e) {
    res.status(500).json({ message: 'Scrape failed: ' + e.message });
  }
});

module.exports = router;

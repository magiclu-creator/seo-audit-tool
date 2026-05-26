const express = require('express');
const cors = require('cors');
const path = require('path');
const SEOAuditor = require('./auditor');

const app = express();
const PORT = process.env.PORT || 3457;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

// API: Run SEO audit
app.post('/api/audit', async (req, res) => {
  try {
    let { url } = req.body;
    if (!url) return res.status(400).json({ error: 'URL is required' });

    // Normalize URL
    if (!/^https?:\/\//i.test(url)) url = 'https://' + url;

    try { new URL(url); } catch { return res.status(400).json({ error: 'Invalid URL' }); }

    const auditor = new SEOAuditor(url);
    const results = await auditor.audit();

    res.json({ success: true, data: results });
  } catch (error) {
    console.error('Audit error:', error);
    res.status(500).json({ error: 'Audit failed: ' + error.message });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'SEO Audit Tool' });
});

app.listen(PORT, () => {
  console.log(`🔍 SEO Audit Tool running at http://localhost:${PORT}`);
});

module.exports = app;

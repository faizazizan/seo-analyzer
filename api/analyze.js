const axios = require('axios');
const cheerio = require('cheerio');
const natural = require('natural');

const tokenizer = new natural.WordTokenizer();

const cleanText = (text) => {
    return text.replace(/\s+/g, ' ').trim();
};

const generateNGrams = (tokens, n) => {
    const ngrams = {};
    for (let i = 0; i <= tokens.length - n; i++) {
        const gram = tokens.slice(i, i + n).join(' ').toLowerCase();
        if (gram.length > 1) {
            ngrams[gram] = (ngrams[gram] || 0) + 1;
        }
    }
    return Object.entries(ngrams)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 20);
};

module.exports = async (req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { url } = req.body;
        if (!url) {
            return res.status(400).json({ error: 'URL is required' });
        }

        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });
        const html = response.data;
        const $ = cheerio.load(html);

        const title = $('title').text();
        const metaDescription = $('meta[name="description"]').attr('content') || '';
        const headings = {
            h1: [],
            h2: [],
            h3: []
        };
        $('h1').each((i, el) => headings.h1.push(cleanText($(el).text())));
        $('h2').each((i, el) => headings.h2.push(cleanText($(el).text())));
        $('h3').each((i, el) => headings.h3.push(cleanText($(el).text())));

        $('script').remove();
        $('style').remove();
        const bodyText = cleanText($('body').text());
        
        const tokens = tokenizer.tokenize(bodyText);
        const wordCount = tokens.length;

        const stopWords = new Set(['the', 'and', 'or', 'but', 'is', 'are', 'was', 'were', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'a', 'an', 'this', 'that', 'it', 'as', 'be', 'from', 'which', 'not', 'have', 'has', 'had', 'will', 'would', 'can', 'could', 'should', 'may', 'might', 'must', 'do', 'does', 'did', 'done', 'doing', 'i', 'you', 'he', 'she', 'we', 'they', 'me', 'him', 'her', 'us', 'them', 'my', 'your', 'his', 'its', 'our', 'their', 'mine', 'yours', 'hers', 'ours', 'theirs']);
        
        const filteredTokens = tokens.filter(t => !stopWords.has(t.toLowerCase()) && t.length > 2);

        const oneGrams = generateNGrams(filteredTokens, 1);
        const twoGrams = generateNGrams(filteredTokens, 2);
        const threeGrams = generateNGrams(filteredTokens, 3);

        res.json({
            meta: {
                title,
                description: metaDescription,
                url
            },
            headings,
            content: {
                wordCount,
                characterCount: bodyText.length,
                rawText: bodyText
            },
            analysis: {
                oneGrams,
                twoGrams,
                threeGrams
            }
        });

    } catch (error) {
        console.error('Analysis error:', error.message);
        res.status(500).json({ error: 'Failed to analyze URL. Please check the URL and try again.' });
    }
};

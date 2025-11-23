const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const natural = require('natural');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '.')));

const tokenizer = new natural.WordTokenizer();

// Helper to clean text
const cleanText = (text) => {
    return text.replace(/\s+/g, ' ').trim();
};

// Helper to generate N-grams
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
        .slice(0, 20); // Top 20
};

// Summarization Logic
const summarizeText = (text, ratio) => {
    if (!text) return '';

    // Simple sentence splitting
    const sentences = text.match(/[^\.!\?]+[\.!\?]+/g) || [text];
    if (sentences.length <= 1) return text;

    // Tokenize and calculate word frequency
    const wordFreq = {};
    const tokens = tokenizer.tokenize(text.toLowerCase());
    tokens.forEach(token => {
        if (token.length > 2) {
            wordFreq[token] = (wordFreq[token] || 0) + 1;
        }
    });

    // Score sentences
    const sentenceScores = sentences.map((sentence, index) => {
        const sentenceTokens = tokenizer.tokenize(sentence.toLowerCase());
        let score = 0;
        sentenceTokens.forEach(token => {
            if (wordFreq[token]) {
                score += wordFreq[token];
            }
        });
        // Normalize by length
        return {
            text: sentence.trim(),
            score: sentenceTokens.length > 0 ? score / sentenceTokens.length : 0,
            index
        };
    });

    // Sort by score
    sentenceScores.sort((a, b) => b.score - a.score);

    // Select top N sentences based on ratio
    const count = Math.max(1, Math.ceil(sentences.length * ratio));
    const topSentences = sentenceScores.slice(0, count);

    // Sort back by original index to maintain flow
    topSentences.sort((a, b) => a.index - b.index);

    return topSentences.map(s => s.text).join(' ');
};

app.post('/api/analyze', async (req, res) => {
    try {
        const { url } = req.body;
        if (!url) {
            return res.status(400).json({ error: 'URL is required' });
        }

        // Fetch URL
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });
        const html = response.data;
        const $ = cheerio.load(html);

        // 1. On-Page SEO Elements
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

        // 2. Content Analysis
        $('script').remove();
        $('style').remove();
        const bodyText = cleanText($('body').text());

        const tokens = tokenizer.tokenize(bodyText);
        const wordCount = tokens.length;

        // 3. N-gram Analysis
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
});

app.post('/api/compress', (req, res) => {
    try {
        const { text, level } = req.body;
        if (!text) return res.status(400).json({ error: 'Text is required' });

        let ratio = 1.0;
        switch (parseInt(level)) {
            case 1: ratio = 1.0; break;
            case 2: ratio = 0.75; break;
            case 3: ratio = 0.50; break;
            case 4: ratio = 0.25; break;
            case 5: ratio = 0.10; break;
            default: ratio = 1.0;
        }

        const compressedText = summarizeText(text, ratio);

        res.json({
            originalLength: text.length,
            compressedLength: compressedText.length,
            ratio: ratio,
            text: compressedText
        });

    } catch (error) {
        console.error('Compression error:', error);
        res.status(500).json({ error: 'Compression failed' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

const natural = require('natural');

const tokenizer = new natural.WordTokenizer();

const summarizeText = (text, ratio) => {
    if (!text) return '';

    const sentences = text.match(/[^\.!\?]+[\.!\?]+/g) || [text];
    if (sentences.length <= 1) return text;

    const wordFreq = {};
    const tokens = tokenizer.tokenize(text.toLowerCase());
    tokens.forEach(token => {
        if (token.length > 2) {
            wordFreq[token] = (wordFreq[token] || 0) + 1;
        }
    });

    const sentenceScores = sentences.map((sentence, index) => {
        const sentenceTokens = tokenizer.tokenize(sentence.toLowerCase());
        let score = 0;
        sentenceTokens.forEach(token => {
            if (wordFreq[token]) {
                score += wordFreq[token];
            }
        });
        return {
            text: sentence.trim(),
            score: sentenceTokens.length > 0 ? score / sentenceTokens.length : 0,
            index
        };
    });

    sentenceScores.sort((a, b) => b.score - a.score);

    const count = Math.max(1, Math.ceil(sentences.length * ratio));
    const topSentences = sentenceScores.slice(0, count);

    topSentences.sort((a, b) => a.index - b.index);

    return topSentences.map(s => s.text).join(' ');
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
};

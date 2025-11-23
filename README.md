# SEO Analyzer

A modern, fast, and SEO-optimized web application for comprehensive URL analysis. Features N-gram analysis, semantic content compression, and on-page SEO insights.

![SEO Analyzer](https://img.shields.io/badge/Node.js-18+-green) ![License](https://img.shields.io/badge/license-ISC-blue)

## Features

- **N-Gram Analysis**: Visualizes keyword frequency (1-grams) and identifies top phrases (2-grams and 3-grams)
- **Semantic Content Compressor**: Compress webpage content into 5 levels of brevity using frequency-based summarization
- **On-Page SEO**: Extract and analyze title tags, meta descriptions, and heading structure (H1-H3)
- **Keyword Density**: Calculate word count and identify top keywords with stopword filtering
- **Modern UI**: Glassmorphism design with dark mode, smooth animations, and responsive layout

## Tech Stack

- **Backend**: Node.js, Express
- **HTML Parsing**: Cheerio
- **NLP**: Natural (for tokenization and N-gram generation)
- **Frontend**: Vanilla HTML/CSS/JavaScript
- **Charts**: Chart.js

## Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd seo_analyzer
```

2. Install dependencies:
```bash
npm install
```

3. Start the server:
```bash
npm start
```

4. Open your browser and navigate to:
```
http://localhost:3000
```

## Usage

1. Enter a URL in the input field (e.g., `https://example.com`)
2. Click **Analyze** to fetch and process the webpage
3. View the results:
   - **Meta Data**: Title, description, and word count
   - **Headings Structure**: Browse H1, H2, and H3 tags
   - **Keyword Frequency**: Interactive bar chart of top keywords
   - **Top Phrases**: 2-gram and 3-gram analysis
   - **Semantic Compressor**: Use the slider to compress content (5 levels)

## API Endpoints

### POST `/api/analyze`
Analyzes a given URL and returns SEO metrics.

**Request Body:**
```json
{
  "url": "https://example.com"
}
```

**Response:**
```json
{
  "meta": {
    "title": "Example Domain",
    "description": "Example meta description",
    "url": "https://example.com"
  },
  "headings": {
    "h1": ["Main Heading"],
    "h2": ["Subheading 1", "Subheading 2"],
    "h3": []
  },
  "content": {
    "wordCount": 150,
    "characterCount": 800,
    "rawText": "Full body text..."
  },
  "analysis": {
    "oneGrams": [["keyword", 10], ["another", 5]],
    "twoGrams": [["keyword phrase", 3]],
    "threeGrams": [["long tail keyword", 2]]
  }
}
```

### POST `/api/compress`
Compresses text content to a specified level.

**Request Body:**
```json
{
  "text": "Your long text content here...",
  "level": 3
}
```

**Response:**
```json
{
  "originalLength": 1000,
  "compressedLength": 500,
  "ratio": 0.5,
  "text": "Compressed text..."
}
```

## Configuration

You can customize the server port by setting the `PORT` environment variable:

```bash
PORT=3005 npm start
```

Or on Windows PowerShell:
```powershell
$env:PORT=3005; npm start
```

## Project Structure

```
seo_analyzer/
├── server.js              # Express server and API endpoints
├── index.html             # Main HTML structure
├── style.css              # Glassmorphism UI styles
├── script.js              # Client-side logic
├── package.json           # Dependencies and scripts
├── .gitignore            # Git ignore rules
└── README.md             # This file
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

ISC

## Author

Built with ❤️ using Node.js and modern web technologies

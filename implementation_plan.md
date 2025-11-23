# SEO Analyzer Implementation Plan - Feature Update: Semantic Compressor

## Goal Description
Integrate a "Semantic Content Compressor" feature similar to `compressor.dejan.ai`. This will allow users to view the content of the analyzed URL compressed into different levels of brevity while retaining the most important information.

## User Review Required
> [!NOTE]
> **Compression Logic**: We will implement a **Frequency-Based Summarization** algorithm (similar to TextRank) locally on the server. This avoids external API costs and keeps the app fast. It will rank sentences by the significance of the keywords they contain.

## Proposed Changes

### Backend (Node.js)
#### [MODIFY] [server.js](file:///C:/Users/syede/.gemini/antigravity/scratch/seo_analyzer/server.js)
- Implement `summarizeText(text, ratio)` function:
    - Splits text into sentences.
    - Calculates word frequencies (TF).
    - Scores sentences based on word importance.
    - Returns top sentences based on the requested ratio.
- Update `/api/analyze` response to include `cleanText` (the raw body text) so the frontend can request compression on it, OR:
- [NEW] Create `/api/compress` endpoint:
    - Accepts `{ text, level }`.
    - Level 1: 100% (Original)
    - Level 2: 75%
    - Level 3: 50%
    - Level 4: 25%
    - Level 5: 10% (Summary)

### Frontend (Vanilla)
#### [MODIFY] [index.html](file:///C:/Users/syede/.gemini/antigravity/scratch/seo_analyzer/index.html)
- Add a new section: `Semantic Compressor`.
- Add UI controls: Range slider (1-5) or Buttons for compression levels.
- Add a text display area for the compressed content.
- Add stats: "Original Words" vs "Compressed Words".

#### [MODIFY] [script.js](file:///C:/Users/syede/.gemini/antigravity/scratch/seo_analyzer/script.js)
- Store the full body text from the initial analysis.
- Handle "Compress" interactions.
- Call `/api/compress` (or handle locally if we send all data, but server-side is better for heavy text).
    - *Decision*: Let's do it via API to keep client light and logic centralized.

#### [MODIFY] [style.css](file:///C:/Users/syede/.gemini/antigravity/scratch/seo_analyzer/style.css)
- Style the new Compressor card.
- Add styles for the slider/buttons and the text display area (maybe a code-block style or clean text box).

## Verification Plan
### Manual Verification
- Analyze a URL.
- Scroll to "Semantic Compressor".
- Click different levels (1-5).
- Verify the text shrinks but retains meaning.
- Verify word count stats update.

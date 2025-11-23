document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('analyzeForm');
    const urlInput = document.getElementById('urlInput');
    const analyzeBtn = document.getElementById('analyzeBtn');
    const btnText = analyzeBtn.querySelector('.btn-text');
    const btnLoader = document.getElementById('btnLoader');
    const resultsArea = document.getElementById('resultsArea');

    // Elements to populate
    const metaTitle = document.getElementById('metaTitle');
    const metaDescription = document.getElementById('metaDescription');
    const wordCount = document.getElementById('wordCount');
    const headingsContent = document.getElementById('headingsContent');
    const twoGramsList = document.getElementById('twoGramsList');
    const threeGramsList = document.getElementById('threeGramsList');

    // Compressor Elements
    const compressionLevel = document.getElementById('compressionLevel');
    const levelValue = document.getElementById('levelValue');
    const originalCharCount = document.getElementById('originalCharCount');
    const compressedCharCount = document.getElementById('compressedCharCount');
    const compressedText = document.getElementById('compressedText');

    // State
    let oneGramChart = null;
    let currentRawText = '';

    // Tab Logic
    const tabBtns = document.querySelectorAll('.tab-btn');
    let currentHeadings = {};

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active class from all
            tabBtns.forEach(b => b.classList.remove('active'));
            // Add active to clicked
            btn.classList.add('active');

            const type = btn.dataset.tab;
            renderHeadings(type);
        });
    });

    // Compressor Logic
    compressionLevel.addEventListener('input', (e) => {
        const level = e.target.value;
        const labels = ['1 (Original)', '2 (75%)', '3 (50%)', '4 (25%)', '5 (Summary)'];
        levelValue.textContent = labels[level - 1];
    });

    compressionLevel.addEventListener('change', async () => {
        if (!currentRawText) return;
        await compressContent(currentRawText, compressionLevel.value);
    });

    async function compressContent(text, level) {
        compressedText.style.opacity = '0.5';

        try {
            const response = await fetch('/api/compress', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text, level })
            });

            if (!response.ok) throw new Error('Compression failed');

            const data = await response.json();

            compressedText.textContent = data.text;
            originalCharCount.textContent = data.originalLength.toLocaleString();
            compressedCharCount.textContent = data.compressedLength.toLocaleString();

        } catch (error) {
            console.error(error);
            compressedText.textContent = 'Error compressing content.';
        } finally {
            compressedText.style.opacity = '1';
        }
    }

    function renderHeadings(type) {
        headingsContent.innerHTML = '';
        const items = currentHeadings[type] || [];

        if (items.length === 0) {
            headingsContent.innerHTML = '<div class="heading-list-item" style="color: var(--text-secondary); font-style: italic;">No headings found for this tag.</div>';
            return;
        }

        items.forEach(text => {
            const div = document.createElement('div');
            div.className = 'heading-list-item';
            div.textContent = text;
            headingsContent.appendChild(div);
        });
    }

    function renderKeywordList(element, data) {
        element.innerHTML = '';
        if (!data || data.length === 0) {
            element.innerHTML = '<div style="color: var(--text-secondary); font-style: italic;">No data available.</div>';
            return;
        }

        data.forEach(([keyword, count]) => {
            const item = document.createElement('div');
            item.className = 'keyword-item';
            item.innerHTML = `
                <span class="keyword-text">${keyword}</span>
                <span class="keyword-count">${count}</span>
            `;
            element.appendChild(item);
        });
    }

    function renderChart(data) {
        const ctx = document.getElementById('oneGramChart').getContext('2d');

        if (oneGramChart) {
            oneGramChart.destroy();
        }

        const labels = data.map(d => d[0]);
        const values = data.map(d => d[1]);

        oneGramChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Frequency',
                    data: values,
                    backgroundColor: 'rgba(56, 189, 248, 0.6)',
                    borderColor: '#38bdf8',
                    borderWidth: 1,
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        ticks: {
                            color: '#94a3b8'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            color: '#94a3b8',
                            maxRotation: 45,
                            minRotation: 45
                        }
                    }
                }
            }
        });
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const url = urlInput.value.trim();
        if (!url) return;

        // Loading State
        analyzeBtn.disabled = true;
        btnText.style.display = 'none';
        btnLoader.style.display = 'block';
        resultsArea.classList.add('hidden');

        try {
            const response = await fetch('/api/analyze', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ url })
            });

            if (!response.ok) {
                throw new Error('Analysis failed');
            }

            const data = await response.json();

            // Populate Data
            metaTitle.textContent = data.meta.title || 'No title found';
            metaDescription.textContent = data.meta.description || 'No description found';
            wordCount.textContent = data.content.wordCount;

            // Store raw text for compressor
            currentRawText = data.content.rawText;

            // Reset Compressor
            compressionLevel.value = 1;
            levelValue.textContent = '1 (Original)';
            compressedText.textContent = currentRawText;
            originalCharCount.textContent = data.content.characterCount.toLocaleString();
            compressedCharCount.textContent = data.content.characterCount.toLocaleString();

            // Headings
            currentHeadings = data.headings;
            // Trigger click on active tab to render
            const activeTab = document.querySelector('.tab-btn.active');
            renderHeadings(activeTab.dataset.tab);

            // Charts & Lists
            renderChart(data.analysis.oneGrams);
            renderKeywordList(twoGramsList, data.analysis.twoGrams);
            renderKeywordList(threeGramsList, data.analysis.threeGrams);

            // Show Results
            resultsArea.classList.remove('hidden');

            // Smooth scroll to results
            resultsArea.scrollIntoView({ behavior: 'smooth', block: 'start' });

        } catch (error) {
            alert('Error analyzing URL. Please check the URL and try again.');
            console.error(error);
        } finally {
            // Reset State
            analyzeBtn.disabled = false;
            btnText.style.display = 'block';
            btnLoader.style.display = 'none';
        }
    });
});

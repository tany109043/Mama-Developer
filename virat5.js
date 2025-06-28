// ====================================================
// 🔌 Sentiment-Analysis Integration  (NEW block)
// ====================================================
(async () => {
    const API = "http://localhost:8000";

    try {
        // 1  Launch the Python backend (no-op if already running)
        await fetch(API + "/start", { method: "POST" });

        // 2  Poll /latest every second and log to console
        let running = true;
        async function poll() {
            if (!running) return;
            try {
                const res = await fetch(API + "/latest");
                const data = await res.json();
                console.clear();
                console.table(data);
            } catch (_) {
                console.warn("Waiting for sentiment data…");
            }
            setTimeout(poll, 1000);
        }
        poll();

        // 3  Press Esc anywhere to stop analysis
        window.addEventListener("keydown", async (e) => {
            if (e.key === "Escape") {
                running = false;
                await fetch(API + "/stop", { method: "POST" });
                console.log("Emotion monitor stopped.");
            }
        });
    } catch (err) {
        console.error("⚠️ Sentiment-analysis API unreachable:", err);
    }
})();

// ==================================================
// 📘 Udemy AI Bookmarklet Tool — ARRANGED VERSION
// (with 💡 Project Evaluator)
// ==================================================
(async function () {
    if (document.getElementById('udemyAnalyzerBtn')) return;
    if (!location.hostname.includes('udemy.com')) {
        alert('⚠️ Open this on a Udemy course page.');
        return;
    }

    /*************************************************
     *  🪙 TOKEN MANAGER (unchanged)
     *************************************************/
    const TOKEN_KEY = 'udemyTokens';
    let tokenPoints = Number(localStorage.getItem(TOKEN_KEY) || 0);
    function saveTokens() { localStorage.setItem(TOKEN_KEY, tokenPoints); }
    function addTokens(delta) { tokenPoints += delta; saveTokens(); updateTokenUI(); }

    /*************************************************
     *  🔘 PRIMARY FLOATING BUTTON (📘)
     *************************************************/
    const mainBtn = document.createElement('button');
    mainBtn.id = 'udemyAnalyzerBtn';
    mainBtn.textContent = '📘';
    mainBtn.style.cssText = [
        'position:fixed', 'bottom:20px', 'right:20px',
        'background:#4CAF50', 'color:white', 'border:none',
        'border-radius:50%', 'width:60px', 'height:60px',
        'font-size:28px', 'font-weight:bold', 'cursor:move',
        'z-index:9999', 'box-shadow:0 4px 10px rgba(0,0,0,.3)'
    ].join(';');

    /*************************************************
     *  📑 ANALYSIS PANEL (flex‑layout)
     *************************************************/
    const panel = document.createElement('div');
    panel.id = 'udemyAnalysisPanel';
    panel.style.cssText = [
        'display:none', 'position:fixed', 'bottom:90px', 'right:20px',
        'width:420px', 'height:620px', 'background:#fff', 'color:#000',
        'border:1px solid #ccc', 'border-radius:12px',
        'box-shadow:0 4px 14px rgba(0,0,0,.3)',
        'font-family:sans-serif', 'font-size:14px', 'line-height:1.45',
        'z-index:9999', 'display:flex', 'flex-direction:column', 'overflow:hidden'
    ].join(';');

    // ▸ close (absolute so it stays top‑right)
    const closeBtn = document.createElement('button');
    closeBtn.textContent = '✖';
    closeBtn.style.cssText = 'position:absolute;top:6px;right:8px;background:none;border:none;font-size:18px;cursor:pointer;';
    closeBtn.onclick = () => (panel.style.display = 'none');
    panel.appendChild(closeBtn);

    // ▸ HEADER BAR (Daily Question lives here)
    const headerBar = document.createElement('div');
    headerBar.style.cssText = 'padding:10px 14px 6px 14px;border-bottom:1px solid #eee;flex:0 0 auto;display:flex;align-items:center;gap:10px;';
    panel.appendChild(headerBar);

    // 🗓️ Daily Question button (present from the start)
    const dqBtn = document.createElement('button');
    dqBtn.textContent = '🗓️ Daily Question';
    dqBtn.style.cssText = 'padding:6px 14px;background:#3f51b5;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:13px;';
    headerBar.appendChild(dqBtn);

    // ▸ BODY WRAPPER (scrolls) — contains analysis + modules
    const bodyWrap = document.createElement('div');
    bodyWrap.style.cssText = 'flex:1 1 auto;overflow:auto;padding:14px;';
    panel.appendChild(bodyWrap);

    // ▸ Analysis block
    const analysisBox = document.createElement('div');
    analysisBox.id = 'analysisBox';
    bodyWrap.appendChild(analysisBox);

    // ▸ Divider
    const divider = document.createElement('hr');
    divider.style.cssText = 'margin:18px 0;border:none;border-top:1px dashed #ccc;';
    bodyWrap.appendChild(divider);

    // ▸ Modules block (populated later)
    const modulesBox = document.createElement('div');
    modulesBox.id = 'modulesBox';
    bodyWrap.appendChild(modulesBox);

    // ▸ DividerTwo
    const dividerTwo = document.createElement('hr');
    dividerTwo.style.cssText = 'margin:18px 0;border:none;border-top:1px dashed #ccc;';
    bodyWrap.appendChild(dividerTwo);

    const evalResult = document.createElement('div');
    evalResult.id = 'evalResult';
    bodyWrap.appendChild(evalResult);

    // ▸ DividerThree
    const dividerThree = document.createElement('hr');
    dividerThree.style.cssText = 'margin:18px 0;border:none;border-top:1px dashed #ccc;';
    bodyWrap.appendChild(dividerThree);

    const chatResult = document.createElement('div');
    chatResult.id = 'chatResult';
    bodyWrap.appendChild(chatResult);

    // ▸ BOTTOM BAR (Ask + Meme) fixed inside panel
    const bottomBar = document.createElement('div');
    bottomBar.style.cssText = 'flex:0 0 auto;padding:10px 14px;border-top:1px solid #eee;display:flex;align-items:center;gap:8px;';

    const askInput = document.createElement('textarea');
    askInput.placeholder = 'Ask anything…';
    askInput.style.cssText = 'flex:1;min-height:60px;max-height:120px;padding:6px;border:1px solid #ccc;border-radius:6px;resize:vertical;';

    const askBtn = document.createElement('button');
    askBtn.textContent = 'Ask';
    askBtn.style.cssText = 'padding:8px 16px;background:#007BFF;color:#fff;border:none;border-radius:6px;cursor:pointer;';

    // 🎭 Meme button (circular, disabled if no tokens)
    const topic = document.querySelector("h1").textContent.trim();
    const memeBtn = document.createElement('button');
    memeBtn.id = 'udemyMemeBtn';
    memeBtn.textContent = '🎭';
    memeBtn.title = 'Generate Meme';
    memeBtn.style.cssText = [
        'width:46px', 'height:46px', 'border-radius:50%',
        'background:#ff5722', 'color:#fff', 'border:none',
        'font-size:20px', 'cursor:pointer'
    ].join(';');

    bottomBar.append(askInput, askBtn, memeBtn);
    panel.appendChild(bottomBar);

    document.body.appendChild(panel);

    //  ↳ token badge (attached to mainBtn) & token UI
    function updateTokenUI() {
        if (!window.tokenBadge) {
            window.tokenBadge = document.createElement('span');
            window.tokenBadge.style.cssText = 'display:inline-block;margin-left:6px;padding:0 8px;background:#ffd54f;color:#000;border-radius:14px;font-size:12px;font-weight:bold;vertical-align:middle;';
            memeBtn.appendChild(window.tokenBadge);
        }
        window.tokenBadge.textContent = `💰 ${tokenPoints}`;
        memeBtn.disabled = tokenPoints <= 0;
        memeBtn.style.opacity = memeBtn.disabled ? 0.5 : 1;
    }
    updateTokenUI();
    setTimeout(updateTokenUI, 0);

    /*************************************************
     *  📦  DRAG‑MOVE behaviour for 📘 button & panel
     *************************************************/
    let moved = false;
    mainBtn.onmousedown = e => {
        moved = false;
        e.preventDefault();
        const sx = e.clientX - mainBtn.getBoundingClientRect().left;
        const sy = e.clientY - mainBtn.getBoundingClientRect().top;
        const moveHandler = e => {
            moved = true;
            mainBtn.style.left = e.pageX - sx + 'px';
            mainBtn.style.top = e.pageY - sy + 'px';
            mainBtn.style.bottom = 'auto';
            mainBtn.style.right = 'auto';
            panel.style.left = parseInt(mainBtn.style.left) + 'px';
            panel.style.top = parseInt(mainBtn.style.top) - 650 + 'px';
        };
        document.addEventListener('mousemove', moveHandler);
        mainBtn.onmouseup = () => {
            document.removeEventListener('mousemove', moveHandler);
            mainBtn.onmouseup = null;
        };
    };
    mainBtn.ondragstart = () => false;

    /*************************************************
     *  🛠️ COHERE HELPER
     *************************************************/
    const apiKey = 'zXH8KUSA3ncfZcxvIAZx5boAlGlTirN6LJmp706Q';
    const endpoint = 'https://api.cohere.ai/v1/generate';
    const cohereQuery = async (prompt, max = 400, temp = 0.7) => {
        const res = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ model: 'command-r-plus', prompt, max_tokens: max, temperature: temp })
        });
        const data = await res.json();
        return data.generations?.[0]?.text || '⚠️ No response';
    };

    const cohereQueryy = async (prompt, max = 450, temp = 0.6) => {
        const res = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ model: 'command-r-plus', prompt, max_tokens: max, temperature: temp })
        });
        const data = await res.json();
        return data.generations?.[0]?.text || '⚠️ No response';
    };
    /******************* Transcript Fetcher **************/
    async function fetchTranscript() {
        // Preferred selector supplied by user
        const attrSel = '[data-purpose="transcript-panel"] span';
        let spans = Array.from(document.querySelectorAll(attrSel));
        if (spans.length) return spans.map(s => s.textContent.trim()).join(' ');

        // Fallback to cue classes
        const cueSel = '.transcript--highlight-cue--3T2w2,.transcript--transcript-cue--1pkkC,.ud-transcript-cue';
        for (let i = 0; i < 4; i++) {
            spans = Array.from(document.querySelectorAll(cueSel));
            if (spans.length) return spans.map(s => s.innerText.trim()).join(' ');
            await new Promise(r => setTimeout(r, 300));
        }
        return '';
    }

    /******************* UI Helpers **********************/
    // Floating Helper button
    const helperBtn = document.createElement('button');
    helperBtn.id = 'udemyHelperBtn';
    helperBtn.textContent = '🛠';
    helperBtn.title = 'Open Helper';
    helperBtn.style.cssText = [
        'margin-left:10px',               // adds spacing from dqBtn
        'padding:6px 14px',
        'background:#673ab7',
        'color:#fff',
        'border:none',
        'border-radius:6px',
        'cursor:pointer',
        'font-size:13px'
    ].join(';');

    // Pop‑up mini panel containing the two inner buttons
    const mini = document.createElement('div');
    mini.style.cssText = [
        'display:none',
        'position:absolute',                 // absolute for dynamic positioning
        'width:260px',
        'padding:12px',
        'background:#fff',
        'border:2px solid #888',
        'border-radius:10px',
        'box-shadow:0 6px 18px rgba(0,0,0,.35)',
        'z-index:10000',
        'font-family:sans-serif'
    ].join(';');
    const makeInnerBtn = (label, bg) => {
        const b = document.createElement('button');
        b.textContent = label;
        b.style.cssText = `width:100%;margin:6px 0;padding:8px;border:none;border-radius:6px;font-size:14px;color:#fff;background:${bg};cursor:pointer;`;
        mini.appendChild(b);
        return b;
    };

    const notesInner = makeInnerBtn('📑 Generate Notes', '#009688');
    const exampleInner = makeInnerBtn('🌍 Real‑World Analogy', '#8e24aa');

    // Toggle mini panel
    helperBtn.onclick = () => {
        mini.style.display = mini.style.display === 'none' ? 'block' : 'none';
    };

    /******************* Output Window Factory ***********/
    function createWindow(title, enablePDF = false) {
        const wrapp = document.createElement('div');
        wrapp.style = 'position:fixed;bottom:160px;right:20px;width:320px;max-height:320px;overflow:auto;padding:12px;background:#fff;border:2px solid #666;border-radius:10px;box-shadow:0 4px 14px rgba(0,0,0,.3);z-index:10001;';
        const close = document.createElement('button');
        close.textContent = '✖';
        close.style = 'position:absolute;top:6px;right:8px;border:none;background:none;font-size:16px;cursor:pointer;color:#555;';
        close.onclick = () => wrapp.remove();
        const h = document.createElement('h4'); h.textContent = title; h.style = 'margin:0 0 8px;font-size:15px;color:#333;';
        const ta = document.createElement('textarea'); ta.style = 'width:100%;height:200px;padding:6px;font-size:13px;resize:none;';
        wrapp.append(close, h, ta);
        if (enablePDF) {
            const pdfBtn = document.createElement('button');
            pdfBtn.textContent = '⬇️ PDF';
            pdfBtn.style = 'margin-top:6px;padding:6px 12px;border:none;border-radius:4px;background:#2196f3;color:#fff;cursor:pointer;';
            pdfBtn.onclick = async () => {
                if (!window.html2pdf) { await new Promise(r => { const s = document.createElement('script'); s.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js'; s.onload = r; document.body.appendChild(s); }); }
                html2pdf().from(ta.value.replace(/\n/g, '<br>')).set({ filename: `${title.replace(/\s+/g, '_')}.pdf`, margin: 10 }).save();
            };
            wrapp.appendChild(pdfBtn);
        }
        document.body.appendChild(wrapp);
        return ta;
    }

    /******************* Prompts **************************/
    const notesPrompt = transcript => `You are an expert note-taker for online lectures. Based on the following transcript, perform these tasks:

1. Summarize the key concepts in *short, effective bullet points*. Use simple language.
2. Highlight important definitions or formulas clearly.
3. Create a *flowchart-style explanation* for any process, step-by-step method, or hierarchy mentioned. Use clear arrows (→) or bullet indentation to show structure.

Make sure:
- The notes are concise and helpful for revision.
- The flowcharts are readable in plain text.
- All unnecessary details are removed.

Transcript:
""" 
${transcript}
"""
`;

    const analogyPrompt = transcript => `You are an expert teacher who simplifies technical ideas with analogies. From the transcript below, identify the primary concept, then craft **one bold one‑liner analogy** followed by a 2‑line explanation.\nTranscript:\n"""\n${transcript}\n"""`;

    /******************* Inner Button Logic ***************/
    notesInner.onclick = async () => {
        notesInner.textContent = '⏳ Notes…';
        const tx = await fetchTranscript();
        if (!tx) { alert('❌ Transcript not found'); return notesInner.textContent = '📑 Generate Notes'; }
        const out = await cohereQueryy(notesPrompt(tx), 550, 0.55);
        const ta = createWindow('Smart Notes', true);
        ta.value = out;
        notesInner.textContent = '📑 Generate Notes';
    };

    exampleInner.onclick = async () => {
        exampleInner.textContent = '⏳ Example…';
        const tx = await fetchTranscript();
        if (!tx) { alert('❌ Transcript not found'); return exampleInner.textContent = '🌍 Real‑World Analogy'; }
        const out = await cohereQueryy(analogyPrompt(tx), 180, 0.7);
        const ta = createWindow('Real‑World Analogy');
        ta.value = out;
        exampleInner.textContent = '🌍 Real‑World Analogy';
    };
    // Attach elements to page

    document.body.appendChild(mini);
    dqBtn.style.cssText = 'padding:6px 14px;background:#3f51b5;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:13px;';
    headerBar.appendChild(helperBtn);

    /*************************************************
     *  🔄 MAIN BUTTON CLICK HANDLER
     *************************************************/
    mainBtn.onclick = async () => {
        if (moved) return (moved = false);  // preserve drag logic
        panel.style.display = (panel.style.display === 'none' || !panel.style.display) ? 'flex' : 'none';
    };


    // show panel loader
    panel.style.display = 'flex';
    analysisBox.innerHTML = '<b>⏳ Analyzing course…</b>';
    modulesBox.innerHTML = '';

    // gather course info
    const url = location.href;
    const title = document.querySelector('h1')?.innerText || 'Untitled Course';

    try {
        addTokens(20);
        /***** 1️⃣ Course Analysis *****/
        const analysisPrompt = `You are an expert educational analyst.
Study the Udemy course below and reply in the EXACT template that follows—no preamble or extras.
Course Title: ${title}
Course URL: ${url}

TEMPLATE
Modules (up to 8)
- Module Title: Key skill or topic (1 sentence, max 15 words)

Drawbacks (up to 3, max 12 words each)
- Drawback 1
- Drawback 2
- Drawback 3

Learning Outcomes (5, max 12 words each)
1. Outcome 1
2. Outcome 2
3. Outcome 3
4. Outcome 4
5. Outcome 5

In-depth Details
- Provide a concise but thorough summary of the course content, structure, teaching approach, and any unique features. Use only information visible on the course page. Do not add conclusions or advice. Do not use any symbols like # or * in your response. Use plain text only. Keep the total response under 220 words. Ensure the text is well-aligned and easy to read.
`;

        const analysis = await cohereQuery(analysisPrompt, 650);
        // Custom styled box with equal margin and no markdown symbols
        analysisBox.innerHTML = `
    <div style="
        margin: 0 auto;
        max-width: 95%;
        background: #f8f9fa;
        padding: 22px 32px 22px 32px;
        border-radius: 12px;
        border: 1px solid #e0e0e0;
        box-sizing: border-box;
        text-align: justify;
        font-family: inherit;
        font-size: 15px;
        line-height: 1.7;
        color: #222;
        display: flex;
        flex-direction: column;
        align-items: center;
    ">
        <div style="
            width: 100%;
            max-width: 700px;
            margin: 0 auto;
            text-align: justify;
            word-break: break-word;
        ">
            <div style="font-weight:bold;text-align:center;margin-bottom:18px;">Course Analysis</div>
            ${analysis.replace(/[#*]/g, '').replace(/\n/g, '<br>')}
        </div>
    </div>
`;
        /***** 2️⃣ Modules List *****/
        const mods = [...document.querySelectorAll('div[data-purpose="curriculum-section-container"] h3')];
        if (!mods.length) {
            modulesBox.innerHTML = '<b>📂 Modules</b><br><br>❌ Could not detect modules.';
        } else {
            modulesBox.innerHTML = '<b>📂 Modules</b><br><br>';

            // checklist for each module
            mods.forEach((m, i) => {
                const key = 'udemyMod-' + i;
                const wrap = document.createElement('label');
                wrap.style.cssText = 'display:block;margin:4px 0;cursor:pointer;';
                const chk = document.createElement('input');
                chk.type = 'checkbox';
                chk.checked = localStorage.getItem(key) === '1';
                chk.onchange = () => localStorage.setItem(key, chk.checked ? '1' : '0');
                wrap.append(chk, ' ', m.innerText.trim());
                modulesBox.appendChild(wrap);
            });

            // action buttons
            const btnRow = document.createElement('div');
            btnRow.style.cssText = 'margin-top:10px;display:flex;gap:10px;flex-wrap:wrap;';
            modulesBox.appendChild(btnRow);

            const projBtn = document.createElement('button');
            projBtn.textContent = '🎯 Suggest Projects';
            projBtn.style.cssText = 'padding:6px 12px;background:#28a745;color:#fff;border:none;border-radius:6px;cursor:pointer;';
            btnRow.appendChild(projBtn);

            const quizBtn = document.createElement('button');
            quizBtn.textContent = '📝 Quiz Me';
            quizBtn.style.cssText = 'padding:6px 12px;background:#ffc107;color:#000;border:none;border-radius:6px;cursor:pointer;';
            btnRow.appendChild(quizBtn);

            /* --- QUIZ ME ------------------------------------ */
            let overlay = document.getElementById('udemyoverlay');
            if (!overlay) {
                overlay = document.createElement('div');
                overlay.id = 'udemyoverlay';
                overlay.style.cssText =
                    'display:none;position:fixed;top:10%;left:10%;width:80%;height:80%;background:#fffbd6;' +
                    'border:6px solid #ff9800;border-radius:20px;z-index:10000;padding:25px;overflow:auto;' +
                    'box-shadow:0 8px 25px rgba(0,0,0,.4);font-family:sans-serif;';
                document.body.appendChild(overlay);
            }

            quizBtn.onclick = async () => {
                const chosen = mods
                    .filter((_, i) => localStorage.getItem('udemyMod-' + i) === '1')
                    .map(m => m.innerText.trim());

                if (!chosen.length) return alert('Select modules first.');

                overlay.innerHTML = '<h2>📝 Generating quiz…</h2>';

                const qPrompt =
                    `You are an advanced technical‑course quiz generator.\n` +
                    `Generate EXACTLY 5 high‑quality MCQs based ONLY on these modules:\n` +
                    `${chosen.join('\n')}\n\n` +
                    `Rules:\n` +
                    `• 2 easy, 2 medium, 1 hard\n` +
                    `• 4 options (A–D); exactly ONE correct\n` +
                    `• Wrap the correct option in <span class="answer"></span>\n` +
                    `• Format strictly:\n` +
                    `Q1. <question>\nA) <opt>\nB) <opt>\nC) <opt>\nD) <opt>\n\n` +
                    `Begin:`;

                try {
                    const txt = await cohereQuery(qPrompt, 650);
                    overlay.style.display = 'block';
                    overlay.innerHTML =
                        '<button id="closeQuiz" style="position:absolute;top:15px;right:20px;font-size:20px;' +
                        'background:#f44336;color:white;border:none;border-radius:4px;padding:4px 12px;cursor:pointer;">✖</button>' +
                        '<h2 style="text-align:center;margin:10px 0 20px">📝 Module Quiz</h2>' +
                        '<form id="quizForm" style="font-size:16px;line-height:1.6"></form>' +
                        '<button id="submitQuiz" style="margin-top:25px;display:block;background:#4caf50;color:white;' +
                        'border:none;padding:10px 20px;border-radius:6px;cursor:pointer;margin-left:auto;margin-right:auto;">Show Answers</button>' +
                        '<div id="scoreBox" style="text-align:center;font-size:18px;margin-top:15px;font-weight:bold;"></div>';

                    document.getElementById('closeQuiz').onclick = () => (overlay.style.display = 'none');
                    const form = overlay.querySelector('#quizForm');

                    /* --- split Cohere output into 5 blocks --- */
                    const blocks = txt.match(/(?:Q?\d+[.)])[\s\S]*?(?=(?:Q?\d+[.)])|$)/g) || [];

                    const correctMap = [];
                    blocks.forEach((blk, qi) => {
                        const lines = blk.trim().split('\n').filter(Boolean);

                        /* NEW — fallback for “Answer: X” format */
                        const answerLetter = (blk.match(/Answer\s*[:\-]?\s*([A-D])/i) || [])[1]?.toUpperCase() || null;

                        const qLine = lines.shift();
                        const qDiv = document.createElement('div');
                        qDiv.style.marginBottom = '20px';
                        qDiv.innerHTML = `<b>${qLine.replace(/^Q?\d+[.)]\s*/, '')}</b><br><br>`;

                        /* extract A‑D */
                        const options = lines.slice(0, 4).map((line) => {
                            const letter = line.trim().charAt(0).toUpperCase();          // A/B/C/D
                            const isCorrect = /class=["']answer["']/.test(line) ||          // span‑tag way
                                (answerLetter && letter === answerLetter);     // Answer: X fallback
                            const text = line
                                .replace(/<span class=["']answer["']>/, '')
                                .replace('</span>', '')
                                .replace(/^[A-Da-d][).]\s*/, '')
                                .trim();
                            return { text, isCorrect };
                        });

                        /* shuffle so correct option isn’t always fixed */
                        for (let i = options.length - 1; i > 0; i--) {
                            const j = Math.floor(Math.random() * (i + 1));
                            [options[i], options[j]] = [options[j], options[i]];
                        }

                        options.forEach((opt, oi) => {
                            const id = `q${qi}o${oi}`;
                            const radio = document.createElement('input');
                            radio.type = 'radio';
                            radio.name = `q${qi}`;
                            radio.id = id;
                            radio.dataset.correct = opt.isCorrect;
                            const label = document.createElement('label');
                            label.htmlFor = id;
                            label.style.cssText =
                                'display:block;margin:6px 0;padding:6px 10px;border-radius:5px;' +
                                'cursor:pointer;border:1px solid #ccc;';
                            label.appendChild(radio);
                            label.appendChild(document.createTextNode(' ' + opt.text));
                            qDiv.appendChild(label);
                            if (opt.isCorrect) correctMap[qi] = label;
                        });
                        form.appendChild(qDiv);
                    });

                    overlay.querySelector('#submitQuiz').onclick = () => {
                        let right = 0;
                        correctMap.forEach((correctLabel, qi) => {
                            const chosen = form.querySelector(`input[name="q${qi}"]:checked`);
                            if (chosen) {
                                const chosenLabel = form.querySelector(`label[for="${chosen.id}"]`);
                                if (chosen.dataset.correct === 'true') {
                                    chosenLabel.style.background = '#c8e6c9';
                                    right++;
                                } else {
                                    chosenLabel.style.background = '#ffcdd2';
                                    correctLabel.style.background = '#e0f2f1';
                                }
                            } else {
                                correctLabel.style.background = '#e0f2f1';
                            }
                        });
                        const pct = Math.round((right / correctMap.length) * 100);
                        addTokens(right);
                        overlay.querySelector('#scoreBox').textContent =
                            `🎯 You scored ${right}/${correctMap.length} (${pct}%)`;
                    };
                } catch (err) {
                    overlay.innerHTML =
                        '<p style="color:red;text-align:center">❌ Failed to generate quiz.</p>';
                    console.error(err);
                }
            };

            /* --- Project Suggestions --- */
            const ideasDiv = document.createElement('div');
            ideasDiv.style.cssText = 'margin-top:12px;white-space:pre-wrap;';
            modulesBox.appendChild(ideasDiv);

            projBtn.onclick = async () => {
                const selected = mods.filter((_, i) => localStorage.getItem('udemyMod-' + i) === '1').map(m => m.innerText.trim());
                if (!selected.length) return alert('Select modules first.');
                ideasDiv.innerHTML = '<b>⏳ Fetching ideas…</b>';
                const projPrompt = `
You are an expert project mentor.
Given these course modules:
${selected.join('\n')}

Suggest exactly five hands-on project ideas that directly apply the skills or concepts from these modules.
For each project, provide:
- A clear project title (max 10 words, no symbols)
- A concise description (max 25 words, plain text, no # or *)

Guidelines:
• Only use information from the listed modules.
• Do not add extra commentary or sections.
• Use plain, clear language.
• Keep the total response under 180 words.
• Do not use any markdown or special symbols.

Format strictly:
1. <Project Title>: <Description>
2. <Project Title>: <Description>
3. <Project Title>: <Description>
4. <Project Title>: <Description>
5. <Project Title>: <Description>
`.trim();

                const txt = await cohereQuery(projPrompt, 400);
                ideasDiv.innerHTML = `
    <div style="
        margin-left: auto;
        margin-right: auto;
        max-width: 95%;
        background: #f8f9fa;
        padding: 18px 32px;
        border-radius: 10px;
        border: 1px solid #e0e0e0;
        box-sizing: border-box;
        font-family: inherit;
        font-size: 15px;
        line-height: 1.7;
        color: #222;
        display: flex;
        flex-direction: column;
        align-items: center;
    ">
        <b style="display:block;text-align:center;font-size:18px;margin-bottom:12px;">🚀 Project Ideas:</b>
        <div style="width:100%;max-width:500px;text-align:left;">
            ${txt
                        .replace(/[#*]/g, '')
                        .replace(/\n{2,}/g, '\n') // Remove extra blank lines
                        .split(/\n+/)
                        .map(line => line.trim())
                        .filter(line => line)
                        .map(line => {
                            const match = line.match(/^(\d+\.\s*)([^:]+):\s*(.*)$/);
                            if (match) {
                                const [_, number, title, desc] = match;
                                return `<div style="margin-bottom:10px;"><b>${number}${title}</b>: ${desc}</div>`;
                            }
                            return `<div style="margin-bottom:10px;">${line}</div>`;
                        })
                        .join('')}
        </div>
    </div>
`;

            };

            /* --- Quiz Me --- */ /* (unchanged – code omitted for brevity) */
            /* -------- END OF ORIGINAL MODULE SECTION -------- */

            /*************************************************
             *  💡 PROJECT EVALUATOR  🔽  (NEW)
             *************************************************/
            const ghInput = document.createElement('input');
            ghInput.type = 'text';
            ghInput.placeholder = 'Paste your GitHub project link...';
            ghInput.style.cssText =
                'margin-top:18px;width:100%;padding:6px;border:1px solid #ccc;border-radius:4px;';
            evalResult.appendChild(ghInput);

            const evalBtn = document.createElement('button');
            evalBtn.textContent = '🧠 Evaluate Project';
            evalBtn.style.cssText =
                'margin-top:10px;padding:6px 12px;border:none;background:#9c27b0;color:white;border-radius:4px;cursor:pointer;';
            evalResult.appendChild(evalBtn);

            evalBtn.onclick = async () => {
                const link = ghInput.value.trim();
                if (!link.startsWith('https://github.com/')) {
                    alert('❌ Please enter a valid GitHub repository link.');
                    return;
                }
                evalResult.innerHTML = '🔍 Evaluating project… please wait...';

                const evalPrompt =
                    `You are a software quality expert. A student submitted this GitHub project for review:\n\n${link}\n\n` +
                    `Carefully analyze the repo based on common criteria like:\n` +
                    `- Code structure and readability\n- Proper documentation and README\n- Modularity and best practices\n- Use of version control (commits, branches)\n- Innovation or uniqueness\n\n` +
                    `Give constructive suggestions to improve.\nThen rate the project on a scale of 1 to 10 and justify the rating.\n\n` +
                    `Respond in this format:\n---\nSuggestions:\n<your suggestions>\n\nRating: <score>/10\n---`;

                try {
                    const feedback = await cohereQuery(evalPrompt, 500);
                    evalResult.innerHTML = '✅ <b>Evaluation:</b><br><br>' + feedback.replace(/\n/g, '<br>');
                } catch (err) {
                    evalResult.innerHTML =
                        '<span style="color:red">❌ Error evaluating project – see console.</span>';
                    console.error(err);
                }
            };
            /*************** END PROJECT EVALUATOR ***************/
        }
    } catch (err) {
        analysisBox.innerHTML = '<span style="color:red">❌ Error – see console.</span>';
        console.error(err);
    }
    /*************************************************
     *  💬 ASK ANYTHING
     *************************************************/
    askBtn.onclick = async () => {
        const q = askInput.value.trim();
        if (!q) return;
        askBtn.disabled = true;
        chatResult.insertAdjacentHTML('beforeend', '<br><b>🔸 You:</b> ' + q.replace(/\n/g, '<br>'));
        chatResult.insertAdjacentHTML('beforeend', '<br><i>⏳ …thinking</i>');
        bodyWrap.scrollTop = bodyWrap.scrollHeight;
        try {
            const ans = await cohereQuery(q);
            chatResult.insertAdjacentHTML('beforeend', '<br><b>🤖 GPT:</b> ' + ans.replace(/\n/g, '<br>'));
        } finally {
            askBtn.disabled = false;
            askInput.value = '';
            bodyWrap.scrollTop = bodyWrap.scrollHeight;
        }
    };

    /*************************************************
     *  🎭 MEME GENERATOR BUTTON (uses Imgflip)
     *************************************************/
    const templates = ["181913649", "112126428", "87743020", "124822590", "129242436", "438680", "217743513", "131087935", "61579", "4087833", "93895088", "102156234", "97984", "1035805", "188390779", "91538330", "101470", "247375501", "131940431", "89370399"];
    const randomTemplate = () => templates[Math.floor(Math.random() * templates.length)];

    memeBtn.onclick = async () => {
        if (tokenPoints <= 0) return alert('❌ Not enough meme tokens!');
        memeBtn.disabled = true;
        memeBtn.textContent = '…';
        const templateEmotions = {
            "181913649": "before_after",
            "93895088": "before_after",
            "124055727": "before_after",
            "4087833": "before_after",
            "247375501": "before_after",
            "123999232": "before_after",
            "112126428": "comparison",
            "87743020": "comparison",
            "100777631": "comparison",
            "217743513": "comparison",
            "228024850": "comparison",
            "129242436": "reaction",
            "131087935": "reaction",
            "148909805": "reaction",
            "131940431": "reaction"
        };

        const getTemplateByCategory = (category) => {
            const entries = Object.entries(templateEmotions).filter(([_, cat]) => cat === category);
            if (!entries.length) return null;
            const randomEntry = entries[Math.floor(Math.random() * entries.length)];
            return randomEntry[0]; // template ID
        };
        const prompt = `
You're a meme generator. Give me two lines that are related to each other in a funny way so I could make a meme out of them.
There should be a clear relationship between the two lines.

Use this JSON format:
{
  "top": "<top line>",
  "bottom": "<bottom line>",
  "category": "<one of: before_after, comparison, reaction>"
}

Generate lines related to the topic: "${topic}"
Only output the JSON — no extra text.
`;

        const resp = await fetch("https://api.cohere.ai/v1/generate", {
            method: "POST",
            headers: {
                "Authorization": "Bearer zXH8KUSA3ncfZcxvIAZx5boAlGlTirN6LJmp706Q",
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ model: "command", prompt, max_tokens: 100, temperature: 0.9 })
        });

        const text = (await resp.json()).generations?.[0]?.text || "";
        let parsed;

        try {
            parsed = JSON.parse(text);
        } catch (e) {
            alert("⚠️ Failed to understand meme lines. Try again.");
            return;
        } finally {
            memeBtn.textContent = '🎭';
            memeBtn.disabled = false;
            memeBtn.appendChild(window.tokenBadge);
        }
        const { top, bottom, category } = parsed;
        const templateId = getTemplateByCategory(category);

        if (!templateId) {
            alert("❌ No suitable meme template found for category: " + category);
            return;
        }

        const form = new URLSearchParams();
        form.append("template_id", templateId);
        form.append("username", "SHANTNUTALOKAR");
        form.append("password", "Sahil@9043");
        form.append("text0", top);
        form.append("text1", bottom);

        const imgRes = await fetch("https://api.imgflip.com/caption_image", {
            method: "POST",
            body: form
        });
        const memeJson = await imgRes.json();

        if (!memeJson.success) return alert("❌ Imgflip error: " + memeJson.error_message);

        // Display meme popup (same as before)
        const pop = document.createElement("div");
        pop.style.cssText = `
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 10002;
  background: #fff;
  border: 2px solid #000;
  border-radius: 10px;
  padding: 12px;
  box-shadow: 2px 2px 10px rgba(0,0,0,.35);
  max-width: 280px;
  text-align: center;
  font-family: sans-serif;
`;
        pop.innerHTML = `<strong>🎉 Meme Unlocked!</strong><br><img src="${memeJson.data.url}" style="max-width:100%;border-radius:6px;margin-top:10px"/><br><button style="margin-top:8px;padding:4px 10px;border:none;background:#f44336;color:#fff;border-radius:4px;cursor:pointer;">Close</button>`;
        pop.querySelector("button").onclick = () => pop.remove();
        document.body.appendChild(pop);
    };


/*************************************************
 *  🗓️ DAILY QUESTION HANDLER (logic reused)
 *************************************************/
dqBtn.onclick = async () => {
    const today = new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
    const qKey = 'dailyQ-data';
    const dKey = 'dailyQ-date';
    const aKey = 'dailyQ-done';

    // ✅ Disable btn if already done
    if (localStorage.getItem(aKey) === today) {
        dqBtn.disabled = true;
        dqBtn.style.background = '#ccc';
        dqBtn.textContent = '✅ Attempted';
        return;
    }

    // helper to render the stored or freshly fetched question
    const renderQuestion = (qBlock) => {
        // build overlay (1-per-session)
        let dqOver = document.getElementById('dailyQOverlay');
        if (!dqOver) {
            dqOver = document.createElement('div');
            dqOver.id = 'dailyQOverlay';
            dqOver.style.cssText =
                'display:flex;flex-direction:column;align-items:center;position:fixed;top:10%;left:50%;' +
                'transform:translateX(-50%);width:500px;max-width:90%;padding:22px;background:#fff;' +
                'border:5px solid #3f51b5;border-radius:14px;z-index:10000;box-shadow:0 10px 25px rgba(0,0,0,.35);' +
                'font-family:sans-serif;';
            dqOver.innerHTML = `
                <button style="position:absolute;top:8px;right:12px;font-size:16px;border:none;background:#f44336;
                        color:white;padding:4px 10px;border-radius:4px;cursor:pointer;"
                        onclick="this.parentElement.remove()">✖</button>
                <h3 style="margin-bottom:12px">🗓️ Daily Aptitude Question</h3>
                <div id="dqTimer" style="font-size:15px;font-weight:bold;margin-bottom:10px;"></div>
                <form id="dqForm" style="width:100%;font-size:15px;line-height:1.6;"></form>
                <button id="dqSubmit" style="margin-top:15px;padding:8px 16px;background:#4caf50;color:white;
                        border:none;border-radius:5px;cursor:pointer;">Submit</button>
                <div id="dqResult" style="margin-top:14px;font-weight:bold;text-align:center;"></div>
            `;
            document.body.appendChild(dqOver);
        }

        // fill form
        const form = dqOver.querySelector('#dqForm');
        form.innerHTML = '';
        const { question, options } = qBlock;
        const correctIdx = options.findIndex(o => o.isCorrect);

        const qEl = document.createElement('div');
        qEl.style.fontWeight = 'bold';
        qEl.textContent = question;
        form.appendChild(qEl);

        options.forEach((opt, i) => {
            const id = `dqo${i}`;
            const wrap = document.createElement('label');
            wrap.style.cssText =
                'display:block;margin:6px 0;padding:6px 9px;border-radius:5px;border:1px solid #ccc;cursor:pointer;';
            wrap.innerHTML = `<input type="radio" name="dq" id="${id}" value="${i}" style="margin-right:6px;"> ${opt.text}`;
            form.appendChild(wrap);
        });

        let timeLeft = 120;
        const timerBox = dqOver.querySelector('#dqTimer');
        timerBox.textContent = `⏳ Time left: 2:00`;
        const tick = setInterval(() => {
            --timeLeft;
            const min = Math.floor(timeLeft / 60).toString();
            const sec = (timeLeft % 60).toString().padStart(2, '0');
            timerBox.textContent = `⏳ Time left: ${min}:${sec}`;
            if (timeLeft <= 0) {
                clearInterval(tick);
                dqOver.querySelector('#dqSubmit').click();
            }
        }, 1000);

        dqOver.querySelector('#dqSubmit').onclick = () => {
            clearInterval(tick);
            const chosen = form.querySelector('input[name="dq"]:checked');
            const resBox = dqOver.querySelector('#dqResult');
            if (!chosen) {
                resBox.textContent = '❗ No option selected!';
                return;
            }
            const idx = Number(chosen.value);
            if (idx === correctIdx) {
                resBox.textContent = '✅ Correct!';
                resBox.style.color = '#2e7d32';
                addTokens(10); // ✅ reward tokens
            } else {
                resBox.textContent = `❌ Wrong. Correct answer: ${options[correctIdx].text}`;
                resBox.style.color = '#c62828';
            }
            dqOver.querySelectorAll('input').forEach(inp => inp.disabled = true);
            dqOver.querySelector('#dqSubmit').disabled = true;

            // ✅ Mark as attempted
            localStorage.setItem(aKey, today);
            dqBtn.disabled = true;
            dqBtn.style.background = '#ccc';
            dqBtn.textContent = '✅ Attempted';
        };
    };

    if (localStorage.getItem(dKey) === today) {
        const stored = JSON.parse(localStorage.getItem(qKey) || '{}');
        return renderQuestion(stored);
    }

    try {
        dqBtn.textContent = '⏳ Creating…';
        dqBtn.disabled = true;

        const prompt = `
Generate EXACTLY one aptitude multiple-choice question in the domain of logical reasoning or quantitative aptitude.

• Return in this format (no extra commentary):
Q) <question text>
A) <option1>
B) <option2>
C) <option3>
D) <option4>
Answer: <capital letter of correct option>

Use real aptitude style, medium difficulty.
        `.trim();

        const raw = await cohereQuery(prompt, 180);
        dqBtn.textContent = '🗓️ Daily Question';
        dqBtn.disabled = false;

        const qMatch = raw.match(/^Q\)?\s*(.*)$/im);
        const oMatch = raw.match(/^[A-D]\).*/gim);
        const aMatch = raw.match(/Answer:\s*([A-D])/i);
        if (!qMatch || !oMatch || oMatch.length !== 4 || !aMatch) {
            return alert('⚠️ Could not parse question from Cohere.');
        }

        const qBlock = {
            question: qMatch[1].trim(),
            options: oMatch.map((l, i) => ({
                text: l.replace(/^[A-D]\)\s*/, '').trim(),
                isCorrect: 'ABCD'[i] === aMatch[1].toUpperCase()
            }))
        };

        localStorage.setItem(qKey, JSON.stringify(qBlock));
        localStorage.setItem(dKey, today);

        renderQuestion(qBlock);
    } catch (err) {
        dqBtn.textContent = '🗓️ Daily Question';
        dqBtn.disabled = false;
        console.error(err);
        alert('❌ Error generating daily question – see console.');
    }
};

/*************************************************
 *  Attach primary button to page
 *************************************************/
document.body.appendChild(mainBtn);

}) ();

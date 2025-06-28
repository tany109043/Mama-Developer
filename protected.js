// ====================================================
// 🔌 Sentiment-Analysis Integration  (NEW block)
// ====================================================
(async () => {
    const API = "http://localhost:8000";

    const emotionMessages = {
        tired: "😴 Wake up, champ! Your brain needs you!",
        sleep: "🚨 You're dozing off — sit up straight!",
        "You Look tensed try attempting quiz": "💥 Feeling tense? Try a quick quiz to recalibrate!",
        "You Look bored  generate a meme,relax a bit": "😐 Bored? Create a meme and spark your creativity!"
    };

    const sleepSound = new Audio("https://actions.google.com/sounds/v1/alarms/alarm_clock.ogg");

    const WINDOW_SEC = 10;
    const MIN_OCCURRENCES = 3;
    const STABLE_SEC = 3;
    const GLOBAL_COOLDOWN = 30;

    const notify = (() => {
        const box = document.createElement("div");
        box.id = "emotionAlertBox";
        box.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: #fff3cd;
            color: #856404;
            padding: 16px 20px;
            border: 2px solid #ffeeba;
            border-radius: 12px;
            font-size: 16px;
            font-weight: bold;
            max-width: 400px;
            z-index: 9999;
            box-shadow: 0 8px 16px rgba(0,0,0,.2);
            display: none;
            transition: opacity .4s ease;
            opacity: 0;
            text-align: center;
        `;
        document.body.appendChild(box);
        return (msg, label) => {
            box.textContent = msg;
            box.style.display = "block";
            box.style.opacity = "1";
            clearTimeout(box.hideTimeout);
            box.hideTimeout = setTimeout(() => {
                box.style.opacity = "0";
                setTimeout(() => (box.style.display = "none"), 400);
            }, 5000);

            if (label === "sleep") {
                sleepSound.currentTime = 0;
                sleepSound.play().catch(e => console.warn("🔇 Cannot auto-play sound:", e));
            }
        };
    })();

    const now = () => Math.floor(Date.now() / 1000);
    const hist = [];
    let lastPopupAt = 0;
    let stableStart = 0;
    let prevDominant = "engagement/focus";

    const record = (label) => {
        hist.push({ label, t: now() });
        while (hist.length && hist[0].t < now() - WINDOW_SEC) hist.shift();
    };

    const getDominant = () => {
        const counts = {};
        for (const { label } of hist) counts[label] = (counts[label] || 0) + 1;
        let dom = "engagement/focus", max = 0;
        for (const [l, c] of Object.entries(counts))
            if (c > max) { dom = l; max = c; }
        return { dom, count: max };
    };

    try { await fetch(API + "/start", { method: "POST" }); }
    catch (e) { console.error("❌ Backend unreachable:", e); return; }

    let running = true;

    async function poll() {
        if (!running) return;

        try {
            const res = await fetch(API + "/latest");
            const data = await res.json();
            if (data.label) record(data.label);

            const { dom, count } = getDominant();

            if (dom !== prevDominant) {
                prevDominant = dom;
                stableStart = now();
            }

            const stableFor = now() - stableStart;

            if (
                dom !== "engagement/focus" &&
                count >= MIN_OCCURRENCES &&
                stableFor >= STABLE_SEC &&
                now() - lastPopupAt >= GLOBAL_COOLDOWN
            ) {
                if (emotionMessages[dom]) notify(emotionMessages[dom], dom);
                lastPopupAt = now();
            }
        } catch {
            console.warn("Waiting for sentiment data…");
        }

        setTimeout(poll, 1000);
    }
    poll();

    window.addEventListener("keydown", async (e) => {
        if (e.key === "Escape") {
            running = false;
            await fetch(API + "/stop", { method: "POST" });
            document.querySelector("#emotionAlertBox")?.remove();
            console.log("Emotion monitor stopped.");
        }
    });
})();

//Updated 

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
        /***** 1️⃣ Course Analysis *****/
        const analysisPrompt = `You are an expert educational analyst.
Study the Udemy course below and reply in the EXACT template that follows—no preamble or extras.
Course Title: ${title}
Course URL: ${url}

TEMPLATE

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
        background: linear-gradient(135deg, #e3f0ff 0%, #f9f6ff 100%);
        padding: 22px 32px 22px 32px;
        border-radius: 12px;
        border: 1px solid #b6c7e6;
        box-sizing: border-box;
        text-align: justify;
        font-family: inherit;
        font-size: 15px;
        line-height: 1.7;
        color: #222;
        display: flex;
        flex-direction: column;
        align-items: center;
        box-shadow: 0 6px 24px rgba(80,120,200,0.10);
    ">
        <div style="
            width: 100%;
            max-width: 700px;
            margin: 0 auto;
            text-align: justify;
            word-break: break-word;
        ">
            <div style="font-weight:bold;text-align:center;margin-bottom:18px;">Course Analysis</div>
            ${analysis
                .replace(/^TEMPLATE$/im, '<b>TEMPLATE</b>')
                .replace(/^(Drawbacks.*)$/im, '<b>$1</b>')
                .replace(/^(Learning Outcomes.*)$/im, '<b>$1</b>')
                .replace(/^(In-depth Details.*)$/im, '<b>$1</b>')
                .replace(/\n/g, '<br>')
                .replace(/[#*]/g, '')
            }
        </div>
    </div>
`;
         /***** 2️⃣ Modules List *****/
        const mods = [...document.querySelectorAll('div[data-purpose="curriculum-section-container"] h3')];
        if (!mods.length) {
            modulesBox.innerHTML = `
    <div style="
        margin: 0 auto;
        max-width: 95%;
        background: linear-gradient(135deg, #f9f6ff 0%, #e3f0ff 100%);
        padding: 18px 32px;
        border-radius: 10px;
        border: 1px solid #b6c7e6;
        box-sizing: border-box;
        font-family: inherit;
        font-size: 15px;
        line-height: 1.7;
        color: #222;
        display: flex;
        flex-direction: column;
        align-items: center;
        box-shadow: 0 4px 18px rgba(80,120,200,0.10);
    ">
        <b style="display:block;text-align:center;font-size:18px;margin-bottom:12px;">📂 Modules</b>
        <div style="width:100%;max-width:500px;text-align:left;">
            ❌ Could not detect modules.
        </div>
    </div>
`;
        } else {
            modulesBox.innerHTML = `
    <div style="
        margin: 0 auto;
        max-width: 95%;
        background: linear-gradient(135deg, #f9f6ff 0%, #e3f0ff 100%);
        padding: 18px 32px;
        border-radius: 10px;
        border: 1px solid #b6c7e6;
        box-sizing: border-box;
        font-family: inherit;
        font-size: 15px;
        line-height: 1.7;
        color: #222;
        display: flex;
        flex-direction: column;
        align-items: center;
        box-shadow: 0 4px 18px rgba(80,120,200,0.10);
    ">
        <b style="display:block;text-align:center;font-size:18px;margin-bottom:12px;">📂 Modules</b>
        <div id="modulesList" style="width:100%;max-width:500px;text-align:left;"></div>
        <div id="modulesBtnRow"></div>
    </div>
`;
            // checklist for each module (only module names, no "Section 1" etc.)
            const modulesList = modulesBox.querySelector('#modulesList');
            modulesList.innerHTML = '';
            mods.forEach((m, i) => {
                let name = m.innerText.trim().replace(/^Section\s*\d+\s*[:-]?\s*/i, '');
                const key = 'udemyMod-' + i;
                const wrap = document.createElement('label');
                wrap.style.cssText = 'display:block;margin:4px 0;cursor:pointer;';
                const chk = document.createElement('input');
                chk.type = 'checkbox';
                chk.checked = localStorage.getItem(key) === '1';
                chk.onchange = () => localStorage.setItem(key, chk.checked ? '1' : '0');
                wrap.append(chk, ' ', name);
                modulesList.appendChild(wrap);
            });

            // action buttons
            const btnRow = modulesBox.querySelector('#modulesBtnRow');
            btnRow.innerHTML = '';
            btnRow.style.display = 'flex';
            btnRow.style.flexDirection = 'row';
            btnRow.style.gap = '8px';
            btnRow.style.justifyContent = 'flex-start';
            btnRow.style.alignItems = 'center';

            const projBtn = document.createElement('button');
            projBtn.textContent = '🎯 Suggest Projects';
            projBtn.style.cssText = [
                'padding:5px 12px',
                'background:linear-gradient(90deg,#43e97b 0%,#38f9d7 100%)',
                'color:#222',
                'border:none',
                'border-radius:6px',
                'font-weight:bold',
                'font-size:13px',
                'box-shadow:0 1px 4px rgba(67,233,123,0.08)',
                'cursor:pointer',
                'transition:background 0.15s'
            ].join(';');
            projBtn.onmouseover = () => {
                projBtn.style.background = 'linear-gradient(90deg,#38f9d7 0%,#43e97b 100%)';
            };
            projBtn.onmouseout = () => {
                projBtn.style.background = 'linear-gradient(90deg,#43e97b 0%,#38f9d7 100%)';
            };
            btnRow.appendChild(projBtn);

            const quizBtn = document.createElement('button');
            quizBtn.textContent = '📝 Quiz Me';
            quizBtn.style.cssText = [
                'padding:5px 12px',
                'background:linear-gradient(90deg,#f7971e 0%,#ffd200 100%)',
                'color:#222',
                'border:none',
                'border-radius:6px',
                'font-weight:bold',
                'font-size:13px',
                'box-shadow:0 1px 4px rgba(255,215,0,0.08)',
                'cursor:pointer',
                'transition:background 0.15s'
            ].join(';');
            quizBtn.onmouseover = () => {
                quizBtn.style.background = 'linear-gradient(90deg,#ffd200 0%,#f7971e 100%)';
            };
            quizBtn.onmouseout = () => {
                quizBtn.style.background = 'linear-gradient(90deg,#f7971e 0%,#ffd200 100%)';
            };
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
            const sqlQuestions = [
                {
                    question: "Which SQL statement is used to extract data from a database?",
                    options: [
                        { text: "GET", isCorrect: false },
                        { text: "OPEN", isCorrect: false },
                        { text: "SELECT", isCorrect: true },
                        { text: "EXTRACT", isCorrect: false }
                    ]
                },
                {
                    question: "What does SQL stand for?",
                    options: [
                        { text: "Structured Query Language", isCorrect: true },
                        { text: "System Question Language", isCorrect: false },
                        { text: "Sequential Query Logic", isCorrect: false },
                        { text: "Standard Question Language", isCorrect: false }
                    ]
                },
                {
                    question: "Which SQL clause is used to filter records?",
                    options: [
                        { text: "ORDER BY", isCorrect: false },
                        { text: "WHERE", isCorrect: true },
                        { text: "GROUP BY", isCorrect: false },
                        { text: "HAVING", isCorrect: false }
                    ]
                },
                {
                    question: "Which command is used to add new data?",
                    options: [
                        { text: "APPEND", isCorrect: false },
                        { text: "INSERT INTO", isCorrect: true },
                        { text: "ADD RECORD", isCorrect: false },
                        { text: "UPDATE", isCorrect: false }
                    ]
                },
                {
                    question: "What does the COUNT() function do?",
                    options: [
                        { text: "Adds numbers", isCorrect: false },
                        { text: "Counts rows", isCorrect: true },
                        { text: "Calculates average", isCorrect: false },
                        { text: "Sorts records", isCorrect: false }
                    ]
                },
                {
                    question: "Which SQL keyword is used to sort results?",
                    options: [
                        { text: "SORT", isCorrect: false },
                        { text: "ORDER BY", isCorrect: true },
                        { text: "GROUP", isCorrect: false },
                        { text: "ARRANGE", isCorrect: false }
                    ]
                },
                {
                    question: "Which clause is used to remove duplicate rows?",
                    options: [
                        { text: "UNIQUE", isCorrect: false },
                        { text: "REMOVE DUPLICATES", isCorrect: false },
                        { text: "DISTINCT", isCorrect: true },
                        { text: "FILTER", isCorrect: false }
                    ]
                },
                {
                    question: "Which function is used to find the highest value?",
                    options: [
                        { text: "TOP()", isCorrect: false },
                        { text: "HIGHEST()", isCorrect: false },
                        { text: "MAX()", isCorrect: true },
                        { text: "GREATEST()", isCorrect: false }
                    ]
                },
                {
                    question: "Which command is used to change existing data?",
                    options: [
                        { text: "ALTER", isCorrect: false },
                        { text: "MODIFY", isCorrect: false },
                        { text: "UPDATE", isCorrect: true },
                        { text: "CHANGE", isCorrect: false }
                    ]
                },
                {
                    question: "Which SQL keyword is used to delete data?",
                    options: [
                        { text: "REMOVE", isCorrect: false },
                        { text: "DELETE", isCorrect: true },
                        { text: "DROP", isCorrect: false },
                        { text: "TRUNCATE", isCorrect: false }
                    ]
                },
                {
                    question: "Which SQL command is used to remove a table?",
                    options: [
                        { text: "DELETE TABLE", isCorrect: false },
                        { text: "DROP TABLE", isCorrect: true },
                        { text: "REMOVE TABLE", isCorrect: false },
                        { text: "TRUNCATE TABLE", isCorrect: false }
                    ]
                },
                {
                    question: "What is the purpose of the GROUP BY clause?",
                    options: [
                        { text: "To sort the result set", isCorrect: false },
                        { text: "To group rows sharing the same values", isCorrect: true },
                        { text: "To filter records", isCorrect: false },
                        { text: "To update grouped data", isCorrect: false }
                    ]
                },
                {
                    question: "What is the correct syntax to create a table?",
                    options: [
                        { text: "MAKE TABLE table_name (...)", isCorrect: false },
                        { text: "BUILD TABLE table_name (...)", isCorrect: false },
                        { text: "CREATE TABLE table_name (...)", isCorrect: true },
                        { text: "CONSTRUCT table_name (...)", isCorrect: false }
                    ]
                },
                {
                    question: "Which operator is used to check for a range of values?",
                    options: [
                        { text: "WITHIN", isCorrect: false },
                        { text: "BETWEEN", isCorrect: true },
                        { text: "IN", isCorrect: false },
                        { text: "RANGE", isCorrect: false }
                    ]
                },
                {
                    question: "How do you rename a column in SQL?",
                    options: [
                        { text: "CHANGE COLUMN", isCorrect: false },
                        { text: "MODIFY COLUMN", isCorrect: false },
                        { text: "RENAME COLUMN", isCorrect: true },
                        { text: "UPDATE COLUMN", isCorrect: false }
                    ]
                },
                {
                    question: "What is a primary key?",
                    options: [
                        { text: "A key that is used to encrypt tables", isCorrect: false },
                        { text: "A field that uniquely identifies a row", isCorrect: true },
                        { text: "A foreign reference to another table", isCorrect: false },
                        { text: "A temporary key for sorting", isCorrect: false }
                    ]
                },
                {
                    question: "What does the HAVING clause do?",
                    options: [
                        { text: "Filters groups", isCorrect: true },
                        { text: "Sorts records", isCorrect: false },
                        { text: "Renames fields", isCorrect: false },
                        { text: "Creates indexes", isCorrect: false }
                    ]
                },
                {
                    question: "Which SQL statement is used to update data?",
                    options: [
                        { text: "MODIFY", isCorrect: false },
                        { text: "UPDATE", isCorrect: true },
                        { text: "REPLACE", isCorrect: false },
                        { text: "SET", isCorrect: false }
                    ]
                },
                {
                    question: "Which symbol is used for a single-character wildcard in SQL?",
                    options: [
                        { text: "*", isCorrect: false },
                        { text: "%", isCorrect: false },
                        { text: "_", isCorrect: true },
                        { text: "#", isCorrect: false }
                    ]
                },
                {
                    question: "Which SQL clause is used to combine rows from two or more tables?",
                    options: [
                        { text: "COMBINE", isCorrect: false },
                        { text: "MERGE", isCorrect: false },
                        { text: "JOIN", isCorrect: true },
                        { text: "APPEND", isCorrect: false }
                    ]
                },
                {
                    question: "Which JOIN returns all records when there is a match in either table?",
                    options: [
                        { text: "INNER JOIN", isCorrect: false },
                        { text: "LEFT JOIN", isCorrect: false },
                        { text: "FULL JOIN", isCorrect: true },
                        { text: "OUTER JOIN", isCorrect: false }
                    ]
                },
                {
                    question: "Which SQL command is used to create a new database?",
                    options: [
                        { text: "CREATE DB", isCorrect: false },
                        { text: "NEW DATABASE", isCorrect: false },
                        { text: "CREATE DATABASE", isCorrect: true },
                        { text: "INIT DB", isCorrect: false }
                    ]
                },
                {
                    question: "What is a foreign key?",
                    options: [
                        { text: "A key to access external APIs", isCorrect: false },
                        { text: "A key that references a primary key in another table", isCorrect: true },
                        { text: "A deprecated key type", isCorrect: false },
                        { text: "A temporary identifier", isCorrect: false }
                    ]
                },
                {
                    question: "What does the IS NULL operator do?",
                    options: [
                        { text: "Checks if a value is 0", isCorrect: false },
                        { text: "Checks if a value is empty", isCorrect: false },
                        { text: "Checks if a value is undefined", isCorrect: false },
                        { text: "Checks if a value is null", isCorrect: true }
                    ]
                },
                {
                    question: "Which function returns the lowest value?",
                    options: [
                        { text: "MIN()", isCorrect: true },
                        { text: "LOW()", isCorrect: false },
                        { text: "BOTTOM()", isCorrect: false },
                        { text: "LEAST()", isCorrect: false }
                    ]
                },
                {
                    question: "Which clause is used with aggregate functions?",
                    options: [
                        { text: "WHERE", isCorrect: false },
                        { text: "FILTER", isCorrect: false },
                        { text: "HAVING", isCorrect: true },
                        { text: "GROUP", isCorrect: false }
                    ]
                },
                {
                    question: "Which keyword is used to prevent null values?",
                    options: [
                        { text: "REQUIRED", isCorrect: false },
                        { text: "NOT NULL", isCorrect: true },
                        { text: "NO BLANK", isCorrect: false },
                        { text: "DISALLOW NULL", isCorrect: false }
                    ]
                },
                {
                    question: "What does the AVG() function return?",
                    options: [
                        { text: "Total sum", isCorrect: false },
                        { text: "Average of values", isCorrect: true },
                        { text: "Count of rows", isCorrect: false },
                        { text: "Rounded value", isCorrect: false }
                    ]
                },
                {
                    question: "Which clause is used to limit the number of records returned?",
                    options: [
                        { text: "TOP", isCorrect: false },
                        { text: "LIMIT", isCorrect: true },
                        { text: "RANGE", isCorrect: false },
                        { text: "ROWNUM", isCorrect: false }
                    ]
                },
                {
                    question: "Which SQL clause is used to remove rows based on a grouped aggregate condition?",
                    options: [
                        { text: "WHERE", isCorrect: false },
                        { text: "GROUP BY", isCorrect: false },
                        { text: "HAVING", isCorrect: true },
                        { text: "FILTER", isCorrect: false }
                    ]
                },
                {
                    question: "What is the purpose of the RANK() window function in SQL?",
                    options: [
                        { text: "Groups data into partitions", isCorrect: false },
                        { text: "Returns the highest value", isCorrect: false },
                        { text: "Ranks rows with possible gaps in rank", isCorrect: true },
                        { text: "Returns a random row", isCorrect: false }
                    ]
                },
                {
                    question: "Which SQL construct is used to create recursive queries?",
                    options: [
                        { text: "JOIN", isCorrect: false },
                        { text: "GROUP BY", isCorrect: false },
                        { text: "WITH ... RECURSIVE", isCorrect: true },
                        { text: "UNION ALL", isCorrect: false }
                    ]
                },
                {
                    question: "What does the COALESCE() function do in SQL?",
                    options: [
                        { text: "Returns NULL if all values are NULL", isCorrect: false },
                        { text: "Returns the sum of all columns", isCorrect: false },
                        { text: "Returns the first non-NULL value in a list", isCorrect: true },
                        { text: "Combines two tables", isCorrect: false }
                    ]
                },
                {
                    question: "Which command is used to grant permissions on a table?",
                    options: [
                        { text: "PERMIT", isCorrect: false },
                        { text: "ALLOW", isCorrect: false },
                        { text: "GRANT", isCorrect: true },
                        { text: "ACCESS", isCorrect: false }
                    ]
                },
                {
                    question: "In SQL, what is a CTE?",
                    options: [
                        { text: "Central Table Engine", isCorrect: false },
                        { text: "Common Table Expression", isCorrect: true },
                        { text: "Core Transaction Entity", isCorrect: false },
                        { text: "Column Type Extension", isCorrect: false }
                    ]
                },
                {
                    question: "Which SQL function removes leading and trailing spaces from a string?",
                    options: [
                        { text: "REMOVE()", isCorrect: false },
                        { text: "STRIP()", isCorrect: false },
                        { text: "TRIM()", isCorrect: true },
                        { text: "CUT()", isCorrect: false }
                    ]
                },
                {
                    question: "What is the default isolation level in most SQL databases?",
                    options: [
                        { text: "Read Uncommitted", isCorrect: false },
                        { text: "Repeatable Read", isCorrect: false },
                        { text: "Read Committed", isCorrect: true },
                        { text: "Serializable", isCorrect: false }
                    ]
                },
                {
                    question: "What is the use of the EXCEPT operator?",
                    options: [
                        { text: "Combines duplicate rows", isCorrect: false },
                        { text: "Returns only rows in first query not in second", isCorrect: true },
                        { text: "Returns common rows", isCorrect: false },
                        { text: "Removes duplicates from a query", isCorrect: false }
                    ]
                },
                {
                    question: "Which command defines a new index on a table?",
                    options: [
                        { text: "ADD INDEX", isCorrect: false },
                        { text: "CREATE INDEX", isCorrect: true },
                        { text: "MAKE INDEX", isCorrect: false },
                        { text: "SET INDEX", isCorrect: false }
                    ]
                },
                {
                    question: "Which function is used to return the number of characters in a string in SQL?",
                    options: [
                        { text: "SIZE()", isCorrect: false },
                        { text: "LENGTH()", isCorrect: true },
                        { text: "COUNT()", isCorrect: false },
                        { text: "CHARCOUNT()", isCorrect: false }
                    ]
                },
                {
                    question: "What is the purpose of the CROSS JOIN in SQL?",
                    options: [
                        { text: "Joins tables using a key", isCorrect: false },
                        { text: "Filters rows based on condition", isCorrect: false },
                        { text: "Returns Cartesian product of two tables", isCorrect: true },
                        { text: "Joins based on matching rows", isCorrect: false }
                    ]
                },
                {
                    question: "Which SQL constraint ensures unique values in a column?",
                    options: [
                        { text: "NOT NULL", isCorrect: false },
                        { text: "PRIMARY KEY", isCorrect: false },
                        { text: "UNIQUE", isCorrect: true },
                        { text: "CHECK", isCorrect: false }
                    ]
                },
                {
                    question: "Which SQL keyword is used to define a conditional CASE expression?",
                    options: [
                        { text: "IF", isCorrect: false },
                        { text: "SWITCH", isCorrect: false },
                        { text: "CASE", isCorrect: true },
                        { text: "WHEN-THEN", isCorrect: false }
                    ]
                },
                {
                    question: "Which statement rolls back a transaction in SQL?",
                    options: [
                        { text: "REVERT", isCorrect: false },
                        { text: "ROLLBACK", isCorrect: true },
                        { text: "CANCEL", isCorrect: false },
                        { text: "UNDO", isCorrect: false }
                    ]
                },
                {
                    question: "Which operator checks for value existence in a list?",
                    options: [
                        { text: "CONTAINS", isCorrect: false },
                        { text: "EXISTS", isCorrect: false },
                        { text: "IN", isCorrect: true },
                        { text: "BETWEEN", isCorrect: false }
                    ]
                },
                {
                    question: "How do you prevent a column from accepting NULL values?",
                    options: [
                        { text: "UNIQUE", isCorrect: false },
                        { text: "DEFAULT 0", isCorrect: false },
                        { text: "NOT NULL", isCorrect: true },
                        { text: "MANDATORY", isCorrect: false }
                    ]
                },
                {
                    question: "Which aggregate function ignores NULLs by default?",
                    options: [
                        { text: "MAX()", isCorrect: false },
                        { text: "COUNT()", isCorrect: false },
                        { text: "SUM()", isCorrect: false },
                        { text: "All aggregate functions", isCorrect: true }
                    ]
                },
                {
                    question: "How do you select records that begin with 'A'?",
                    options: [
                        { text: "WHERE name = 'A%'", isCorrect: false },
                        { text: "WHERE name STARTS WITH 'A'", isCorrect: false },
                        { text: "WHERE name LIKE 'A%'", isCorrect: true },
                        { text: "WHERE name ^= 'A'", isCorrect: false }
                    ]
                },
                {
                    question: "What is the difference between DELETE and TRUNCATE?",
                    options: [
                        { text: "TRUNCATE logs each row deleted", isCorrect: false },
                        { text: "DELETE resets identity column", isCorrect: false },
                        { text: "TRUNCATE is faster and removes all rows without logging each", isCorrect: true },
                        { text: "DELETE is irreversible", isCorrect: false }
                    ]
                },
                {
                    question: "What does the LIKE operator do?",
                    options: [
                        { text: "Searches for a pattern", isCorrect: true },
                        { text: "Matches column types", isCorrect: false },
                        { text: "Finds exact value", isCorrect: false },
                        { text: "Checks value type", isCorrect: false }
                    ]
                }
            ];

            quizBtn.onclick = () => {
                const chosen = mods
                    .filter((_, i) => localStorage.getItem('udemyMod-' + i) === '1')
                    .map(m => m.innerText.trim());

                if (!chosen.length) return alert('Select modules first.');

                overlay.style.display = 'block';
                overlay.innerHTML = `
        <button id="closeQuiz" style="position:absolute;top:15px;right:20px;font-size:20px;
        background:#f44336;color:white;border:none;border-radius:4px;padding:4px 12px;cursor:pointer;">✖</button>
        <h2 style="text-align:center;margin:10px 0 20px">📝 Module Quiz</h2>
        <form id="quizForm" style="font-size:16px;line-height:1.6"></form>
        <button id="submitQuiz" style="margin-top:25px;display:block;background:#4caf50;color:white;
        border:none;padding:10px 20px;border-radius:6px;cursor:pointer;margin-left:auto;margin-right:auto;">Show Answers</button>
        <div id="scoreBox" style="text-align:center;font-size:18px;margin-top:15px;font-weight:bold;"></div>
    `;

                document.getElementById('closeQuiz').onclick = () => (overlay.style.display = 'none');
                const form = overlay.querySelector('#quizForm');

                // ✅ Sample 5 random questions from predefined 30
                const shuffled = [...sqlQuestions].sort(() => Math.random() - 0.5).slice(0, 5);
                const correctMap = [];

                shuffled.forEach((q, qi) => {
                    const qDiv = document.createElement('div');
                    qDiv.style.marginBottom = '20px';
                    qDiv.innerHTML = `<b>Q${qi + 1}. ${q.question}</b><br><br>`;

                    // Shuffle options
                    const options = [...q.options].sort(() => Math.random() - 0.5);

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

                overlay.querySelector('#submitQuiz').onclick = (() => {
                    let awarded = false; // Prevent multiple token awards
                    return () => {
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
                        if (!awarded) {
                            addTokens(right);
                            awarded = true;
                        }
                        overlay.querySelector('#scoreBox').textContent =
                            `🎯 You scored ${right}/${correctMap.length} (${pct}%)`;
                    };
                })();
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
        background: linear-gradient(135deg, #f8fffa 0%, #e3f0ff 100%);
        padding: 18px 32px;
        border-radius: 10px;
        border: 1px solid #b6c7e6;
        box-sizing: border-box;
        font-family: inherit;
        font-size: 15px;
        line-height: 1.7;
        color: #222;
        display: flex;
        flex-direction: column;
        align-items: center;
        box-shadow: 0 4px 18px rgba(80,120,200,0.10);
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
        addTokens(-5);
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
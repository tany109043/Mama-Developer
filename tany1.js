
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

// ====================================================
// ✅ Udemy AI Bookmarklet Tool – ORIGINAL (unchanged)
// ====================================================
// ✅ Udemy AI Bookmarklet Tool – FINAL VERSION
// Features: Analysis, Chat, Project Suggestions, Quiz (with realistic MCQs)
// Use with Bookmarklet:
// javascript:(function(){var s=document.createElement('script');s.src='https://cdn.jsdelivr.net/gh/Shantnu-Talokar/Mama-Developer/script.js?t='+Date.now();document.body.appendChild(s);})();

(function () {
    if (document.getElementById('udemyAnalyzerBtn')) return;
    if (!location.hostname.includes('udemy.com')) return alert('⚠️ Open this on a Udemy course page.');

    const btn = document.createElement('button');
    btn.id = 'udemyAnalyzerBtn';
    btn.textContent = '📘';
    btn.style.cssText =
        'position:fixed;bottom:20px;right:20px;background:#4CAF50;color:white;border:none;border-radius:50%;' +
        'width:60px;height:60px;font-size:28px;font-weight:bold;cursor:move;z-index:9999;box-shadow:0 4px 10px rgba(0,0,0,0.3);';

    /**************************************************************
 🪙  T O K E N   M A N A G E R
**************************************************************/
    const TOKEN_KEY = 'udemyTokens';
    let tokenPoints = Number(localStorage.getItem(TOKEN_KEY) || 0);

    // 1. helpers
    function saveTokens() {
        localStorage.setItem(TOKEN_KEY, tokenPoints);
    }
    function addTokens(delta) {
        tokenPoints += delta;
        saveTokens();
        updateTokenUI();
    }

    // 2. badge + meme-button lock / unlock
    function updateTokenUI() {
        // badge (create once)
        if (!window.tokenBadge) {
            window.tokenBadge = document.createElement('span');
            window.tokenBadge.style.cssText =
                'display:inline-block;margin-left:6px;padding:0 8px;background:#ffd54f;color:#000;' +
                'border-radius:14px;font-size:12px;font-weight:bold;vertical-align:middle;';
            btn.appendChild(window.tokenBadge);          // "btn" = your floating 📘 button
        }
        window.tokenBadge.textContent = `💰 ${tokenPoints}`;
        // lock / unlock memeBtn (must exist before this runs once; see setTimeout below)
        if (window.memeBtn) {
            memeBtn.disabled = tokenPoints <= 0;
            memeBtn.style.opacity = memeBtn.disabled ? 0.5 : 1;
        }
    }
    updateTokenUI();  // run once at startup
    setTimeout(updateTokenUI, 0);  // run again after buttons are loaded

    const panel = document.createElement('div');
    panel.id = 'udemyAnalysisPanel';
    panel.style.cssText =
        'display:none;position:fixed;bottom:90px;right:20px;width:350px;height:600px;padding:15px;background:white;color:black;' +
        'border:1px solid #ccc;border-radius:10px;box-shadow:0 4px 10px rgba(0,0,0,0.3);overflow:auto;z-index:9999;' +
        'font-family:sans-serif;font-size:14px;line-height:1.4;white-space:pre-wrap;';

    const closeBtn = document.createElement('button');
    closeBtn.textContent = '❌';
    closeBtn.style.cssText =
        'position:absolute;top:8px;right:10px;background:none;border:none;font-size:16px;cursor:pointer;';
    closeBtn.onclick = () => (panel.style.display = 'none');
    panel.appendChild(closeBtn);
    document.body.appendChild(panel);

    let moved = false;
    btn.onmousedown = e => {
        moved = false;
        e.preventDefault();
        const sx = e.clientX - btn.getBoundingClientRect().left;
        const sy = e.clientY - btn.getBoundingClientRect().top;
        function mm(e) {
            moved = true;
            btn.style.left = e.pageX - sx + 'px';
            btn.style.top = e.pageY - sy + 'px';
            btn.style.bottom = 'auto';
            btn.style.right = 'auto';
            panel.style.left = parseInt(btn.style.left) + 'px';
            panel.style.top = parseInt(btn.style.top) - 630 + 'px';
        }
        document.addEventListener('mousemove', mm);
        btn.onmouseup = () => {
            document.removeEventListener('mousemove', mm);
            btn.onmouseup = null;
        };
    };
    btn.ondragstart = () => false;

    btn.onclick = async () => {
        if (moved) return;
        moved = false;

        const url = location.href;
        const title = document.querySelector('h1')?.innerText || 'Untitled Course';
        const apiKey = 'zXH8KUSA3ncfZcxvIAZx5boAlGlTirN6LJmp706Q';
        const endpoint = 'https://api.cohere.ai/v1/generate';
        const cohereQuery = async (p, max = 400) => {
            const r = await fetch(endpoint, {
                method: 'POST',
                headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ model: 'command-r-plus', prompt: p, max_tokens: max, temperature: 0.7 })
            });
            const d = await r.json();
            return d.generations?.[0]?.text || '⚠️ No response';
        };

        panel.style.display = 'block';
        panel.innerHTML = '<b>⏳ Analyzing course…</b>';
        panel.appendChild(closeBtn);

        try {
            const analysisPrompt =
                `You are an educational analyst. Analyze this Udemy course:\nTitle:${title}\nURL:${url}\n\n` +
                `Provide:\n1. Modules Covered\n2. Disadvantages\n3. Detailed Learning Outcomes`;
            const analysis = await cohereQuery(analysisPrompt, 500);

            panel.innerHTML = '<b>📘 Course Analysis:</b><br><br>' + analysis.replace(/\n/g, '<br>');
            panel.appendChild(closeBtn);

            const input = document.createElement('textarea');
            input.placeholder = 'Ask anything…';
            input.style.cssText = 'width:100%;height:60px;margin-top:10px;border-radius:5px;border:1px solid #ccc;padding:5px;resize:vertical;';
            const askBtn = document.createElement('button');
            askBtn.textContent = 'Ask';
            askBtn.style.cssText = 'margin-top:8px;padding:6px 12px;border:none;background:#007BFF;color:white;border-radius:4px;cursor:pointer;float:right;';
            const reply = document.createElement('div');
            reply.style.cssText = 'clear:both;margin-top:15px;';
            askBtn.onclick = async () => {
                if (!input.value.trim()) return;
                reply.innerHTML = '⏳ Thinking…';
                reply.innerHTML = '<b>💬 Response:</b><br>' + (await cohereQuery(input.value)).replace(/\n/g, '<br>');
            };
            panel.append(input, askBtn, reply);

            const modBtn = document.createElement('button');
            modBtn.textContent = '📋 Modules';
            modBtn.style.cssText = 'margin-top:10px;padding:6px 12px;border:none;background:#6c757d;color:white;border-radius:4px;cursor:pointer;float:left;';
            panel.appendChild(modBtn);

            const modulesArea = document.createElement('div');
            modulesArea.style = 'margin-top:15px;clear:both;';
            panel.appendChild(modulesArea);

            modBtn.onclick = () => {
                modulesArea.innerHTML = '<b>📂 Course Modules</b><br><br>';
                const mods = [...document.querySelectorAll('div[data-purpose="curriculum-section-container"] h3')];
                if (!mods.length) {
                    modulesArea.innerHTML += '❌ Could not find modules.';
                    return;
                }
                mods.forEach((m, i) => {
                    const key = 'udemyMod-' + i;
                    const chk = document.createElement('input');
                    chk.type = 'checkbox';
                    chk.checked = localStorage.getItem(key) === '1';
                    chk.onchange = () => localStorage.setItem(key, chk.checked ? '1' : '0');
                    const lbl = document.createElement('label');
                    lbl.style = 'display:block;margin:5px 0;';
                    lbl.append(chk, ' ', m.innerText.trim());
                    modulesArea.appendChild(lbl);
                });

                const projBtn = document.createElement('button');
                projBtn.textContent = '🎯 Suggest Projects';
                projBtn.style.cssText =
                    'margin-top:10px;padding:6px 12px;border:none;background:#28a745;color:white;border-radius:4px;cursor:pointer;';
                projBtn.onclick = async () => {
                    const sel = mods
                        .filter((_, i) => localStorage.getItem('udemyMod-' + i) === '1')
                        .map(m => m.innerText.trim());

                    if (!sel.length) return alert('Select modules first.');

                    let ideasDiv = document.getElementById('projectIdeasBox');
                    if (!ideasDiv) {
                        ideasDiv = document.createElement('div');
                        ideasDiv.id = 'projectIdeasBox';
                        modulesArea.appendChild(ideasDiv);
                    }

                    ideasDiv.innerHTML = '<b>⏳ Fetching ideas…</b>';

                    const ideas = await cohereQuery(
                        `I completed these modules:\n\n${sel.join('\n')}\n\nSuggest three hands-on project ideas.`,
                        350
                    );

                    ideasDiv.innerHTML = '<b>🚀 Project Ideas:</b><br>' + ideas.replace(/\n/g, '<br>');
                };

                modulesArea.appendChild(projBtn);

                const quizBtn = document.createElement('button');
                quizBtn.textContent = '📝 Quiz Me';
                quizBtn.style.cssText =
                    'margin-top:10px;margin-left:8px;padding:6px 12px;border:none;background:#ffc107;color:#000;border-radius:4px;cursor:pointer;';
                modulesArea.appendChild(quizBtn);

                let overlay = document.getElementById('udemyQuizOverlay');
                if (!overlay) {
                    overlay = document.createElement('div');
                    overlay.id = 'udemyQuizOverlay';
                    overlay.style.cssText =
                        'display:none;position:fixed;top:10%;left:10%;width:80%;height:80%;background:#fffbd6;' +
                        'border:6px solid #ff9800;border-radius:20px;z-index:10000;padding:25px;overflow:auto;' +
                        'box-shadow:0 8px 25px rgba(0,0,0,0.4);font-family:sans-serif;';
                    document.body.appendChild(overlay);
                }

                quizBtn.onclick = async () => {
                    const chosen = mods
                        .filter((_, i) => localStorage.getItem('udemyMod-' + i) === '1')
                        .map(m => m.innerText.trim());

                    if (!chosen.length) return alert('Select modules first.');

                    overlay.innerHTML = '<h2>📝 Generating quiz…</h2>';

                    const qPrompt =
                        `You are an advanced technical course quiz generator.\n` +
                        `Generate EXACTLY 5 high-quality multiple-choice questions (MCQs) based strictly on the technical content from these modules:\n` +
                        `${chosen.join('\n')}\n\n` +
                        `Guidelines:\n` +
                        `1. Questions must cover a range of difficulty levels: 2 easy, 2 medium, and 1 hard.\n` +
                        `2. Only include content that is clearly present in the modules.\n` +
                        `3. Each question must be clear, unambiguous, and test conceptual understanding or practical application.\n` +
                        `4. Include exactly 4 options (A–D). ONLY ONE must be correct.\n` +
                        `5. Wrap the correct option in <span class="answer"></span> tags.\n` +
                        `6. Avoid repeating questions or options.\n\n` +
                        `Format strictly as:\nQ1. <question>\nA) <opt>\nB) <opt>\nC) <opt>\nD) <opt>\n\n` +
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
                        const blocks = txt.match(/(?:Q?\d+[.)])[\s\S]*?(?=(?:Q?\d+[.)])|$)/g) || [];

                        const correctMap = [];
                        blocks.forEach((blk, qi) => {
                            const lines = blk.trim().split('\n').filter(Boolean);
                            const qLine = lines.shift();
                            const qDiv = document.createElement('div');
                            qDiv.style.marginBottom = '20px';
                            qDiv.innerHTML = `<b>${qLine.replace(/^Q?\d+[.)]\s*/, '')}</b><br><br>`;
                            const options = lines.slice(0, 4).map((line, oi) => {
                                const isCorrect = /class=["']answer["']/.test(line);
                                const text = line.replace(/<span class=["']answer["']>/, '').replace('</span>', '').replace(/^[A-Da-d][).]\s*/, '').trim();
                                return { text, isCorrect };
                            });
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
                                radio.setAttribute('data-correct', opt.isCorrect);
                                const label = document.createElement('label');
                                label.htmlFor = id;
                                label.style.cssText = 'display:block;margin:6px 0;padding:6px 10px;border-radius:5px;cursor:pointer;border:1px solid #ccc;';
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
                                    if (chosen.getAttribute('data-correct') === 'true') {
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
                            overlay.querySelector('#scoreBox').textContent = `🎯 You scored ${right}/${correctMap.length} (${pct}%)`;
                        };
                    } catch (err) {
                        overlay.innerHTML = '<p style="color:red;text-align:center">❌ Failed to generate quiz.</p>';
                    }
                };
                // =======================
                // 💡 Project Evaluator
                // =======================
                const ghInput = document.createElement('input');
                ghInput.type = 'text';
                ghInput.placeholder = 'Paste your GitHub project link...';
                ghInput.style.cssText = 'margin-top:12px;width:100%;padding:6px;border:1px solid #ccc;border-radius:4px;';
                modulesArea.appendChild(ghInput);

                const evalBtn = document.createElement('button');
                evalBtn.textContent = '🧠 Evaluate Project';
                evalBtn.style.cssText =
                    'margin-top:10px;padding:6px 12px;border:none;background:#9c27b0;color:white;border-radius:4px;cursor:pointer;';
                modulesArea.appendChild(evalBtn);

                const evalResult = document.createElement('div');
                evalResult.style = 'margin-top:12px;font-size:14px;white-space:pre-wrap;';
                modulesArea.appendChild(evalResult);

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
                        `Give constructive suggestions to improve.\nThen rate the project on a scale of 1 to 10 and justify the rating.\n\nRespond in this format:\n---\nSuggestions:\n<your suggestions>\n\nRating: <score>/10\n---`;

                    const feedback = await cohereQuery(evalPrompt, 500);
                    evalResult.innerHTML = '✅ <b>Evaluation:</b><br><br>' + feedback.replace(/\n/g, '<br>');
                };

               
                const topic = document.querySelector("h1").textContent.trim();
                const memeBtn = document.createElement("button");
                memeBtn.id = "udemyMemeBtn";
                memeBtn.textContent = "🎭 Show Me a Meme";
                memeBtn.style.cssText = 'margin-top:10px;margin-left:8px;padding:6px 12px;border:none;background:#ff5722;color:white;border-radius:4px;cursor:pointer;';
                modulesArea.appendChild(memeBtn);

                memeBtn.onclick = async () => {
                    if (tokenPoints <= 0) {
                        alert('❌ Not enough meme tokens! Earn more by quizzes or the daily question.');
                        return;
                    }

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

            };
            // 🗓️ DAILY QUESTION  ─────────────────────────────────────────────
            const dqBtn = document.createElement('button');
            dqBtn.textContent = '🗓️ Daily Question';
            dqBtn.style.cssText =
                'margin-top:10px;padding:6px 12px;border:none;background:#3f51b5;color:white;' +
                'border-radius:4px;cursor:pointer;';
            modulesArea.appendChild(dqBtn);

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


        } catch (err) {
            panel.innerHTML = '❌ Error. See console.';
            panel.appendChild(closeBtn);
            console.error(err);
        }
    };

    document.body.appendChild(btn);
})();

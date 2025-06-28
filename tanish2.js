// ==================================================
// 📘 Udemy AI Bookmarklet Tool — FINAL HELPER VERSION
// --------------------------------------------------
//  🔹 Main Helper Floating Button (🛠 Helper)
//      ↳ 📑 Create Smart Notes (auto‑PDF)
//      ↳ 🌍 Real‑World Analogy
//  🔹 Transcript auto‑grab via [data-purpose="transcript-panel"] fallback
//  🔹 Optimised prompts (bullets, bold, use‑cases, flow chart)
//  🔹 Original Version1.js bookmarklet still loads
// ==================================================
(function () {
    if (document.getElementById('udemyHelperBtn')) return;
    if (!location.hostname.includes('udemy.com')) {
        alert('⚠️ Open this on a Udemy course page.');
        return;
    }

    /******************* Cohere Helper *******************/
    const apiKey   = 'zXH8KUSA3ncfZcxvIAZx5boAlGlTirN6LJmp706Q';
    const endpoint = 'https://api.cohere.ai/v1/generate';
    const cohereQuery = async (prompt, max=450, temp=0.6) => {
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
        'position:fixed','bottom:20px','right:20px','width:56px','height:56px','border-radius:50%',
        'background:#673ab7','color:#fff','border:none','font-size:24px','font-weight:bold',
        'box-shadow:0 4px 12px rgba(0,0,0,.3)','cursor:pointer','z-index:9999'
    ].join(';');

    // Pop‑up mini panel containing the two inner buttons
    const mini = document.createElement('div');
    mini.style.cssText = 'display:none;position:fixed;bottom:80px;right:20px;width:250px;padding:12px;background:#fff;'+
        'border:2px solid #888;border-radius:10px;box-shadow:0 6px 18px rgba(0,0,0,.35);z-index:10000;font-family:sans-serif;';

    const makeInnerBtn = (label,bg)=>{
        const b=document.createElement('button');
        b.textContent=label;
        b.style.cssText=`width:100%;margin:6px 0;padding:8px;border:none;border-radius:6px;font-size:14px;color:#fff;background:${bg};cursor:pointer;`;
        mini.appendChild(b);
        return b;
    };

    const notesInner   = makeInnerBtn('📑 Generate Notes','#009688');
    const exampleInner = makeInnerBtn('🌍 Real‑World Analogy','#8e24aa');

    // Toggle mini panel
    helperBtn.onclick = () => {
        mini.style.display = mini.style.display==='none' ? 'block' : 'none';
    };

    /******************* Output Window Factory ***********/
    function createWindow(title, enablePDF=false){
        const wrap=document.createElement('div');
        wrap.style='position:fixed;bottom:160px;right:20px;width:320px;max-height:320px;overflow:auto;padding:12px;background:#fff;border:2px solid #666;border-radius:10px;box-shadow:0 4px 14px rgba(0,0,0,.3);z-index:10001;';
        const close=document.createElement('button');
        close.textContent='✖';
        close.style='position:absolute;top:6px;right:8px;border:none;background:none;font-size:16px;cursor:pointer;color:#555;';
        close.onclick=()=>wrap.remove();
        const h=document.createElement('h4');h.textContent=title;h.style='margin:0 0 8px;font-size:15px;color:#333;';
        const ta=document.createElement('textarea');ta.style='width:100%;height:200px;padding:6px;font-size:13px;resize:none;';
        wrap.append(close,h,ta);
        if(enablePDF){
            const pdfBtn=document.createElement('button');
            pdfBtn.textContent='⬇️ PDF';
            pdfBtn.style='margin-top:6px;padding:6px 12px;border:none;border-radius:4px;background:#2196f3;color:#fff;cursor:pointer;';
            pdfBtn.onclick=async()=>{
                if(!window.html2pdf){await new Promise(r=>{const s=document.createElement('script');s.src='https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';s.onload=r;document.body.appendChild(s);});}
                html2pdf().from(ta.value.replace(/\n/g,'<br>')).set({filename:`${title.replace(/\s+/g,'_')}.pdf`,margin:10}).save();
            };
            wrap.appendChild(pdfBtn);
        }
        document.body.appendChild(wrap);
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
        notesInner.textContent='⏳ Notes…';
        const tx = await fetchTranscript();
        if(!tx){alert('❌ Transcript not found');return notesInner.textContent='📑 Generate Notes';}
        const out = await cohereQuery(notesPrompt(tx), 550, 0.55);
        const ta = createWindow('Smart Notes', true);
        ta.value = out;
        notesInner.textContent='📑 Generate Notes';
    };

    exampleInner.onclick = async () => {
        exampleInner.textContent='⏳ Example…';
        const tx = await fetchTranscript();
        if(!tx){alert('❌ Transcript not found');return exampleInner.textContent='🌍 Real‑World Analogy';}
        const out = await cohereQuery(analogyPrompt(tx), 180, 0.7);
        const ta = createWindow('Real‑World Analogy');
        ta.value = out;
        exampleInner.textContent='🌍 Real‑World Analogy';
    };

    // Attach elements to page
    document.body.appendChild(helperBtn);
    document.body.appendChild(mini);

    // Still load original Version1.js features for compatibility
    const legacy = document.createElement('script');
    legacy.src = 'https://cdn.jsdelivr.net/gh/Shantnu-Talokar/Mama-Developer/Version1.js';
    document.body.appendChild(legacy);
})();

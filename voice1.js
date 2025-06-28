// ==UserScript==
// @name         Repeat After Me (Cohere + AssemblyAI)
// @version      1.0
// @description  Generates a definition from transcript and evaluates spoken response
// @match        *://*/*
// @grant        none
// ==/UserScript==

(async () => {
  const cohereKey = "zXH8KUSA3ncfZcxvIAZx5boAlGlTirN6LJmp706Q";
  const assemblyKey = "5f3f5ee81a4d40f290c3b7cba3c07ead";

  // 📦 Inject button and panel
  const button = document.createElement("button");
  button.innerText = "🔁 Read After Me";
  button.style = "position:fixed;bottom:20px;right:20px;padding:10px 15px;z-index:10000;background:#4CAF50;color:white;border:none;border-radius:5px;";
  document.body.appendChild(button);

  const panel = document.createElement("div");
  panel.id = "definitionPanel";
  panel.style = "position:fixed;bottom:70px;right:20px;max-width:300px;padding:10px;background:#f0f0f0;border:1px solid #ccc;border-radius:8px;font-size:16px;z-index:10000;display:none;";
  document.body.appendChild(panel);

  const timerDiv = document.createElement("div");
  timerDiv.id = "countdownTimer";
  timerDiv.style = "position:fixed;bottom:50px;right:340px;background:#222;color:#fff;padding:8px 12px;border-radius:8px;font-weight:bold;display:none;z-index:10001;";
  document.body.appendChild(timerDiv);

  button.onclick = async () => {
    // 🧾 Get transcript
    const transcriptSpans = document.querySelectorAll('[data-purpose="transcript-panel"] span');
    if (!transcriptSpans.length) {
      alert("📜 Please open the transcript panel first.");
      return;
    }

    const transcript = Array.from(transcriptSpans).map(s => s.textContent.trim()).join(' ').slice(0, 1000);

    // ✨ Generate definition using Cohere
    const cohereRes = await fetch("https://api.cohere.ai/v1/generate", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${cohereKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "command",
        prompt: `This is my transcript: ${transcript}. Please generate a complete sentence that clearly defines a specific concept or component discussed in this transcript. For example, if the lecture is about right joins, generate a complete definition of right join.`,
        max_tokens: 60,
        temperature: 0.5
      })
    });

    const defData = await cohereRes.json();
    const definition = defData.generations[0].text.trim();
    panel.innerText = "🧠 " + definition;
    panel.style.display = "block";

    // ❗ Do NOT speak the definition — user will read it manually

    // 🎙️ Record voice (30 sec with countdown)
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream);
    const audioChunks = [];

    recorder.ondataavailable = e => audioChunks.push(e.data);
    recorder.start();

    let seconds = 30;
    timerDiv.style.display = "block";
    timerDiv.textContent = `🎤 Speak now: ${seconds}s`;
    const interval = setInterval(() => {
      seconds--;
      timerDiv.textContent = `🎤 Speak now: ${seconds}s`;
      if (seconds <= 0) {
        clearInterval(interval);
        timerDiv.style.display = "none";
        recorder.stop();
        stream.getTracks().forEach(track => track.stop());
      }
    }, 1000);

    await new Promise(r => recorder.onstop = r);

    const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });

    // ⬆️ Upload to AssemblyAI
    const uploadRes = await fetch("https://api.assemblyai.com/v2/upload", {
      method: "POST",
      headers: { authorization: assemblyKey },
      body: audioBlob
    });
    const { upload_url } = await uploadRes.json();

    const transcribeRes = await fetch("https://api.assemblyai.com/v2/transcript", {
      method: "POST",
      headers: {
        authorization: assemblyKey,
        "content-type": "application/json"
      },
      body: JSON.stringify({ audio_url: upload_url })
    });
    const { id: transcriptId } = await transcribeRes.json();
    const pollUrl = `https://api.assemblyai.com/v2/transcript/${transcriptId}`;

    const waitForTranscript = async () => {
      while (true) {
        const res = await fetch(pollUrl, {
          headers: { authorization: assemblyKey }
        });
        const data = await res.json();
        if (data.status === "completed") return data.text.toLowerCase();
        await new Promise(r => setTimeout(r, 3000));
      }
    };

    const userText = await waitForTranscript();
    const clean = s => s.replace(/[^\w\s]/gi, '').toLowerCase().split(/\s+/);
    const wordsA = clean(definition);
    const wordsB = clean(userText);
    const matchCount = wordsA.filter(w => wordsB.includes(w)).length;
    const similarity = matchCount / Math.max(wordsA.length, wordsB.length);

    panel.innerText += "\n\n🗣️ You said: " + userText +
      (similarity > 0.85 ? "\n✅ Matched! Well done." : "\n❌ Doesn't match closely. Try again.");
  };
})();

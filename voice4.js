// ==UserScript==
// @name         Repeat After Me (Cohere + AssemblyAI)
// @version      1.2
// @description  Speaks definition segment-by-segment and waits for user to repeat each
// @match        *://*/*
// @grant        none
// ==/UserScript==

(async () => {
  const cohereKey = "zXH8KUSA3ncfZcxvIAZx5boAlGlTirN6LJmp706Q";
  const assemblyKey = "5f3f5ee81a4d40f290c3b7cba3c07ead";

  const button = document.createElement("button");
  button.innerText = "🔁 Read After Me";
  button.style = "position:fixed;bottom:20px;right:20px;padding:10px 15px;z-index:10000;background:#4CAF50;color:white;border:none;border-radius:5px;";
  document.body.appendChild(button);

  const panel = document.createElement("div");
  panel.id = "definitionPanel";
  panel.style = "position:fixed;bottom:70px;right:20px;max-width:300px;padding:10px;background:#f0f0f0;border:1px solid #ccc;border-radius:8px;font-size:16px;z-index:10000;display:none;";
  document.body.appendChild(panel);

  const speakSegment = text => new Promise(res => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.onend = res;
    speechSynthesis.speak(utterance);
  });

  button.onclick = async () => {
    const transcriptSpans = document.querySelectorAll('[data-purpose="transcript-panel"] span');
    if (!transcriptSpans.length) {
      alert("📜 Please open the transcript panel first.");
      return;
    }

    const transcript = Array.from(transcriptSpans).map(s => s.textContent.trim()).join(' ').slice(0, 1000);

    const cohereRes = await fetch("https://api.cohere.ai/v1/generate", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${cohereKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "command",
        prompt: `This is my transcript: ${transcript}. Please generate a complete sentence that clearly defines a specific concept or component discussed in this transcript. For example, if the lecture is about right joins, generate a complete definition of right join. The difinition should sound live some definition and should not exceed more than 20 words`,
        max_tokens: 60,
        temperature: 0.5
      })
    });

    const defData = await cohereRes.json();
    const definition = defData.generations[0].text.trim();
    panel.innerText = "🧠 " + definition;
    panel.style.display = "block";

    const segments = definition.split(/[,.;!?]\s*/).filter(Boolean);

    const clean = s => s.replace(/[^\w\s]/gi, '').toLowerCase().split(/\s+/);
    let totalMatch = 0, totalWords = 0;

    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i].trim();

      await speakSegment(`Now repeat: ${segment}`);

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const audioChunks = [];

      recorder.ondataavailable = e => audioChunks.push(e.data);
      recorder.start();

      // Wait for user to click OK before stopping recording
      await new Promise(resolve => {
        const confirmBtn = document.createElement("button");
        confirmBtn.innerText = `✅ I’ve said part ${i + 1}`;
        confirmBtn.style = "position:fixed;bottom:140px;right:20px;padding:6px 10px;z-index:10000;background:#2196F3;color:white;border:none;border-radius:4px;";
        confirmBtn.onclick = () => {
          confirmBtn.remove();
          recorder.stop();
          resolve();
        };
        document.body.appendChild(confirmBtn);
      });

      await new Promise(r => recorder.onstop = r);
      stream.getTracks().forEach(track => track.stop());

      const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
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
      const wordsA = clean(segment);
      const wordsB = clean(userText);

      const matchCount = wordsA.filter(w => wordsB.includes(w)).length;
      totalMatch += matchCount;
      totalWords += wordsA.length;

      panel.innerText += `\n🔹 Segment: "${segment}"\n🔈 You said: "${userText}"`;
    }

    const similarity = totalMatch / totalWords;
    panel.innerText += `\n\n${similarity > 0.85 ? "✅ Matched! Well done." : "❌ Doesn't match closely. Try again."}`;
  };
})();

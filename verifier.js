window.startCheck = async function () {
  const email = prompt("📧 Enter your email to request access:");
  if (!email) {
    alert("❌ Email is required.");
    return false;
  }

  const maxWait = 120000; // 2 minutes
  const interval = 3000;
  let elapsed = 0;

  alert("⏳ Waiting for admin approval...");

  async function poll() {
    try {
      const res = await fetch(`http://localhost:3000/check-access?email=${encodeURIComponent(email)}`);
      const txt = await res.text();
      if (res.ok && !txt.startsWith('//')) {
        const blob = new Blob([txt], { type: 'application/javascript' });
        const url = URL.createObjectURL(blob);
        await import(url);
        return true;
      } else {
        console.log(`⏳ [${elapsed}s] Waiting: ${txt}`);
      }
    } catch (e) {
      console.error("❌ Server error:", e);
    }
    return false;
  }

  const waitLoop = async () => {
    const ok = await poll();
    if (ok) return true;

    elapsed += interval;
    if (elapsed >= maxWait) {
      alert("❌ Timeout: Admin did not approve within 2 minutes.");
      return false;
    }

    return new Promise(resolve => setTimeout(() => resolve(waitLoop()), interval));
  };

  return await waitLoop();
};

const evalBtn = document.createElement('button');
evalBtn.textContent = '🧠 Evaluate Project';
evalBtn.style.cssText =
    'margin-top:10px;padding:6px 12px;border:none;background:#9c27b0;color:white;border-radius:4px;cursor:pointer;';
document.body.appendChild(evalBtn); // Ensure button is added to the DOM

evalBtn.onclick = async () => {
    const ghInput = document.querySelector('input'); // Fallback if ghInput not defined
    if (!ghInput) {
        alert('❌ GitHub input element not found.');
        return;
    }
    const link = ghInput.value.trim();
    if (!link.startsWith('https://github.com/')) {
        alert('❌ Please enter a valid GitHub repository link.');
        return;
    }

    evalResult.innerHTML = '🔍 Evaluating project… please wait...';

    const evalPrompt =
        `You're a project evaluater to evaluate my github project :${link}, give me ratings on the project based on various parameters like structure of repo, code feasibility, alignment, innovation, readme etc and also give me suggestions as well. I want to make a pie chart take these parameters and rate them and give value as they form a piechart example:{code feasibility:30%, alignment:20%, readme:20%, innovation:20%, uniqueness:10%}`;

    try {
        const feedback = await cohereQuery(evalPrompt, 500);
        evalResult.innerHTML = '✅ <b>Evaluation:</b><br><br>' + feedback.replace(/\n/g, '<br>');

        // Extract object-like string from Cohere response using regex
        const pieMatch = feedback.match(/\{([^}]+)\}/);
        if (!pieMatch) throw new Error("No pie chart data found");

        const pieRaw = pieMatch[1];  // key: value% pairs
        const entries = pieRaw.split(',').map(part => {
            const [key, val] = part.split(':');
            return [key.trim(), parseFloat(val.replace('%', ''))];
        });

        const labels = entries.map(([label]) => label);
        const data = entries.map(([, value]) => value);

        // Construct QuickChart URL
        const chartUrl = `https://quickchart.io/chart?c=${encodeURIComponent(JSON.stringify({
            type: 'pie',
            data: {
                labels,
                datasets: [{ data }]
            },
            options: {
                plugins: {
                    legend: { position: 'right' }
                }
            }
        }))}`;

        // Inject image into DOM
        const img = new Image();
        img.src = chartUrl;
        img.style = 'margin-top:20px;max-width:300px;border-radius:10px;';
        evalResult.appendChild(img);

    } catch (err) {
        evalResult.innerHTML =
            '<span style="color:red">❌ Error evaluating project or generating chart – see console.</span>';
        console.error(err);
    }
};

const evalResult = document.createElement('div');
evalResult.id = 'evalResult';

document.body.appendChild(evalResult); // Ensure result container is on the page

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

const visBtn = document.createElement('button');
visBtn.textContent = '📊 Visualize Analysis';
visBtn.style.cssText =
    'margin-top:10px;margin-left:10px;padding:6px 12px;border:none;background:#2196f3;color:white;border-radius:4px;cursor:pointer;';
evalResult.appendChild(visBtn);

visBtn.onclick = async () => {
    const link = ghInput.value.trim();
    if (!link.startsWith('https://github.com/')) {
        alert('❌ Please enter a valid GitHub repository link.');
        return;
    }

    evalResult.innerHTML = '📈 Generating visualization… please wait...';

    const piePrompt = `This is my github project ${link}, I want to make a pie chart of this on various factors of scoring criteria. My scoring criteria is {code feasibility:30%, alignment:20%, readme:20%, innovation:20%, uniqueness:10%}. Generate values for each factor to make a piechart out of it.`;

    try {
        const response = await cohereQuery(piePrompt, 500);

        const pieMatch = response.match(/\{([^}]+)\}/);
        if (!pieMatch) throw new Error("No pie chart data found");

        const pieRaw = pieMatch[1];
        const entries = pieRaw.split(',').map(part => {
            const [key, val] = part.split(':');
            return [key.trim(), parseFloat(val.replace('%', ''))];
        });

        const labels = entries.map(([label]) => label);
        const data = entries.map(([, value]) => value);

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

        const img = new Image();
        img.src = chartUrl;
        img.style = 'margin-top:20px;max-width:300px;border-radius:10px;';
        evalResult.appendChild(img);

    } catch (err) {
        evalResult.innerHTML =
            '<span style="color:red">❌ Error generating visualization – see console.</span>';
        console.error(err);
    }
};

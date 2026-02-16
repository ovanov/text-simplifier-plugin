// Function to inject the simplification UI
function injectSimplifier() {
  // Target common news paragraph tags
  const paragraphs = document.querySelectorAll('article p, .article-content p');

  paragraphs.forEach((p, index) => {
    // Prevent double injection if script runs twice
    if (p.dataset.simplified) return;
    p.dataset.simplified = "true";

    const container = document.createElement('div');
    container.className = "simplifier-container";

    const btn = document.createElement('button');
    btn.innerText = "✨ Text vereinfachen";
    btn.className = "simplify-btn";

    btn.onclick = async () => {
      const originalText = p.innerText;
      btn.innerText = "⏳ Verarbeite...";
      btn.disabled = true;

      try {
        const response = await fetch('http://localhost:8000/simplify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            text: originalText,
            method: "icl" // This can be changed via popup later
          })
        });

        const data = await response.json();
        displayResult(p, data.simplified);
        btn.innerText = "✅ Fertig";
      } catch (error) {
        console.error("Error:", error);
        btn.innerText = "❌ Fehler (Server an?)";
        btn.disabled = false;
      }
    };

    p.prepend(btn);
  });
}

function displayResult(targetElement, simplifiedText) {
  const resultDiv = document.createElement('div');
  resultDiv.className = "simplified-result-box";
  resultDiv.innerHTML = `
    <small><b>Einfache Sprache:</b></small>
    <p>${simplifiedText}</p>
  `;
  targetElement.after(resultDiv);
}

// Run on load
injectSimplifier();

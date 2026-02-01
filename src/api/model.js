// model.js - Client for Model API via Background Proxy

export async function handleModelRequest(systemPrompt, userPrompt, outputElement, copyBtn, callbacks = {}) {
    let fullResponseText = "";

    // Connect to background script
    const port = chrome.runtime.connect({ name: "model_stream" });

    // Send request
    port.postMessage({
        action: "start_stream",
        systemPrompt: systemPrompt,
        userPrompt: userPrompt
    });

    // Handle incoming messages
    port.onMessage.addListener((msg) => {
        if (msg.type === "chunk") {
            fullResponseText += msg.content;
            outputElement.innerHTML = marked.parse(fullResponseText);
            if (callbacks.onUpdate) callbacks.onUpdate();
        } else if (msg.type === "done") {
            // Show buttons
            if (copyBtn) {
                copyBtn.style.display = 'inline-block';
                copyBtn.onclick = () => {
                    navigator.clipboard.writeText(fullResponseText);
                    const originalText = copyBtn.textContent;
                    copyBtn.textContent = "Copied!";
                    setTimeout(() => copyBtn.textContent = originalText, 2000);
                };
            }
            port.disconnect();
        } else if (msg.type === "error") {
            outputElement.textContent = `Error: ${msg.message}`;
            port.disconnect();
        }
    });

    // Handle disconnects
    port.onDisconnect.addListener(() => {
        if (chrome.runtime.lastError) {
            outputElement.textContent = `Connection Error: ${chrome.runtime.lastError.message}`;
        }
    });
}

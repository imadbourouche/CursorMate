// Initialize behavior on install/startup
chrome.runtime.onInstalled.addListener(initializeBehavior);
chrome.runtime.onStartup.addListener(initializeBehavior);

function initializeBehavior() {
    chrome.storage.sync.get(['behavior'], (result) => {
        updateActionBehavior(result.behavior || 'icon');
    });
}

// Listen for changes in settings
chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'sync' && changes.behavior) {
        updateActionBehavior(changes.behavior.newValue);
    }
});

function updateActionBehavior(behavior) {
    // Always use the native popup for the extension icon
    chrome.action.setPopup({ popup: 'src/ui/popup/popup.html' });
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "openOptions") {
        chrome.runtime.openOptionsPage();
    }
});

// --- Streaming API Proxy ---
chrome.runtime.onConnect.addListener((port) => {
    console.log("Connected to port:", port.name);
    console.log("Extension ID:", chrome.runtime.id);

    if (port.name === "model_stream") {
        port.onMessage.addListener(async (msg) => {
            if (msg.action === "start_stream") {
                try {
                    // Fetch settings
                    const settings = await chrome.storage.sync.get(['modelConfig']);
                    const config = settings.modelConfig;

                    if (!config || !config.MODEL_API_URL || !config.MODEL_API_KEY) {
                        throw new Error("Please configure the Model API URL and Key in the extension settings.");
                    }

                    const response = await fetch(config.MODEL_API_URL, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${config.MODEL_API_KEY}`
                        },
                        body: JSON.stringify({
                            "model": config.MODEL,
                            "stream": true,
                            "messages": [
                                { "role": "system", "content": msg.systemPrompt },
                                { "role": "user", "content": msg.userPrompt }
                            ]
                        })
                    });

                    if (!response.ok) {
                        if (response.status === 429) {
                            const errorData = await response.json();
                            throw new Error(`Rate limit exceeded. Reset in ${errorData.resetIn}s`);
                        }
                        throw new Error(`API Error: ${response.status}`);
                    }

                    const reader = response.body.getReader();
                    const decoder = new TextDecoder("utf-8");
                    let buffer = "";

                    while (true) {
                        const { done, value } = await reader.read();
                        if (done) break;

                        const chunk = decoder.decode(value, { stream: true });
                        buffer += chunk;

                        const lines = buffer.split("\n");
                        buffer = lines.pop();

                        for (const line of lines) {
                            const trimmedLine = line.trim();
                            if (!trimmedLine.startsWith("data: ")) continue;

                            const dataStr = trimmedLine.replace("data: ", "");
                            if (dataStr === "[DONE]") continue;

                            try {
                                const json = JSON.parse(dataStr);
                                const contentFragment = json.choices[0]?.delta?.content || "";
                                if (contentFragment) {
                                    port.postMessage({ type: "chunk", content: contentFragment });
                                }
                            } catch (e) {
                                // ignore parse errors for partial chunks
                            }
                        }
                    }
                    port.postMessage({ type: "done" });

                } catch (error) {
                    port.postMessage({ type: "error", message: error.message });
                }
            }
        });
    }
});

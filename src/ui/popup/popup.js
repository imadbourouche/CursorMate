// popup.js - Logic for the browser action popup (Manual Mode)
import { handleModelRequest } from '../../api/model.js';
import { getActions } from '../../utils/storage.js';
import { constructUserPrompt, setupCustomInput, focusCustomInput } from '../../utils/actionHandler.js';
import { DEFAULT_SYSTEM_PROMPT } from '../../utils/constants.js';

let selectedText = '';

// --- Load UI and Get Selection ---
document.addEventListener('DOMContentLoaded', async () => {
    // Load HTML
    try {
        const response = await fetch(chrome.runtime.getURL('src/ui/main-ui/ui.html'));
        const html = await response.text();
        document.getElementById('app-container').innerHTML = html;

        // Initialize
        await loadActions();
        await loadSelection();

        // Setup custom input listener
        const customInput = document.getElementById('custom-prompt');
        if (customInput) {
            setupCustomInput(customInput, (value) => {
                handleAction('custom', value);
            });
        }

        // Setup options link
        const optionsLink = document.getElementById('off');
        if (optionsLink) {
            optionsLink.addEventListener('click', (e) => {
                e.preventDefault();
                chrome.runtime.openOptionsPage();
            });
        }

    } catch (err) {
        console.error("Failed to load ui.html", err);
    }
});

async function loadSelection() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab) {
        document.querySelector('.selected-text-display').textContent = "No active tab found.";
        return;
    }

    try {
        const response = await chrome.tabs.sendMessage(tab.id, { action: "get_selection" });
        if (response && response.text) {
            selectedText = response.text;
            document.querySelector('.selected-text-display').innerHTML = "<strong>Context:</strong> " + selectedText;
        } else {
            // No text selected, pre-fill custom prompt
            selectedText = "";
            document.querySelector('.selected-text-display').textContent = "No text selected. You can draft new content below.";
            document.querySelector('.selected-text-display').style.color = "#888";
        }
        const customInput = document.getElementById('custom-prompt');
        if (customInput) {
            focusCustomInput(customInput);
        }
    } catch (e) {
        document.querySelector('.selected-text-display').textContent = "Could not connect to page. Try reloading the page.";
    }
}

async function loadActions() {
    // Load Actions from Storage
    const actions = await getActions();
    const actionsContainer = document.querySelector('.popup-actions');
    actionsContainer.innerHTML = '';

    actions.forEach(action => {
        const btn = document.createElement('button');
        btn.className = 'action-btn';
        btn.title = action.name;
        btn.textContent = action.emoji;
        btn.dataset.prompt = action.prompt;
        btn.addEventListener('click', () => handleAction('dynamic', null, action.prompt));
        actionsContainer.appendChild(btn);
    });
}

async function handleAction(actionType, customPrompt = null, dynamicPrompt = null) {
    const responseArea = document.getElementById('ai-response-area');
    const outputElement = document.getElementById('stream-output');
    const copyBtn = document.getElementById('btn-copy-response');


    responseArea.style.display = 'block';
    outputElement.textContent = "Thinking...";
    if (copyBtn) copyBtn.style.display = 'none';

    chrome.storage.sync.get(['systemPrompt'], async (result) => {
        let systemPrompt = result.systemPrompt || DEFAULT_SYSTEM_PROMPT;
        const userPrompt = constructUserPrompt(actionType, selectedText, customPrompt, dynamicPrompt);

        await handleModelRequest(systemPrompt, userPrompt, outputElement, copyBtn, {});
    });
}


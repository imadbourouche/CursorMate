import { DEFAULT_ACTIONS, EMOJI_API_URL } from '../../utils/constants.js';
import { getActions, saveActions, getModelConfig, saveModelConfig, resetModelConfig, getBehavior, saveBehavior, getSystemPrompt, saveSystemPrompt } from '../../utils/storage.js';

document.addEventListener('DOMContentLoaded', () => {
    loadActions();
    setupEmojiPicker();
    loadModelSettings();
    loadSystemPromptSetting();
});
document.getElementById('add-btn').addEventListener('click', addAction);
document.getElementById('reset-btn').addEventListener('click', resetDefaults);
document.getElementById('save-model-btn').addEventListener('click', saveModelSettings);
document.getElementById('save-system-prompt-btn').addEventListener('click', saveSystemPromptSetting);
document.getElementById('reset-model-btn').addEventListener('click', resetModelSettings);

async function loadSystemPromptSetting() {
    const prompt = await getSystemPrompt();
    document.getElementById('system-prompt').value = prompt;
}

async function saveSystemPromptSetting() {
    const prompt = document.getElementById('system-prompt').value.trim();
    if (!prompt) {
        alert('System prompt cannot be empty');
        return;
    }
    await saveSystemPrompt(prompt);
    alert('System prompt saved!');
}

async function loadModelSettings() {
    const config = await getModelConfig();
    if (config) {
        document.getElementById('model-name').value = config.MODEL;
        document.getElementById('model-url').value = config.MODEL_API_URL;
        document.getElementById('model-key').value = config.MODEL_API_KEY;
    }
}

async function saveModelSettings() {
    const modelName = document.getElementById('model-name').value.trim();
    const modelUrl = document.getElementById('model-url').value.trim();
    const modelKey = document.getElementById('model-key').value.trim();

    if (!modelName || !modelUrl || !modelKey) {
        alert('Please fill in all model configuration fields');
        return;
    }

    const modelConfig = {
        MODEL: modelName,
        MODEL_API_URL: modelUrl,
        MODEL_API_KEY: modelKey
    };

    await saveModelConfig(modelConfig);
    alert('Model settings saved!');
}

async function resetModelSettings() {
    if (!confirm('Reset model settings to default?')) return;
    await resetModelConfig();
    document.getElementById('model-name').value = '';
    document.getElementById('model-url').value = '';
    document.getElementById('model-key').value = '';
    alert('Model settings reset to default.');
}

async function loadActions() {
    const actions = await getActions();
    renderActions(actions);

    const behavior = await getBehavior();
    const radio = document.querySelector(`input[name="behavior"][value="${behavior}"]`);
    if (radio) radio.checked = true;
}

// Save behavior when changed
document.querySelectorAll('input[name="behavior"]').forEach(radio => {
    radio.addEventListener('change', async (e) => {
        await saveBehavior(e.target.value);
    });
});

let editingIndex = null;

function renderActions(actions) {
    const container = document.getElementById('action-list');
    container.innerHTML = '';

    actions.forEach((action, index) => {
        const div = document.createElement('div');
        div.className = 'action-item';
        div.innerHTML = `
      <div class="action-emoji">${action.emoji}</div>
      <div class="action-details">
        <div class="action-name">${action.name}</div>
        <div class="action-prompt">${action.prompt}</div>
      </div>
      <div style="display:flex; gap:5px;">
        <button class="btn edit-btn" data-index="${index}">Edit</button>
        <button class="btn btn-danger delete-btn" data-index="${index}">Remove</button>
      </div>
    `;
        container.appendChild(div);
    });

    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            deleteAction(parseInt(e.target.dataset.index));
        });
    });

    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            startEditing(parseInt(e.target.dataset.index));
        });
    });
}

function setupEmojiPicker() {
    const pickBtn = document.getElementById('pick-emoji-btn');
    const picker = document.getElementById('emoji-picker');
    const searchInput = document.getElementById('emoji-search');
    const grid = document.getElementById('emoji-grid');
    const emojiInput = document.getElementById('new-emoji');

    let allEmojis = [];

    // Toggle Picker
    pickBtn.addEventListener('click', () => {
        const isHidden = picker.style.display === 'none';
        picker.style.display = isHidden ? 'block' : 'none';
        if (isHidden) {
            if (allEmojis.length === 0) {
                fetchEmojis();
            } else {
                renderEmojiGrid();
                searchInput.focus();
            }
        }
    });

    // Search Filter
    searchInput.addEventListener('input', (e) => {
        renderEmojiGrid(e.target.value.toLowerCase());
    });

    function fetchEmojis() {
        grid.innerHTML = '<div style="text-align:center; padding:10px; color:#666;">Loading emojis...</div>';

        // Check cache first (using v2 key to force refresh from old api)
        chrome.storage.local.get(['cachedEmojis_v2'], (result) => {
            if (result.cachedEmojis_v2 && result.cachedEmojis_v2.length > 0) {
                allEmojis = result.cachedEmojis_v2;
                renderEmojiGrid();
            } else {
                // Fetch from new source
                fetch(EMOJI_API_URL)
                    .then(response => response.json())
                    .then(data => {
                        // Process data: Array of objects { codes, char, name, category, ... }
                        allEmojis = data.map(item => {
                            return {
                                char: item.char,
                                name: item.name.toLowerCase(), // keywords
                                category: item.category.toLowerCase()
                            };
                        });

                        // Cache them
                        chrome.storage.local.set({ cachedEmojis_v2: allEmojis });
                        renderEmojiGrid();
                    })
                    .catch(err => {
                        console.error('Failed to fetch emojis', err);
                        grid.innerHTML = '<div style="text-align:center; padding:10px; color:red;">Failed to load emojis. Check internet.</div>';
                    });
            }
        });
    }

    // Render Grid
    function renderEmojiGrid(filter = '') {
        grid.innerHTML = '';

        // Limit to first 100 if no filter to avoid lag, or implement virtualization
        // For now, let's just limit display count if no filter
        let count = 0;
        const maxDisplay = filter ? 500 : 100;

        for (const item of allEmojis) {
            if (count >= maxDisplay) break;

            if (!filter || item.name.includes(filter) || item.category.includes(filter)) {
                const span = document.createElement('span');
                span.textContent = item.char;
                span.title = item.name;
                span.style.cursor = 'pointer';
                span.style.fontSize = '20px';
                span.style.textAlign = 'center';
                span.style.padding = '4px';
                span.style.borderRadius = '4px';

                span.onmouseover = () => span.style.background = '#f0f0f0';
                span.onmouseout = () => span.style.background = 'transparent';

                span.onclick = () => {
                    emojiInput.value = item.char;
                    picker.style.display = 'none';
                };
                grid.appendChild(span);
                count++;
            }
        }

        if (allEmojis.length > 0 && grid.children.length === 0) {
            grid.innerHTML = '<div style="grid-column: 1/-1; text-align:center; padding:10px; color:#888;">No emojis found</div>';
        }
    }
}

async function startEditing(index) {
    const actions = await getActions();
    const action = actions[index];

    document.getElementById('new-name').value = action.name;
    document.getElementById('new-emoji').value = action.emoji;
    document.getElementById('new-prompt').value = action.prompt;

    editingIndex = index;
    const addBtn = document.getElementById('add-btn');
    addBtn.textContent = 'Update Action';
    addBtn.classList.remove('btn-primary');
    addBtn.style.background = '#34a853'; // Green for update
    addBtn.style.color = 'white';

    // Scroll to form
    document.querySelector('.add-section:last-child').scrollIntoView({ behavior: 'smooth' });
}

async function addAction() {
    const name = document.getElementById('new-name').value.trim();
    const emoji = document.getElementById('new-emoji').value.trim();
    const prompt = document.getElementById('new-prompt').value.trim();

    if (!name || !emoji || !prompt) {
        alert('Please fill in all fields');
        return;
    }

    const actions = await getActions();

    if (editingIndex !== null) {
        // Update existing
        actions[editingIndex] = {
            ...actions[editingIndex],
            name,
            emoji,
            prompt
        };
        editingIndex = null;
        const addBtn = document.getElementById('add-btn');
        addBtn.textContent = 'Add Action';
        addBtn.classList.add('btn-primary');
        addBtn.style.background = '';
        addBtn.style.color = '';
    } else {
        // Add new
        actions.push({
            id: 'custom_' + Date.now(),
            name,
            emoji,
            prompt
        });
    }

    await saveActions(actions);
    loadActions();
    // Clear form
    document.getElementById('new-name').value = '';
    document.getElementById('new-emoji').value = '';
    document.getElementById('new-prompt').value = '';
}

async function deleteAction(index) {
    if (!confirm('Are you sure you want to remove this action?')) return;

    const actions = await getActions();
    actions.splice(index, 1);
    await saveActions(actions);
    loadActions();
}

async function resetDefaults() {
    if (!confirm('Reset all actions to default? This will remove custom actions.')) return;
    await saveActions(DEFAULT_ACTIONS);
    loadActions();
}

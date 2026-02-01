import { DragHandler } from './DragHandler.js';
import { handleModelRequest } from '../../api/model.js';
import { UI_CONFIG, DEFAULT_SYSTEM_PROMPT } from '../../utils/constants.js';
import { getActions } from '../../utils/storage.js';
import { constructUserPrompt, setupCustomInput, focusCustomInput } from '../../utils/actionHandler.js';

export class PopupManager {
    constructor(callbacks) {
        this.element = null;
        this.callbacks = callbacks || {}; // { onClose, onReplace }
        this._dragCleanup = null;
    }

    async show(anchorRect, selectedText, useBottom = false) {
        if (this.element) return; // Already open

        this.element = document.createElement('div');
        this.element.className = 'text-selection-popup';
        this.element.style.zIndex = UI_CONFIG.Z_INDEX_POPUP; // Higher than icon

        // Fetch HTML content
        try {
            const response = await fetch(chrome.runtime.getURL(UI_CONFIG.POPUP_HTML_PATH));
            const html = await response.text();
            this.element.innerHTML = html;

            this._setupUI(selectedText);
            await this._setupActions(selectedText);
            this._setupEventListeners(selectedText);

        } catch (err) {
            console.error("Failed to load popup.html", err);
            this.element.innerHTML = "<p>Error loading popup</p>";
        }

        document.body.appendChild(this.element);
        this._position(anchorRect, useBottom);

        // Prevent mousedown inside popup from closing it
        this.element.addEventListener('mousedown', (e) => e.stopPropagation());

        // Setup Drag
        const popupHeader = this.element.querySelector('.popup-header');
        if (popupHeader) {
            this._dragCleanup = DragHandler.attach(this.element, popupHeader);
        }
    }

    close() {
        if (this.element) {
            if (this._dragCleanup) this._dragCleanup();
            this.element.remove();
            this.element = null;
            if (this.callbacks.onClose) this.callbacks.onClose();
        }
    }

    contains(target) {
        return this.element && this.element.contains(target);
    }

    getBoundingClientRect() {
        return this.element ? this.element.getBoundingClientRect() : null;
    }

    _setupUI(selectedText) {
        const display = this.element.querySelector('.selected-text-display');
        if (display) {
            display.innerHTML = "<strong>Context:</strong> " + selectedText;
        }
    }

    async _setupActions(selectedText) {
        const actions = await getActions();
        const actionsContainer = this.element.querySelector('.popup-actions');
        actionsContainer.innerHTML = '';

        actions.forEach(action => {
            const btn = document.createElement('button');
            btn.className = 'action-btn';
            btn.title = action.name;
            btn.textContent = action.emoji;
            btn.dataset.prompt = action.prompt;
            btn.addEventListener('click', () => this._handleAction('dynamic', selectedText, null, action.prompt));
            actionsContainer.appendChild(btn);
        });
    }

    _setupEventListeners(selectedText) {
        const closeBtn = this.element.querySelector('.close-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.close());
        }

        const optionsLink = this.element.querySelector('#off');
        if (optionsLink) {
            optionsLink.addEventListener('click', (e) => {
                e.preventDefault();
                chrome.runtime.sendMessage({ action: "openOptions" });
            });
        }

        const customInput = this.element.querySelector('#custom-prompt');
        if (customInput) {
            // If no text is selected, focus the input and pre-fill with "Context: "
            focusCustomInput(customInput);
            setupCustomInput(customInput, (value) => {
                this._handleAction('custom', selectedText, value);
            });
        }
    }

    _position(anchorRect, useBottom) {
        const popupRect = this.element.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        let left = anchorRect.left + window.scrollX;
        let top = anchorRect.bottom + window.scrollY + 10;
        let forceBottom = useBottom;

        // Check Right Edge
        if (anchorRect.left + popupRect.width > viewportWidth) {
            left = (viewportWidth - popupRect.width - 10) + window.scrollX;
        }
        // Check Left Edge
        if (left < 0) left = 10;

        // Check Bottom Edge
        if (anchorRect.bottom + popupRect.height + 10 > viewportHeight + window.scrollY) {
            forceBottom = true;
            top = anchorRect.top + window.scrollY - 10;
        }

        this.element.style.position = 'absolute';
        this.element.style.left = `${left}px`;

        if (forceBottom) {
            this.element.style.top = `${top}px`;
            this.element.style.transform = 'translateY(-100%)';
        } else {
            this.element.style.top = `${top}px`;
            this.element.style.transform = 'none';
        }
    }

    async _handleAction(actionType, selectedText, customPrompt = null, dynamicPrompt = null) {
        const responseArea = document.getElementById('ai-response-area');
        const outputElement = document.getElementById('stream-output');
        const copyBtn = document.getElementById('btn-copy-response');


        if (responseArea) responseArea.style.display = 'block';
        if (outputElement) outputElement.textContent = "Thinking...";
        if (copyBtn) copyBtn.style.display = 'none';

        chrome.storage.sync.get(['systemPrompt'], async (result) => {
            let systemPrompt = result.systemPrompt || DEFAULT_SYSTEM_PROMPT;
            const userPrompt = constructUserPrompt(actionType, selectedText, customPrompt, dynamicPrompt);
    
            await handleModelRequest(systemPrompt, userPrompt, outputElement, copyBtn, {
                onUpdate: () => {
                    const contentDiv = this.element.querySelector('.popup-content');
                    if (contentDiv) contentDiv.scrollTop = contentDiv.scrollHeight;
                }
            });
        });
    }
}

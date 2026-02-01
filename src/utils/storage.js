import { DEFAULT_ACTIONS, DEFAULT_SYSTEM_PROMPT } from './constants.js';

export function getActions() {
    return new Promise((resolve) => {
        chrome.storage.sync.get(['actions'], (result) => {
            let actions = result.actions;
            if (!actions) {
                actions = DEFAULT_ACTIONS;
                chrome.storage.sync.set({ actions });
            }
            resolve(actions);
        });
    });
}

export function saveActions(actions) {
    return new Promise((resolve) => {
        chrome.storage.sync.set({ actions }, resolve);
    });
}

export function getModelConfig() {
    return new Promise((resolve) => {
        chrome.storage.sync.get(['modelConfig'], (result) => {
            resolve(result.modelConfig);
        });
    });
}

export function saveModelConfig(config) {
    return new Promise((resolve) => {
        chrome.storage.sync.set({ modelConfig: config }, resolve);
    });
}

export function resetModelConfig() {
    return new Promise((resolve) => {
        chrome.storage.sync.remove('modelConfig', resolve);
    });
}

export function getBehavior() {
    return new Promise((resolve) => {
        chrome.storage.sync.get(['behavior'], (result) => {
            resolve(result.behavior || 'icon');
        });
    });
}

export function saveBehavior(behavior) {
    return new Promise((resolve) => {
        chrome.storage.sync.set({ behavior }, resolve);
    });
}

export function getSystemPrompt() {
    return new Promise((resolve) => {
        chrome.storage.sync.get(['systemPrompt'], (result) => {
            resolve(result.systemPrompt || DEFAULT_SYSTEM_PROMPT);
        });
    });
}

export function saveSystemPrompt(prompt) {
    return new Promise((resolve) => {
        chrome.storage.sync.set({ systemPrompt: prompt }, resolve);
    });
}

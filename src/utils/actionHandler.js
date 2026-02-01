export function constructUserPrompt(actionType, selectedText, customPrompt, dynamicPrompt) {
    if (actionType === 'custom') {
        return selectedText.trim() ? `${customPrompt}\n\nContext: ${selectedText}` : customPrompt;
    } else if (actionType === 'dynamic') {
        return dynamicPrompt.replace('{text}', selectedText);
    }
    return selectedText;
}

export function setupCustomInput(inputElement, onEnter) {
    if (!inputElement) return;

    // Stop propagation of key events to prevent site interference
    ['keydown', 'keyup', 'keypress'].forEach(eventType => {
        inputElement.addEventListener(eventType, (e) => {
            e.stopPropagation();
        });
    });

    inputElement.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (onEnter) onEnter(inputElement.value);
        }
    });
}

export function focusCustomInput(inputElement) {
    if (!inputElement) return;
    inputElement.placeholder = 'Custom Prompt: ';
    setTimeout(() => {
        inputElement.focus();
        inputElement.setSelectionRange(inputElement.value.length, inputElement.value.length);
    }, 50);
}

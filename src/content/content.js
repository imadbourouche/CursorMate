// --- Global Variables ---
let floatingIcon = null;
let popupManager = null;
let selectedText = '';

// --- Dynamic Import & Initialization ---
(async () => {
  try {
    const FloatingIconModule = await import(chrome.runtime.getURL('src/content/components/FloatingIcon.js'));
    const PopupManagerModule = await import(chrome.runtime.getURL('src/content/components/PopupManager.js'));

    const FloatingIcon = FloatingIconModule.FloatingIcon;
    const PopupManager = PopupManagerModule.PopupManager;

    // Initialize Managers
    floatingIcon = new FloatingIcon({
      onClick: () => showPopup()
    });

    popupManager = new PopupManager({
      onClose: () => {
        // When popup closes, we might want to remove icon too?
        // Requirement 4: Close popup AND hide icon
        if (floatingIcon) floatingIcon.remove();
      }
    });

    // --- Event Listeners ---
    document.addEventListener('mouseup', handleTextSelection);
    document.addEventListener('mousedown', handleOutsideClick);

  } catch (e) {
    console.error("Failed to import components", e);
  }
})();


// --- Core Functions ---

function handleOutsideClick(e) {
  // If we have a popup open
  if (popupManager && popupManager.element) {
    // If the click is NOT inside the popup AND NOT inside the icon
    if (!popupManager.contains(e.target) && (!floatingIcon || !floatingIcon.contains(e.target))) {
      popupManager.close();
      if (floatingIcon) floatingIcon.remove();
    }
  } else if (floatingIcon && floatingIcon.element) {
    // If only icon is open and we click outside it
    if (!floatingIcon.contains(e.target)) {
      floatingIcon.remove();
    }
  }
}

function handleTextSelection(e) {
  // 1. If clicking inside the icon or popup, do nothing
  if (e.target.closest('.text-selection-icon') || e.target.closest('.text-selection-popup')) {
    return;
  }

  const selection = window.getSelection();
  const text = selection.toString().trim();

  // 2. If text is selected, check behavior setting
  if (text.length > 0) {
    selectedText = text;

    // Check behavior setting
    chrome.storage.sync.get(['behavior'], (result) => {
      const behavior = result.behavior || 'icon';

      if (behavior === 'icon') {
        showFloatingIcon();
      } else if (behavior === 'immediate') {
        showFloatingIcon(); // Ensure icon exists as anchor
        showPopup();
      } else if (behavior === 'manual') {
        // Do nothing. Wait for browser action.
      }
    });

  } else {
    // Text deselected
  }
}

// Listen for manual trigger and popup interaction
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "trigger_popup") {
    const selection = window.getSelection();
    const text = selection.toString().trim();
    if (text.length > 0) {
      selectedText = text;
      showFloatingIcon();
      showPopup();
    } else {
      alert("Please select some text first.");
    }
  } else if (request.action === "get_selection") {
    const selection = window.getSelection();
    const text = selection.toString().trim();
    if (text.length > 0) {
      selectedText = text;
      sendResponse({ text: text });
    } else {
      sendResponse({ text: "" });
    }

  }
});

function showFloatingIcon() {
  if (!floatingIcon) return;

  const selection = window.getSelection();
  if (selection.rangeCount === 0) return;
  const range = selection.getRangeAt(0);
  const rect = range.getBoundingClientRect();

  floatingIcon.show(rect);
}

function showPopup() {
  if (!popupManager || !floatingIcon) return;

  const iconRect = floatingIcon.getBoundingClientRect();
  if (!iconRect) return; // Should not happen if showFloatingIcon was called

  popupManager.show(iconRect, selectedText);
}
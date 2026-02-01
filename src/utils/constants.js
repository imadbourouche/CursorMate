export const UI_CONFIG = {
    ROBOT_ICON_SVG: `<svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<rect x="2" y="4" width="20" height="16" rx="4" fill="#4285F4"/>
<circle cx="8" cy="10" r="2" fill="white"/>
<circle cx="16" cy="10" r="2" fill="white"/>
<path d="M8 16C8 16 10 18 12 18C14 18 16 16 16 16" stroke="white" stroke-width="2" stroke-linecap="round"/>
<rect x="10" y="2" width="4" height="2" fill="#4285F4"/>
</svg>`,
    Z_INDEX_ICON: '999999',
    Z_INDEX_POPUP: '1000000',
    POPUP_HTML_PATH: 'src/ui/main-ui/ui.html'
};

export const DEFAULT_SYSTEM_PROMPT = "You are a helpful assistant. respond with concise answer under 100 word.";

export const DEFAULT_ACTIONS = [
    { id: 'explain', name: 'Explain', emoji: '💡', prompt: 'Explain this text: {text}' },
    { id: 'summarize', name: 'Summarize', emoji: '📝', prompt: 'Summarize this text: {text}' },
    { id: 'reply', name: 'Reply', emoji: '↩️', prompt: 'Draft a reply to this text: {text}' },
    { id: 'email', name: 'Write Email', emoji: '📧', prompt: 'Write an email based on these points: {text}' },
];

export const EMOJI_API_URL = 'https://unpkg.com/emoji.json@13.1.0/emoji.json';

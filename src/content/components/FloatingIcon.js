import { UI_CONFIG } from '../../utils/constants.js';

export class FloatingIcon {
    constructor(callbacks) {
        this.element = null;
        this.callbacks = callbacks || {}; // { onClick }
    }

    show(selectionRect) {
        if (!this.element) {
            this.element = document.createElement('div');
            this.element.className = 'text-selection-icon';
            document.body.appendChild(this.element);

            // Prevent mousedown from bubbling to document (which would deselect text)
            this.element.onmousedown = (e) => {
                e.preventDefault();
                e.stopPropagation();
            };

            // Handle Click
            this.element.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (this.callbacks.onClick) this.callbacks.onClick();
            };
        }

        // Reset content/style incase it was removed or changed
        this.element.style.display = 'block';

        this.element.innerHTML = UI_CONFIG.ROBOT_ICON_SVG;

        this._position(selectionRect);
        this._applyStyles();
    }

    remove() {
        if (this.element) {
            this.element.remove();
            this.element = null;
        }
    }

    contains(target) {
        return this.element && this.element.contains(target);
    }

    getBoundingClientRect() {
        return this.element ? this.element.getBoundingClientRect() : null;
    }

    _position(rect) {
        // Position logic
        const iconSize = 40; // Approx size including padding/shadow
        const margin = 5;
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        // Default: Right of selection
        let left = rect.right + window.scrollX + margin;
        let top = rect.top + window.scrollY;

        // 1. Check Right Edge: If icon goes off-screen, move to Left
        if (rect.right + margin + iconSize > viewportWidth) {
            left = rect.left + window.scrollX - iconSize - margin;
        }

        // 2. Check Bottom Edge: If icon goes off-screen below, move up
        if (rect.top + iconSize > viewportHeight) {
            top = rect.bottom + window.scrollY - iconSize;
        }

        // 3. Check Top Edge: If moved up and goes off-screen, clamp
        if (top < window.scrollY) {
            top = window.scrollY + margin;
        }

        this.element.style.left = `${left}px`;
        this.element.style.top = `${top}px`;
    }

    _applyStyles() {
        this.element.style.position = 'absolute';
        this.element.style.zIndex = UI_CONFIG.Z_INDEX_ICON;
        this.element.style.cursor = 'pointer';
        this.element.style.width = '32px'; // Fixed size for icon container
        this.element.style.height = '32px';
        this.element.style.background = 'white'; // White bg for icon
        this.element.style.borderRadius = '50%';
        this.element.style.padding = '4px';
        this.element.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
        this.element.style.transition = 'transform 0.2s';

        // Hover effect
        this.element.onmouseenter = () => this.element.style.transform = 'scale(1.1)';
        this.element.onmouseleave = () => this.element.style.transform = 'scale(1)';
    }
}

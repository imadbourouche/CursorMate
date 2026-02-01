export class DragHandler {
    static attach(popup, handle) {
        let isDragging = false;
        let dragOffsetX = 0;
        let dragOffsetY = 0;

        const onMouseDown = (e) => {
            // Only allow dragging from header, not from close button
            if (e.target.closest('.close-btn')) return;

            isDragging = true;

            // Calculate offset between mouse and popup top-left corner
            const popupRect = popup.getBoundingClientRect();
            dragOffsetX = e.clientX - popupRect.left;
            dragOffsetY = e.clientY - popupRect.top;

            // Prevent text selection during drag
            e.preventDefault();

            // Add dragging class for visual feedback
            popup.style.opacity = '0.9';
        };

        const onMouseMove = (e) => {
            if (!isDragging) return;

            // Calculate new position
            const newLeft = e.clientX - dragOffsetX + window.scrollX;
            const newTop = e.clientY - dragOffsetY + window.scrollY;

            // Update popup position
            popup.style.left = `${newLeft}px`;
            popup.style.top = `${newTop}px`;
            popup.style.transform = 'none'; // Remove any transform when manually positioning
        };

        const onMouseUp = () => {
            if (isDragging) {
                isDragging = false;
                popup.style.opacity = '1';
            }
        };

        // Attach event listeners
        handle.addEventListener('mousedown', onMouseDown);
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);

        // Return cleanup function
        return () => {
            handle.removeEventListener('mousedown', onMouseDown);
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        };
    }
}

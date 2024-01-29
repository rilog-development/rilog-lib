import { IInteractivePanel } from './types';

class InteractivePanel implements IInteractivePanel {
    constructor() {}

    build(): void {
        this.createHTMLPanel();
    }

    private createHTMLPanel() {}

    private createHeader(headerTitle: string = 'Rilog lib') {
        const container = document.createElement('div');
        const title = document.createElement('h2');
        const logo = document.createElement('img');

        /**
         * Set up styles
         */
        container.style.padding = '16px';

        /**
         * Paste a header title to H2 title tag.
         */
        title.textContent = headerTitle;

        /**
         * Paste tags
         */
        container.appendChild(title);
        container.appendChild(logo);
    }
}

export default InteractivePanel;

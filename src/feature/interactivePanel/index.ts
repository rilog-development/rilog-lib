import { RIL_TOKEN, RIL_VERSION } from '../../constants';
import { IRilogExtension } from '../../types';

class InteractivePanel implements IRilogExtension {
    private headerColor = '#12191B';
    private bodyColor = '#002329';
    private inputColor = '#12191B';
    private inputId = 'rilog-lib-u-token';
    private panelId = 'rilog-lib-panel';
    private openButtonId = 'rilog-lib-open-btn';
    private closeButtonId = 'rilog-lib-close-btn';
    private copyButtonId = 'rilog-lib-copy-btn';

    build(): void {
        const panel = this.createHTMLPanel();
        const openButton = this.createOpenButton();
        const script = this.createScript();

        document.body.appendChild(openButton);
        document.body.appendChild(panel);
        document.body.appendChild(script);
    }

    private getToken() {
        return localStorage.getItem(RIL_TOKEN) || '';
    }

    private createHTMLPanel() {
        const container = document.createElement('div');
        const uToken = this.getToken();

        container.id = this.panelId;

        container.setAttribute('style', 'position:fixed;bottom:0;left:0;width:100%;z-index:998;display:none;');

        const header = this.createHeader('Rilog lib', RIL_VERSION);
        const body = this.createBody(uToken);

        container.appendChild(header);
        container.appendChild(body);

        return container;
    }

    private createOpenButton() {
        const container = document.createElement('div');

        container.id = this.openButtonId;

        container.setAttribute('style', 'position:fixed;bottom:16px;right:20px;z-index:998;');
        const buttonStyles = 'outline:none;box-shadow:none;border:none;background:transparent;cursor:pointer;';

        container.innerHTML = `<button onclick='rilogLibOnOpen()' id='${this.openButtonId}-elem' style='${buttonStyles}'><img src='https://i.ibb.co/nwm3Dxx/rilog-logo.png' href='Rilog'/></button>`;

        return container;
    }

    private createHeader(headerTitle = 'Rilog lib', version = '0.3.1') {
        const container = document.createElement('div');

        const containerStyles = `padding: 16px 20px; background: ${this.headerColor};color:#fff;display:flex;justify-content:space-between;align-items:center`;
        const titleContainerStyles = 'display:flex;align-items:center;';
        const titleStyles = 'margin: 0px;font-size:14px;font-family:Arial;font-weight:300';
        const versionStyles = 'margin-left:8px;color:#fff;opacity:0.3;font-size:12px;';

        container.setAttribute('style', containerStyles);

        container.innerHTML = `<div style='${titleContainerStyles}'>
                <h2 style='${titleStyles}'>${headerTitle}</h2>
                <span style='${versionStyles}'>v${version}</span>
            </div>
            <img src='https://i.ibb.co/nwm3Dxx/rilog-logo.png' href='Rilog'/>`;

        return container;
    }

    private createBody(uToken = '') {
        const container = document.createElement('div');

        const containerStyles = `background:${this.bodyColor};color:#fff;padding:16px 20px;`;
        const tokenContainerStyles = 'display:flex;flex-direction:column;max-width:270px;';
        const inputStyles = `border:1px solid #809194;width:100%;color:${this.inputColor};padding:5px 12px;border-radius:4px;outline:none;box-shadow:none;font-size:14px`;
        const inputContainerStyles = 'position:relative;display:flex;margin-bottom:16px';
        const buttonCopyStyles = 'position: absolute;top:0;right:0;height:100%;border-radius:4px;cursor:pointer;border:1px solid #809194;background:#fff;outline: none;box-shadow:none;';
        const buttonCloseStyles = 'font-size:12px;padding:4px 6px;border-radius:4px;cursor:pointer;border:1px solid #809194;background:#fff;outline: none;box-shadow:none;';
        const labelStyles = 'font-size:12px;margin-bottom:8px';
        const iconStyles = 'margin-right:8px;width:16px;height:16px;';
        const descriptionContainerStyles = 'display:flex;opacity:0.3;';
        const descriptionStyles = 'font-size:12px;color:#F2F8F7;margin:0 0 8px 0;';
        const footerStyles = 'display:flex;justify-content:end;';

        container.setAttribute('style', containerStyles);
        container.innerHTML = `<div style='${tokenContainerStyles}'>
                <label style='${labelStyles}' for='${this.inputId}'>Ваш унікальний токен:</label>
                <div style='${inputContainerStyles}'>
                    <input style='${inputStyles}' readonly name='uToken' id='${this.inputId}' type='text' value='${uToken}' />
                    <button onclick='rilogLibCopyToken()' id='${this.copyButtonId}' style='${buttonCopyStyles}'><img src='https://i.ibb.co/wBxF3GX/rilog-copy-icon.png' alt='copy'></button>
                </div>
                <div style='${descriptionContainerStyles}'><img style='${iconStyles}' src='https://i.ibb.co/3hbsRxB/rilog-icon.png' alt='icon' />
                    <p style='${descriptionStyles}'>Для того щоб логувати дані - додайте зʼєднання в додаток Rilog, використавши цей унікальний токен.</p>
                </div>
            </div>
            <div style='${footerStyles}'>
                <button onclick='rilogLibOnClose()' id='${this.closeButtonId}' style='${buttonCloseStyles}'>Close</button>
            </div>`;

        return container;
    }

    private createScript() {
        const copyScript = document.createElement('script');

        copyScript.innerHTML = `
            function rilogLibCopyToken(){
                const input = document.getElementById("${this.inputId}");
    
                input.select();
                input.setSelectionRange(0, 99999); // For mobile devices
    
                navigator.clipboard.writeText(input.value);
            }
            function rilogLibOnOpen() {
               const panel = document.getElementById("${this.panelId}");
               const openButton = document.getElementById("${this.openButtonId}");
    
               panel.style.display = 'block';
               openButton.style.display = 'none';
            }
            function rilogLibOnClose() {
                const panel = document.getElementById("${this.panelId}");
                const openButton = document.getElementById("${this.openButtonId}");
     
                panel.style.display = 'none';
                openButton.style.display = 'block';
             }`;

        return copyScript;
    }
}

export default InteractivePanel;

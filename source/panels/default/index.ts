import { existsSync, readFileSync } from 'fs-extra';
import { join } from 'path';

interface PanelMountHandle {
    unmount: () => void;
}

interface PanelUiModule {
    mountPanelApp?: (container: HTMLElement) => PanelMountHandle;
}

const panelDataMap = new WeakMap<any, PanelMountHandle>();

const panelUiDir = join(__dirname, '../../panel-ui');
const panelEntryPath = join(panelUiDir, 'index.cjs');
const panelStylePath = join(panelUiDir, 'style.css');

const PANEL_TEMPLATE = `
<div class="mcp-panel-shell">
    <div id="app" class="mcp-panel-app"></div>
</div>
`;

const FALLBACK_STYLE = `
.mcp-panel-shell {
    box-sizing: border-box;
    width: 100%;
    height: 100%;
    padding: 16px;
    background: linear-gradient(165deg, #0b1220, #111827 65%, #172554);
    color: #e2e8f0;
    overflow: auto;
}

.mcp-panel-state {
    border: 1px solid rgba(148, 163, 184, 0.35);
    border-radius: 10px;
    padding: 14px;
    background: rgba(15, 23, 42, 0.65);
    line-height: 1.6;
}

.mcp-panel-state h3 {
    margin: 0 0 8px;
    font-size: 15px;
}

.mcp-panel-state p {
    margin: 6px 0;
    font-size: 13px;
}

.mcp-panel-state code {
    color: #93c5fd;
}
`;

const PANEL_ISOLATION_STYLE = `
:host,
.mcp-panel-shell,
.mcp-panel-app {
    box-sizing: border-box;
    width: 100%;
    height: 100%;
}

.mcp-panel-shell {
    overflow-y: auto;
    overflow-x: hidden;
}

.mcp-panel-shell *,
.mcp-panel-shell *::before,
.mcp-panel-shell *::after {
    box-sizing: border-box;
}
`;

function normalizePanelStyle(rawStyle: string): string {
    // Strong isolation: keep all theme variables inside panel shell.
    return rawStyle
        .replace(/:root/g, '.mcp-panel-shell')
        .replace(/:deep\(([^)]+)\)/g, '$1');
}

function escapeHtml(raw: string): string {
    return raw
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function loadPanelStyle(): string {
    if (existsSync(panelStylePath)) {
        return `${PANEL_ISOLATION_STYLE}\n${normalizePanelStyle(readFileSync(panelStylePath, 'utf-8'))}`;
    }
    return `${PANEL_ISOLATION_STYLE}\n${FALLBACK_STYLE}`;
}

function renderBuildMissing(container: HTMLElement) {
    container.innerHTML = `
        <div class="mcp-panel-state">
            <h3>面板前端尚未构建</h3>
            <p>缺少 <code>dist/panel-ui/index.cjs</code> 或 <code>dist/panel-ui/style.css</code>。</p>
            <p>请先执行 <code>npm run build:panel</code>，然后重新打开面板。</p>
        </div>
    `;
}

function renderRuntimeError(container: HTMLElement, message: string) {
    container.innerHTML = `
        <div class="mcp-panel-state">
            <h3>面板加载失败</h3>
            <p>${escapeHtml(message)}</p>
            <p>请检查构建日志后重新执行 <code>npm run build:panel</code>。</p>
        </div>
    `;
}

module.exports = Editor.Panel.define({
    listeners: {
        show() {
            console.log('[MCP Panel] Panel shown');
        },
        hide() {
            console.log('[MCP Panel] Panel hidden');
        },
    },
    template: PANEL_TEMPLATE,
    style: loadPanelStyle(),
    $: {
        app: '#app',
    },
    ready() {
        const container = this.$.app as HTMLElement | null;
        if (!container) {
            return;
        }

        if (!existsSync(panelEntryPath) || !existsSync(panelStylePath)) {
            renderBuildMissing(container);
            return;
        }

        try {
            const panelUiModule = require(panelEntryPath) as PanelUiModule;
            if (typeof panelUiModule.mountPanelApp !== 'function') {
                throw new Error('未找到 mountPanelApp 导出。');
            }

            const handle = panelUiModule.mountPanelApp(container);
            panelDataMap.set(this, handle);
            console.log('[MCP Panel] Panel UI mounted successfully');
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            console.error('[MCP Panel] Failed to mount panel UI:', error);
            renderRuntimeError(container, message);
        }
    },
    beforeClose() {
        // keep for Cocos panel lifecycle compatibility.
    },
    close() {
        const handle = panelDataMap.get(this);
        if (handle) {
            try {
                handle.unmount();
            } catch (error) {
                console.error('[MCP Panel] Failed to unmount panel UI:', error);
            }
        }
        panelDataMap.delete(this);
    },
});

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs_extra_1 = require("fs-extra");
const path_1 = require("path");
const panelDataMap = new WeakMap();
const panelUiDir = (0, path_1.join)(__dirname, '../../panel-ui');
const panelEntryPath = (0, path_1.join)(panelUiDir, 'index.cjs');
const panelStylePath = (0, path_1.join)(panelUiDir, 'style.css');
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
function normalizePanelStyle(rawStyle) {
    // Strong isolation: keep all theme variables inside panel shell.
    return rawStyle
        .replace(/:root/g, '.mcp-panel-shell')
        .replace(/:deep\(([^)]+)\)/g, '$1');
}
function escapeHtml(raw) {
    return raw
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}
function loadPanelStyle() {
    if ((0, fs_extra_1.existsSync)(panelStylePath)) {
        return `${PANEL_ISOLATION_STYLE}\n${normalizePanelStyle((0, fs_extra_1.readFileSync)(panelStylePath, 'utf-8'))}`;
    }
    return `${PANEL_ISOLATION_STYLE}\n${FALLBACK_STYLE}`;
}
function renderBuildMissing(container) {
    container.innerHTML = `
        <div class="mcp-panel-state">
            <h3>面板前端尚未构建</h3>
            <p>缺少 <code>dist/panel-ui/index.cjs</code> 或 <code>dist/panel-ui/style.css</code>。</p>
            <p>请先执行 <code>npm run build:panel</code>，然后重新打开面板。</p>
        </div>
    `;
}
function renderRuntimeError(container, message) {
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
        const container = this.$.app;
        if (!container) {
            return;
        }
        if (!(0, fs_extra_1.existsSync)(panelEntryPath) || !(0, fs_extra_1.existsSync)(panelStylePath)) {
            renderBuildMissing(container);
            return;
        }
        try {
            const panelUiModule = require(panelEntryPath);
            if (typeof panelUiModule.mountPanelApp !== 'function') {
                throw new Error('未找到 mountPanelApp 导出。');
            }
            const handle = panelUiModule.mountPanelApp(container);
            panelDataMap.set(this, handle);
            console.log('[MCP Panel] Panel UI mounted successfully');
        }
        catch (error) {
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
            }
            catch (error) {
                console.error('[MCP Panel] Failed to unmount panel UI:', error);
            }
        }
        panelDataMap.delete(this);
    },
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zb3VyY2UvcGFuZWxzL2RlZmF1bHQvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSx1Q0FBb0Q7QUFDcEQsK0JBQTRCO0FBVTVCLE1BQU0sWUFBWSxHQUFHLElBQUksT0FBTyxFQUF5QixDQUFDO0FBRTFELE1BQU0sVUFBVSxHQUFHLElBQUEsV0FBSSxFQUFDLFNBQVMsRUFBRSxnQkFBZ0IsQ0FBQyxDQUFDO0FBQ3JELE1BQU0sY0FBYyxHQUFHLElBQUEsV0FBSSxFQUFDLFVBQVUsRUFBRSxXQUFXLENBQUMsQ0FBQztBQUNyRCxNQUFNLGNBQWMsR0FBRyxJQUFBLFdBQUksRUFBQyxVQUFVLEVBQUUsV0FBVyxDQUFDLENBQUM7QUFFckQsTUFBTSxjQUFjLEdBQUc7Ozs7Q0FJdEIsQ0FBQztBQUVGLE1BQU0sY0FBYyxHQUFHOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztDQWdDdEIsQ0FBQztBQUVGLE1BQU0scUJBQXFCLEdBQUc7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Q0FtQjdCLENBQUM7QUFFRixTQUFTLG1CQUFtQixDQUFDLFFBQWdCO0lBQ3pDLGlFQUFpRTtJQUNqRSxPQUFPLFFBQVE7U0FDVixPQUFPLENBQUMsUUFBUSxFQUFFLGtCQUFrQixDQUFDO1NBQ3JDLE9BQU8sQ0FBQyxtQkFBbUIsRUFBRSxJQUFJLENBQUMsQ0FBQztBQUM1QyxDQUFDO0FBRUQsU0FBUyxVQUFVLENBQUMsR0FBVztJQUMzQixPQUFPLEdBQUc7U0FDTCxPQUFPLENBQUMsSUFBSSxFQUFFLE9BQU8sQ0FBQztTQUN0QixPQUFPLENBQUMsSUFBSSxFQUFFLE1BQU0sQ0FBQztTQUNyQixPQUFPLENBQUMsSUFBSSxFQUFFLE1BQU0sQ0FBQztTQUNyQixPQUFPLENBQUMsSUFBSSxFQUFFLFFBQVEsQ0FBQztTQUN2QixPQUFPLENBQUMsSUFBSSxFQUFFLE9BQU8sQ0FBQyxDQUFD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QUNwRSxDQUFDO1FBQ0wsQ0FBQztRQUNELFlBQVksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDOUIsQ0FBQztDQUNKLENBQUMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IGV4aXN0c1N5bmMsIHJlYWRGaWxlU3luYyB9IGZyb20gJ2ZzLWV4dHJhJztcbmltcG9ydCB7IGpvaW4gfSBmcm9tICdwYXRoJztcblxuaW50ZXJmYWNlIFBhbmVsTW91bnRIYW5kbGUge1xuICAgIHVubW91bnQ6ICgpID0+IHZvaWQ7XG59XG5cbmludGVyZmFjZSBQYW5lbFVpTW9kdWxlIHtcbiAgICBtb3VudFBhbmVsQXBwPzogKGNvbnRhaW5lcjogSFRNTEVsZW1lbnQpID0+IFBhbmVsTW91bnRIYW5kbGU7XG59XG5cbmNvbnN0IHBhbmVsRGF0YU1hcCA9IG5ldyBXZWFrTWFwPGFueSwgUGFuZWxNb3VudEhhbmRsZT4oKTtcblxuY29uc3QgcGFuZWxVaURpciA9IGpvaW4oX19kaXJuYW1lLCAnLi4vLi4vcGFuZWwtdWknKTtcbmNvbnN0IHBhbmVsRW50cnlQYXRoID0gam9pbihwYW5lbFVpRGlyLCAnaW5kZXguY2pzJyk7XG5jb25zdCBwYW5lbFN0eWxlUGF0aCA9IGpvaW4ocGFuZWxVaURpciwgJ3N0eWxlLmNzcycpO1xuXG5jb25zdCBQQU5FTF9URU1QTEFURSA9IGBcbjxkaXYgY2xhc3M9XCJtY3AtcGFuZWwtc2hlbGxcIj5cbiAgICA8ZGl2IGlkPVwiYXBwXCIgY2xhc3M9XCJtY3AtcGFuZWwtYXBwXCI+PC9kaXY+XG48L2Rpdj5cbmA7XG5cbmNvbnN0IEZBTExCQUNLX1NUWUxFID0gYFxuLm1jcC1wYW5lbC1zaGVsbCB7XG4gICAgYm94LXNpemluZzogYm9yZGVyLWJveDtcbiAgICB3aWR0aDogMTAwJTtcbiAgICBoZWlnaHQ6IDEwMCU7XG4gICAgcGFkZGluZzogMTZweDtcbiAgICBiYWNrZ3JvdW5kOiBsaW5lYXItZ3JhZGllbnQoMTY1ZGVnLCAjMGIxMjIwLCAjMTExODI3IDY1JSwgIzE3MjU1NCk7XG4gICAgY29sb3I6ICNlMmU4ZjA7XG4gICAgb3ZlcmZsb3c6IGF1dG87XG59XG5cbi5tY3AtcGFuZWwtc3RhdGUge1xuICAgIGJvcmRlcjogMXB4IHNvbGlkIHJnYmEoMTQ4LCAxNjMsIDE4NCwgMC4zNSk7XG4gICAgYm9yZGVyLXJhZGl1czogMTBweDtcbiAgICBwYWRkaW5nOiAxNHB4O1xuICAgIGJhY2tncm91bmQ6IHJnYmEoMTUsIDIzLCA0MiwgMC42NSk7XG4gICAgbGluZS1oZWlnaHQ6IDEuNjtcbn1cblxuLm1jcC1wYW5lbC1zdGF0ZSBoMyB7XG4gICAgbWFyZ2luOiAwIDAgOHB4O1xuICAgIGZvbnQtc2l6ZTogMTVweDtcbn1cblxuLm1jcC1wYW5lbC1zdGF0ZSBwIHtcbiAgICBtYXJnaW46IDZweCAwO1xuICAgIGZvbnQtc2l6ZTogMTNweDtcbn1cblxuLm1jcC1wYW5lbC1zdGF0ZSBjb2RlIHtcbiAgICBjb2xvcjogIzkzYzVmZDtcbn1cbmA7XG5cbmNvbnN0IFBBTkVMX0lTT0xBVElPTl9TVFlMRSA9IGBcbjpob3N0LFxuLm1jcC1wYW5lbC1zaGVsbCxcbi5tY3AtcGFuZWwtYXBwIHtcbiAgICBib3gtc2l6aW5nOiBib3JkZXItYm94O1xuICAgIHdpZHRoOiAxMDAlO1xuICAgIGhlaWdodDogMTAwJTtcbn1cblxuLm1jcC1wYW5lbC1zaGVsbCB7XG4gICAgb3ZlcmZsb3cteTogYXV0bztcbiAgICBvdmVyZmxvdy14OiBoaWRkZW47XG59XG5cbi5tY3AtcGFuZWwtc2hlbGwgKixcbi5tY3AtcGFuZWwtc2hlbGwgKjo6YmVmb3JlLFxuLm1jcC1wYW5lbC1zaGVsbCAqOjphZnRlciB7XG4gICAgYm94LXNpemluZzogYm9yZGVyLWJveDtcbn1cbmA7XG5cbmZ1bmN0aW9uIG5vcm1hbGl6ZVBhbmVsU3R5bGUocmF3U3R5bGU6IHN0cmluZyk6IHN0cmluZyB7XG4gICAgLy8gU3Ryb25nIGlzb2xhdGlvbjoga2VlcCBhbGwgdGhlbWUgdmFyaWFibGVzIGluc2lkZSBwYW5lbCBzaGVsbC5cbiAgICByZXR1cm4gcmF3U3R5bGVcbiAgICAgICAgLnJlcGxhY2UoLzpyb290L2csICcubWNwLXBhbmVsLXNoZWxsJylcbiAgICAgICAgLnJlcGxhY2UoLzpkZWVwXFwoKFteKV0rKVxcKS9nLCAnJDEnKTtcbn1cblxuZnVuY3Rpb24gZXNjYXBlSHRtbChyYXc6IHN0cmluZyk6IHN0cmluZyB7XG4gICAgcmV0dXJuIHJhd1xuICAgICAgICAucmVwbGFjZSgvJi9nLCAnJmFtcDsnKVxuICAgICAgICAucmVwbGFjZSgvPC9nLCAnJmx0OycpXG4gICAgICAgIC5yZXBsYWNlKC8+L2csICcmZ3Q7JylcbiAgICAgICAgLnJlcGxhY2UoL1wiL2csICcmcXVvdDsnKVxuICAgICAgICAucmVwbGFjZSgvJy9nLCAnJiMzOTsnKTtcbn1cblxuZnVuY3Rpb24gbG9hZFBhbmVsU3R5bGUoKTogc3RyaW5nIHtcbiAgICBpZiAoZXhpc3RzU3luYyhwYW5lbFN0eWxlUGF0aCkpIHtcbiAgICAgICAgcmV0dXJuIGAke1BBTkVMX0lTT0xBVElPTl9TVFlMRX1cXG4ke25vcm1hbGl6ZVBhbmVsU3R5bGUocmVhZEZpbGVTeW5jKHBhbmVsU3R5bGVQYXRoLCAndXRmLTgnKSl9YDtcbiAgICB9XG4gICAgcmV0dXJuIGAke1BBTkVMX0lTT0xBVElPTl9TVFlMRX1cXG4ke0ZBTExCQUNLX1NUWUxFfWA7XG59XG5cbmZ1bmN0aW9uIHJlbmRlckJ1aWxkTWlzc2luZyhjb250YWluZXI6IEhUTUxFbGVtZW50KSB7XG4gICAgY29udGFpbmVyLmlubmVySFRNTCA9IGBcbiAgICAgICAgPGRpdiBjbGFzcz1cIm1jcC1wYW5lbC1zdGF0ZVwiPlxuICAgICAgICAgICAgPGgzPumdouadv+WJjeerr+WwmuacquaehOW7ujwvaDM+XG4gICAgICAgICAgICA8cD7nvLrlsJEgPGNvZGU+ZGlzdC9wYW5lbC11aS9pbmRleC5janM8L2NvZGU+IOaIliA8Y29kZT5kaXN0L3BhbmVsLXVpL3N0eWxlLmNzczwvY29kZT7jgII8L3A+XG4gICAgICAgICAgICA8cD7or7flhYjmiafooYwgPGNvZGU+bnBtIHJ1biBidWlsZDpwYW5lbDwvY29kZT7vvIznhLblkI7ph43mlrDmiZPlvIDpnaLmnb/jgII8L3A+XG4gICAgICAgIDwvZGl2PlxuICAgIGA7XG59XG5cbmZ1bmN0aW9uIHJlbmRlclJ1bnRpbWVFcnJvcihjb250YWluZXI6IEhUTUxFbGVtZW50LCBtZXNzYWdlOiBzdHJpbmcpIHtcbiAgICBjb250YWluZXIuaW5uZXJIVE1MID0gYFxuICAgICAgICA8ZGl2IGNsYXNzPVwibWNwLXBhbmVsLXN0YXRlXCI+XG4gICAgICAgICAgICA8aDM+6Z2i5p2/5Yqg6L295aSx6LSlPC9oMz5cbiAgICAgICAgICAgIDxwPiR7ZXNjYXBlSHRtbChtZXNzYWdlKX08L3A+XG4gICAgICAgICAgICA8cD7or7fmo4Dmn6XmnoTlu7rml6Xlv5flkI7ph43mlrDmiafooYwgPGNvZGU+bnBtIHJ1biBidWlsZDpwYW5lbDwvY29kZT7jgII8L3A+XG4gICAgICAgIDwvZGl2PlxuICAgIGA7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gRWRpdG9yLlBhbmVsLmRlZmluZSh7XG4gICAgbGlzdGVuZXJzOiB7XG4gICAgICAgIHNob3coKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygnW01DUCBQYW5lbF0gUGFuZWwgc2hvd24nKTtcbiAgICAgICAgfSxcbiAgICAgICAgaGlkZSgpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdbTUNQIFBhbmVsXSBQYW5lbCBoaWRkZW4nKTtcbiAgICAgICAgfSxcbiAgICB9LFxuICAgIHRlbXBsYXRlOiBQQU5FTF9URU1QTEFURSxcbiAgICBzdHlsZTogbG9hZFBhbmVsU3R5bGUoKSxcbiAgICAkOiB7XG4gICAgICAgIGFwcDogJyNhcHAnLFxuICAgIH0sXG4gICAgcmVhZHkoKSB7XG4gICAgICAgIGNvbnN0IGNvbnRhaW5lciA9IHRoaXMuJC5hcHAgYXMgSFRNTEVsZW1lbnQgfCBudWxsO1xuICAgICAgICBpZiAoIWNvbnRhaW5lcikge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCFleGlzdHNTeW5jKHBhbmVsRW50cnlQYXRoKSB8fCAhZXhpc3RzU3luYyhwYW5lbFN0eWxlUGF0aCkpIHtcbiAgICAgICAgICAgIHJlbmRlckJ1aWxkTWlzc2luZyhjb250YWluZXIpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IHBhbmVsVWlNb2R1bGUgPSByZXF1aXJlKHBhbmVsRW50cnlQYXRoKSBhcyBQYW5lbFVpTW9kdWxlO1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBwYW5lbFVpTW9kdWxlLm1vdW50UGFuZWxBcHAgIT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ+acquaJvuWIsCBtb3VudFBhbmVsQXBwIOWvvOWHuuOAgicpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zdCBoYW5kbGUgPSBwYW5lbFVpTW9kdWxlLm1vdW50UGFuZWxBcHAoY29udGFpbmVyKTtcbiAgICAgICAgICAgIHBhbmVsRGF0YU1hcC5zZXQodGhpcywgaGFuZGxlKTtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdbTUNQIFBhbmVsXSBQYW5lbCBVSSBtb3VudGVkIHN1Y2Nlc3NmdWxseScpO1xuICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgY29uc3QgbWVzc2FnZSA9IGVycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogU3RyaW5nKGVycm9yKTtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ1tNQ1AgUGFuZWxdIEZhaWxlZCB0byBtb3VudCBwYW5lbCBVSTonLCBlcnJvcik7XG4gICAgICAgICAgICByZW5kZXJSdW50aW1lRXJyb3IoY29udGFpbmVyLCBtZXNzYWdlKTtcbiAgICAgICAgfVxuICAgIH0sXG4gICAgYmVmb3JlQ2xvc2UoKSB7XG4gICAgICAgIC8vIGtlZXAgZm9yIENvY29zIHBhbmVsIGxpZmVjeWNsZSBjb21wYXRpYmlsaXR5LlxuICAgIH0sXG4gICAgY2xvc2UoKSB7XG4gICAgICAgIGNvbnN0IGhhbmRsZSA9IHBhbmVsRGF0YU1hcC5nZXQodGhpcyk7XG4gICAgICAgIGlmIChoYW5kbGUpIHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgaGFuZGxlLnVubW91bnQoKTtcbiAgICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcignW01DUCBQYW5lbF0gRmFpbGVkIHRvIHVubW91bnQgcGFuZWwgVUk6JywgZXJyb3IpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHBhbmVsRGF0YU1hcC5kZWxldGUodGhpcyk7XG4gICAgfSxcbn0pO1xuIl19
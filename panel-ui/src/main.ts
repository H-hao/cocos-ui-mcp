import { createApp } from 'vue';
import './styles/tailwind.css';
import './styles/theme.css';
import App from './App.vue';

export interface PanelMountHandle {
    unmount: () => void;
}

export function mountPanelApp(container: HTMLElement): PanelMountHandle {
    const app = createApp(App);
    app.mount(container);

    return {
        unmount: () => {
            app.unmount();
        },
    };
}

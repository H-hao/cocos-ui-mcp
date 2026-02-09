import { readonly, ref } from 'vue';

export type ToastType = 'success' | 'warning' | 'info' | 'error';

export interface ToastItem {
    id: number;
    type: ToastType;
    message: string;
    visible: boolean;
}

const toasts = ref<ToastItem[]>([]);
let toastIdSeed = 0;

function removeToast(id: number): void {
    toasts.value = toasts.value.filter((toast) => toast.id !== id);
}

function pushToast(type: ToastType, message: string, duration = 2200): void {
    const id = ++toastIdSeed;
    const item: ToastItem = {
        id,
        type,
        message,
        visible: false,
    };

    toasts.value = [...toasts.value, item];

    requestAnimationFrame(() => {
        const target = toasts.value.find((toast) => toast.id === id);
        if (target) {
            target.visible = true;
        }
    });

    window.setTimeout(() => {
        const target = toasts.value.find((toast) => toast.id === id);
        if (!target) {
            return;
        }

        target.visible = false;
        window.setTimeout(() => {
            removeToast(id);
        }, 220);
    }, duration);
}

export function useToast() {
    return {
        toasts: readonly(toasts),
        pushToast,
    };
}

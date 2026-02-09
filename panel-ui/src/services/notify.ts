import { useToast, type ToastType } from '../composables/useToast';

function notify(type: ToastType, message: string): void {
    const { pushToast } = useToast();
    pushToast(type, message);
}

export function notifySuccess(message: string): void {
    notify('success', message);
}

export function notifyError(message: string): void {
    notify('error', message);
}

export function notifyWarning(message: string): void {
    notify('warning', message);
}

export function notifyInfo(message: string): void {
    notify('info', message);
}

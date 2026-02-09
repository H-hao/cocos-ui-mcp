<script setup lang="ts">
import { useToast } from '../composables/useToast';

const { toasts } = useToast();
</script>

<template>
    <div class="mcp-toast-host">
        <div
            v-for="toast in toasts"
            :key="toast.id"
            class="mcp-toast"
            :class="[`mcp-toast--${toast.type}`, { 'is-visible': toast.visible }]"
        >
            {{ toast.message }}
        </div>
    </div>
</template>

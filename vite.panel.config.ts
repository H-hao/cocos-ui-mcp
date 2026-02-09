import { resolve } from 'path';
import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vite';
import AutoImport from 'unplugin-auto-import/vite';
import Components from 'unplugin-vue-components/vite';
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers';

export default defineConfig({
    plugins: [
        vue(),
        AutoImport({
            imports: ['vue'],
            resolvers: [ElementPlusResolver({ importStyle: 'css' })],
            dts: resolve(__dirname, 'panel-ui/src/auto-imports.d.ts'),
        }),
        Components({
            resolvers: [ElementPlusResolver({ importStyle: 'css' })],
            dts: resolve(__dirname, 'panel-ui/src/components.d.ts'),
        }),
    ],
    publicDir: false,
    build: {
        outDir: resolve(__dirname, 'dist/panel-ui'),
        emptyOutDir: false,
        cssCodeSplit: false,
        lib: {
            entry: resolve(__dirname, 'panel-ui/src/main.ts'),
            fileName: () => 'index.cjs',
            formats: ['cjs'],
            name: 'CocosMcpPanelUi',
        },
        rollupOptions: {
            output: {
                exports: 'named',
                assetFileNames: (assetInfo) => {
                    const fileName = assetInfo.name || '';
                    if (fileName.endsWith('.css')) {
                        return 'style.css';
                    }
                    return '[name][extname]';
                },
            },
        },
    },
});

import type { Config } from 'tailwindcss';

const config: Config = {
    content: ['./panel-ui/src/**/*.{vue,ts}'],
    corePlugins: {
        preflight: false,
    },
    theme: {
        extend: {
            boxShadow: {
                panel: '0 10px 35px rgba(15, 23, 42, 0.45)',
            },
            borderRadius: {
                panel: '12px',
            },
        },
    },
};

export default config;

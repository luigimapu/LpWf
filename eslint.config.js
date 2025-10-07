import js from '@eslint/js';
import pluginImport from 'eslint-plugin-import';

export default [
    {
        ignores: ['node_modules/**', 'vendor/**', 'out/**', '**/*.min.js'],
    },
    js.configs.recommended,
    {
        languageOptions: {
            globals: {
                window: 'readonly',
                document: 'readonly',
                console: 'readonly',
                alert: 'readonly',
                fetch: 'readonly',
                FormData: 'readonly',
                URLSearchParams: 'readonly',
                clearTimeout: 'readonly',
                setTimeout: 'readonly',
                performance: 'readonly',
                confirm: 'readonly',
                prompt: 'readonly',
                navigator: 'readonly',
                requestAnimationFrame: 'readonly',
                Element: 'readonly',
            },
        },
        plugins: {
            import: pluginImport,
        },
        rules: {
            'import/order': [
                'warn',
                {
                    groups: [
                        ['builtin', 'external', 'internal'],
                        ['parent', 'sibling', 'index'],
                    ],
                    'newlines-between': 'always',
                    alphabetize: { order: 'asc', caseInsensitive: true },
                },
            ],
            'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
            'no-unused-vars': 'off',
            'no-empty': 'off',
        },
    },
];

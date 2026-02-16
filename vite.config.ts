import { defineConfig } from 'vite';
import compression from 'vite-plugin-compression';

export default defineConfig({
    plugins: [
        compression({
            algorithm: 'gzip',
            ext: '.gz',
        }),
    ],
    build: {
        // Optimize chunk size
        chunkSizeWarningLimit: 600,
        rollupOptions: {
            output: {
                manualChunks: {
                    'firebase': ['firebase/app', 'firebase/analytics', 'firebase/auth', 'firebase/firestore'],
                },
            },
        },
        // Minification
        minify: 'terser',
        terserOptions: {
            compress: {
                drop_console: true,
                drop_debugger: true,
            },
        },
    },
    // Optimize dependencies
    optimizeDeps: {
        include: ['firebase/app', 'firebase/analytics', 'firebase/auth', 'firebase/firestore'],
    },
    test: {
        globals: true,
        environment: 'jsdom',
    },
});

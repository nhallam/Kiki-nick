import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

// Single-file build so dist/index.html is fully self-contained and can be
// shared/published as one artifact with no external requests.
export default defineConfig({
	base: './',
	plugins: [react(), viteSingleFile()],
});

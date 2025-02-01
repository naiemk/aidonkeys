import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/node.ts'],
  format: ['cjs'],       // Output CommonJS so that Node runs it without extra flags or file renaming
  bundle: true,
  splitting: false,      // Produce a single output file
  minify: false,
  sourcemap: false,
  outDir: 'dist',
  target: 'node16',      // Adjust to your target Node version (e.g., node14, node18)
  // Force bundling of all external dependencies:
  noExternal: ['@pinata/sdk', 'axios', 'dotenv', 'ethers', 'openai']
});

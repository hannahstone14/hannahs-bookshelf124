
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// Debug the environment mode when config is loaded
console.log('Vite config - Environment mode:', process.env.NODE_ENV);

export default defineConfig(({ mode }) => {
  console.log('Vite config being generated for mode:', mode);
  
  return {
    base: mode === 'development' ? '/' : "/books/", 
    plugins: [
      react(),
      mode === 'development' && componentTagger(),
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    server: {
      port: 8080,
      host: "::"
    },
    // Ensure CSS is included
    css: {
      postcss: './postcss.config.js'
    },
    // Improve build diagnostics
    build: {
      sourcemap: true,
      minify: mode === 'production',
    }
  };
});

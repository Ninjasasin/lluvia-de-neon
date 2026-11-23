import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  // Rutas relativas: el juego funciona tanto en la raíz de un dominio como en una
  // subcarpeta (por ejemplo, GitHub Pages lo sirve en /nombre-del-repositorio/).
  base: './',
  plugins: [react(), tailwindcss()],
  server: { port: 5173 },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
});

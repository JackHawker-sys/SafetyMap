import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    plugins: [react()],
    server: {
      proxy: {
        "/api": {
          target: env.API_PROXY_TARGET || "http:localhost:8080",
          changeOrigin: true,
        },
      },
    },
    build: {
      chunkSizeWarningLimit: 1500,
      rolldownOptions: {
        output: {
          codeSplitting: {
            groups: [
              { name: 'maplibre', test: /node_modules[\\/]maplibre-gl/ },
              {
                name: 'leaflet',
                test: /node_modules[\\/](leaflet|react-leaflet|@react-leaflet|@maplibre[\\/]maplibre-gl-leaflet)/,
              },
              { name: 'vendor', test: /node_modules/ },
            ],
          },
        },
      },
    },
  };
})
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { layerCake } from "@layer-cake/vite-plugin";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), layerCake()],
});

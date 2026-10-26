// vite.config.mts
import { defineConfig } from "file:///D:/03.Dev/01.Project/07.Zalo%20Mini%20App/tiqn_portal/tiqn-portal/node_modules/vite/dist/node/index.js";
import zaloMiniApp from "file:///D:/03.Dev/01.Project/07.Zalo%20Mini%20App/tiqn_portal/tiqn-portal/node_modules/zmp-vite-plugin/dist/index.mjs";
import react from "file:///D:/03.Dev/01.Project/07.Zalo%20Mini%20App/tiqn_portal/tiqn-portal/node_modules/@vitejs/plugin-react/dist/index.js";
var vite_config_default = () => {
  return defineConfig({
    root: "./src",
    base: "",
    plugins: [zaloMiniApp(), react()],
    build: {
      assetsInlineLimit: 0
    },
    resolve: {
      alias: {
        "@": "/src"
      }
    }
  });
};
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcubXRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiZDpcXFxcMDMuRGV2XFxcXDAxLlByb2plY3RcXFxcMDcuWmFsbyBNaW5pIEFwcFxcXFx0aXFuX3BvcnRhbFxcXFx0aXFuLXBvcnRhbFwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiZDpcXFxcMDMuRGV2XFxcXDAxLlByb2plY3RcXFxcMDcuWmFsbyBNaW5pIEFwcFxcXFx0aXFuX3BvcnRhbFxcXFx0aXFuLXBvcnRhbFxcXFx2aXRlLmNvbmZpZy5tdHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL2Q6LzAzLkRldi8wMS5Qcm9qZWN0LzA3LlphbG8lMjBNaW5pJTIwQXBwL3RpcW5fcG9ydGFsL3RpcW4tcG9ydGFsL3ZpdGUuY29uZmlnLm10c1wiO2ltcG9ydCB7IGRlZmluZUNvbmZpZyB9IGZyb20gXCJ2aXRlXCI7XG5pbXBvcnQgemFsb01pbmlBcHAgZnJvbSBcInptcC12aXRlLXBsdWdpblwiO1xuaW1wb3J0IHJlYWN0IGZyb20gXCJAdml0ZWpzL3BsdWdpbi1yZWFjdFwiO1xuXG4vLyBodHRwczovL3ZpdGVqcy5kZXYvY29uZmlnL1xuZXhwb3J0IGRlZmF1bHQgKCkgPT4ge1xuICByZXR1cm4gZGVmaW5lQ29uZmlnKHtcbiAgICByb290OiBcIi4vc3JjXCIsXG4gICAgYmFzZTogXCJcIixcbiAgICBwbHVnaW5zOiBbemFsb01pbmlBcHAoKSwgcmVhY3QoKV0sXG4gICAgYnVpbGQ6IHtcbiAgICAgIGFzc2V0c0lubGluZUxpbWl0OiAwLFxuICAgIH0sXG4gICAgcmVzb2x2ZToge1xuICAgICAgYWxpYXM6IHtcbiAgICAgICAgXCJAXCI6IFwiL3NyY1wiLFxuICAgICAgfSxcbiAgICB9LFxuICB9KTtcbn07XG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQTJYLFNBQVMsb0JBQW9CO0FBQ3haLE9BQU8saUJBQWlCO0FBQ3hCLE9BQU8sV0FBVztBQUdsQixJQUFPLHNCQUFRLE1BQU07QUFDbkIsU0FBTyxhQUFhO0FBQUEsSUFDbEIsTUFBTTtBQUFBLElBQ04sTUFBTTtBQUFBLElBQ04sU0FBUyxDQUFDLFlBQVksR0FBRyxNQUFNLENBQUM7QUFBQSxJQUNoQyxPQUFPO0FBQUEsTUFDTCxtQkFBbUI7QUFBQSxJQUNyQjtBQUFBLElBQ0EsU0FBUztBQUFBLE1BQ1AsT0FBTztBQUFBLFFBQ0wsS0FBSztBQUFBLE1BQ1A7QUFBQSxJQUNGO0FBQUEsRUFDRixDQUFDO0FBQ0g7IiwKICAibmFtZXMiOiBbXQp9Cg==

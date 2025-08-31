import { defineConfig } from "vite";
import laravel from "laravel-vite-plugin";
import react from "@vitejs/plugin-react";
import os from "os";

function getLocalIp() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const net of interfaces[name]) {
            if (net.family === "IPv4" && !net.internal) {
                return net.address;
            }
        }
    }
    return "127.0.0.1";
}

const localIp = getLocalIp();

export default defineConfig({
    server: {
        host: "0.0.0.0", // biar bisa diakses semua device di jaringan
        port: 5173,
        cors: true,
        hmr: {
            host: localIp, // otomatis IP laptop kamu
        },
    },
    plugins: [
        laravel({
            input: "resources/js/app.jsx",
            refresh: true,
        }),
        react(),
    ],
});

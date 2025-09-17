// import { defineConfig } from "vite";
// import laravel from "laravel-vite-plugin";
// import react from "@vitejs/plugin-react";
// import fs from "fs";

// // Langsung tentukan IP lokal Anda di sini
// const host = "192.168.1.89";

// export default defineConfig({
//     plugins: [
//         laravel({
//             input: "resources/js/app.jsx",
//             refresh: true,
//         }),
//         react(),
//     ],
//     server: {
//         host, // Mengizinkan akses dari jaringan
//         hmr: { host }, // Hot Module Replacement menggunakan IP yang sama
//         https: { // Mengaktifkan HTTPS
//             key: fs.readFileSync(`${host}-key.pem`),
//             cert: fs.readFileSync(`${host}.pem`),
//         },
//     },
// });

//-----------------------------------
import { defineConfig } from "vite";
import laravel from "laravel-vite-plugin";
import react from "@vitejs/plugin-react";
import os from "os";
import fs from "fs";

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
const host = "192.168.1.89";

export default defineConfig({
    server: {
        host: "0.0.0.0", // biar bisa diakses semua device di jaringan
        port: 5173,
        cors: true,
        hmr: {
            host: localIp, // otomatis IP laptop kamu
        },
        host, // <-- Gunakan IP yang sudah didefinisikan
        hmr: { host },
        https: {
            // <-- 3. Tambahkan konfigurasi HTTPS
            key: fs.readFileSync(`${host}-key.pem`),
            cert: fs.readFileSync(`${host}.pem`),
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
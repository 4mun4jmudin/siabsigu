REM 1) matikan Vite dev kalau ada & hapus hot
Ctrl + C
if exist public\hot del public\hot

REM 2) build asset produksi
npm install
npm run build

REM 3) clear cache & serve ke semua interface
php artisan config:clear
php artisan serve --host=0.0.0.0 --port=8000

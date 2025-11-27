#!/usr/bin/env node

/**
 * Simple HTTP Server for Tetris Game
 * Запуск: node server.js
 * Доступ: http://localhost:8000
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 8000;
const HOSTNAME = 'localhost';

// MIME типы
const mimeTypes = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject'
};

const server = http.createServer((req, res) => {
  // Логирование запроса
  console.log(`[${new Date().toLocaleString('ru-RU')}] ${req.method} ${req.url}`);

  // Парсим URL
  const parsedUrl = url.parse(req.url, true);
  let pathname = `.${parsedUrl.pathname}`;

  // Если это главная страница - открываем index.html
  if (pathname === './' || pathname === '.') {
    pathname = './index.html';
  }

  // Получаем расширение файла
  const ext = path.parse(pathname).ext;

  // Проверяем если файл существует
  fs.readFile(pathname, (err, data) => {
    if (err) {
      if (err.code === 'ENOENT') {
        // Файл не найден - пробуем index.html для маршрутизации SPA
        fs.readFile('./index.html', (err, data) => {
          if (err) {
            res.statusCode = 404;
            res.setHeader('Content-Type', 'text/plain');
            res.end('404 - File Not Found\n');
            console.log(`❌ 404 ${pathname}`);
          } else {
            res.statusCode = 200;
            res.setHeader('Content-Type', mimeTypes['.html'] || 'text/html');
            res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
            res.end(data);
            console.log(`✅ 200 ${pathname} (index.html)`);
          }
        });
      } else {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'text/plain');
        res.end(`500 - Server Error\n`);
        console.log(`❌ 500 ${pathname}`);
      }
    } else {
      // Файл найден
      res.statusCode = 200;
      const contentType = mimeTypes[ext] || 'text/plain';
      res.setHeader('Content-Type', contentType);
      
      // Установлены заголовки для предотвращения кэширования
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      
      // CORS headers
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
      
      res.end(data);
      console.log(`✅ 200 ${pathname}`);
    }
  });
});

server.listen(PORT, HOSTNAME, () => {
  const url = `http://${HOSTNAME}:${PORT}`;
  console.log('='.repeat(60));
  console.log('🎮  Tetris Multiplayer Game Server');
  console.log('='.repeat(60));
  console.log(`✅ Сервер запущен на: ${url}`);
  console.log(`📁 Папка: ${process.cwd()}`);
  console.log(`🌐 Откройте браузер и перейдите на: ${url}`);
  console.log('='.repeat(60));
  console.log('📝 Логирование запросов включено');
  console.log('🛑 Нажмите Ctrl+C для остановки сервера');
  console.log('='.repeat(60));
});

// Обработка сигналов для корректного завершения
process.on('SIGINT', () => {
  console.log('\n🛑 Сервер остановлен');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Сервер остановлен');
  process.exit(0);
});

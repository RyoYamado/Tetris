#!/usr/bin/env python
"""
Simple HTTP Server for Tetris Game
Запуск: python server.py
Доступ: http://localhost:8000
"""

import http.server
import socketserver
import os
import sys
import webbrowser

# Порт для сервера
PORT = 8000

# Меняем директорию на папку с приложением
os.chdir(os.path.dirname(os.path.abspath(__file__)))

class MyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Добавляем заголовки для CORS и кэширования
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        self.send_header('Access-Control-Allow-Origin', '*')
        super().end_headers()
    
    def log_message(self, format, *args):
        # Красивый вывод логов
        print(f"[{self.log_date_time_string()}] {format % args}")

def run_server():
    """Запуск HTTP сервера"""
    with socketserver.TCPServer(("", PORT), MyHTTPRequestHandler) as httpd:
        url = f"http://localhost:{PORT}"
        print("=" * 60)
        print(f"🎮 Tetris Multiplayer Game Server")
        print("=" * 60)
        print(f"✅ Сервер запущен на: {url}")
        print(f"📁 Папка: {os.getcwd()}")
        print(f"🌐 Откройте браузер и перейдите на: {url}")
        print("=" * 60)
        print("Нажмите Ctrl+C для остановки сервера")
        print("=" * 60)
        
        # Пытаемся открыть браузер автоматически
        try:
            webbrowser.open(url)
            print(f"🌐 Браузер открыт автоматически...")
        except:
            print(f"⚠️  Браузер не открылся автоматически, откройте вручную")
        
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n🛑 Сервер остановлен")
            sys.exit(0)

if __name__ == "__main__":
    run_server()

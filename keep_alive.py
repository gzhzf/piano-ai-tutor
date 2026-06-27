"""
保活脚本 - 每10分钟访问一次网站，防止Render免费版休眠
在本地电脑或服务器上运行：python3 keep_alive.py
"""
import requests, time, sys

URL = "https://piano-ai-tutor.onrender.com/"
INTERVAL = 600  # 10分钟

print(f"保活脚本启动 - 每{INTERVAL//60}分钟访问 {URL}")
print("按Ctrl+C停止\n")

count = 0
while True:
    try:
        r = requests.get(URL, timeout=60)
        count += 1
        print(f"[{time.strftime('%H:%M:%S')}] 第{count}次访问: HTTP {r.status_code} ({r.elapsed.total_seconds():.1f}s)")
    except Exception as e:
        print(f"[{time.strftime('%H:%M:%S')}] 第{count}次访问失败: {e}")
    time.sleep(INTERVAL)

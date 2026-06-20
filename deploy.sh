#!/bin/bash
# ============================================
# 琴乐启蒙AI导师 - 腾讯云一键部署脚本
# 在轻量应用服务器上运行此脚本即可完成部署
# ============================================
set -e

echo "================================================"
echo "🎹 琴乐启蒙AI导师 - 腾讯云部署脚本"
echo "================================================"

# 1. 安装系统依赖
echo "[1/8] 安装系统依赖..."
apt-get update -qq
apt-get install -y -qq python3 python3-pip python3-venv git nginx > /dev/null 2>&1
echo "  ✓ 系统依赖安装完成"

# 2. 创建项目目录
echo "[2/8] 创建项目目录..."
mkdir -p /opt/piano-ai
cd /opt/piano-ai
echo "  ✓ 目录创建完成: /opt/piano-ai"

# 3. 克隆GitHub仓库
echo "[3/8] 克隆代码仓库..."
if [ -d ".git" ]; then
    git pull origin main 2>/dev/null || true
else
    git clone https://github.com/gzhzf/piano-ai-tutor.git .
fi
echo "  ✓ 代码拉取完成"

# 4. 创建Python虚拟环境
echo "[4/8] 创建Python虚拟环境..."
python3 -m venv venv
source venv/bin/activate
echo "  ✓ 虚拟环境创建完成"

# 5. 安装Python依赖
echo "[5/8] 安装Python依赖..."
pip install --upgrade pip -q
pip install -r requirements.txt -q
echo "  ✓ Python依赖安装完成"

# 6. 配置Gunicorn系统服务
echo "[6/8] 配置系统服务..."
cat > /etc/systemd/system/piano-ai.service << 'EOF'
[Unit]
Description=Piano AI Tutor - Flask Application
After=network.target

[Service]
User=root
WorkingDirectory=/opt/piano-ai
Environment="PATH=/opt/piano-ai/venv/bin"
ExecStart=/opt/piano-ai/venv/bin/gunicorn app:app --bind 0.0.0.0:5000 --workers 2 --timeout 120
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable piano-ai
systemctl restart piano-ai
echo "  ✓ 系统服务配置完成 (开机自启已开启)"

# 7. 配置Nginx反向代理
echo "[7/8] 配置Nginx反向代理..."
cat > /etc/nginx/sites-available/piano-ai << 'EOF'
server {
    listen 80;
    server_name _;
    
    client_max_body_size 20M;
    
    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 120s;
    }
    
    location /static/ {
        alias /opt/piano-ai/static/;
        expires 30d;
    }
}
EOF

ln -sf /etc/nginx/sites-available/piano-ai /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t 2>/dev/null
systemctl restart nginx
systemctl enable nginx
echo "  ✓ Nginx配置完成"

# 8. 开放防火墙端口
echo "[8/8] 检查防火墙..."
if command -v ufw &> /dev/null; then
    ufw allow 80/tcp 2>/dev/null || true
    ufw allow 443/tcp 2>/dev/null || true
    ufw allow 22/tcp 2>/dev/null || true
    echo "  ✓ 防火墙端口已开放"
else
    echo "  ℹ 未检测到ufw防火墙，请在腾讯云控制台安全组中开放80端口"
fi

# 完成
echo ""
echo "================================================"
echo "🎉 部署完成！"
echo "================================================"
echo ""
echo "📱 访问地址: http://$(curl -s ifconfig.me 2>/dev/null || echo '你的服务器公网IP')"
echo ""
echo "常用命令:"
echo "  查看服务状态: systemctl status piano-ai"
echo "  重启服务:     systemctl restart piano-ai"
echo "  查看日志:     journalctl -u piano-ai -f"
echo "  重启Nginx:    systemctl restart nginx"
echo ""
echo "⚠  请在腾讯云控制台 -> 防火墙规则中，"
echo "   添加规则开放 TCP 80 端口（HTTP）"
echo "================================================"

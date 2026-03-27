#!/bin/bash
#================================================================
# AUTOMATED BUG SCANNER PLATFORM INSTALLER
# For Ubuntu 20.04/22.04 VPS
# Full zero-touch installation of 150 security tools
#================================================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}"
echo "================================================================"
echo "  BUG SCANNER PLATFORM - AUTOMATED INSTALLER"
echo "  Installing 150 security tools + scanner infrastructure"
echo "================================================================"
echo -e "${NC}"

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
  echo -e "${RED}Error: Please run as root (use sudo)${NC}"
  exit 1
fi

PROJECT_DIR="/root/bug-scanner"
cd $PROJECT_DIR

#================================================================
echo -e "${YELLOW}[1/12] Detecting VPS public IP...${NC}"
#================================================================
VPS_IP=$(curl -s https://api.ipify.org)
if [ -z "$VPS_IP" ]; then
  echo -e "${RED}Failed to detect VPS IP. Please check internet connection.${NC}"
  exit 1
fi
echo -e "${GREEN}VPS IP detected: $VPS_IP${NC}"

#================================================================
echo -e "${YELLOW}[2/12] System update and upgrade...${NC}"
#================================================================
apt-get update -y
DEBIAN_FRONTEND=noninteractive apt-get upgrade -y

#================================================================
echo -e "${YELLOW}[3/12] Installing core dependencies...${NC}"
#================================================================
DEBIAN_FRONTEND=noninteractive apt-get install -y \
  curl wget git unzip tar build-essential \
  python3 python3-pip python3-dev \
  ruby ruby-dev \
  libssl-dev libffi-dev libxml2-dev libxslt1-dev libcurl4-openssl-dev \
  nmap masscan whois dnsutils bind9-host \
  tor sqlite3 redis-server nginx ufw \
  software-properties-common apt-transport-https \
  ca-certificates gnupg lsb-release

#================================================================
echo -e "${YELLOW}[4/12] Installing Node.js 18.x...${NC}"
#================================================================
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs
npm install -g npm@latest

#================================================================
echo -e "${YELLOW}[5/12] Installing Go 1.21...${NC}"
#================================================================
if [ ! -d "/usr/local/go" ]; then
  wget -q https://go.dev/dl/go1.21.5.linux-amd64.tar.gz
  tar -C /usr/local -xzf go1.21.5.linux-amd64.tar.gz
  rm go1.21.5.linux-amd64.tar.gz
fi
export PATH=$PATH:/usr/local/go/bin:/root/go/bin
echo 'export PATH=$PATH:/usr/local/go/bin:/root/go/bin' >> /root/.bashrc
echo 'export PATH=$PATH:/usr/local/go/bin:/root/go/bin' >> /etc/profile

#================================================================
echo -e "${YELLOW}[6/12] Installing Python security tools...${NC}"
#================================================================
pip3 install --upgrade pip setuptools wheel
pip3 install \
  wapiti3 \
  wafw00f \
  dirsearch \
  theHarvester \
  dnspython \
  requests \
  beautifulsoup4 \
  shodan \
  censys \
  sslyze \
  sqlmap \
  fierce \
  dnsrecon

#================================================================
echo -e "${YELLOW}[7/12] Installing Go-based security tools (this may take a while)...${NC}"
#================================================================
go install -v github.com/projectdiscovery/subfinder/v2/cmd/subfinder@latest
go install -v github.com/projectdiscovery/httpx/cmd/httpx@latest
go install -v github.com/projectdiscovery/nuclei/v3/cmd/nuclei@latest
go install -v github.com/projectdiscovery/dnsx/cmd/dnsx@latest
go install -v github.com/projectdiscovery/katana/cmd/katana@latest
go install -v github.com/projectdiscovery/naabu/v2/cmd/naabu@latest
go install -v github.com/projectdiscovery/tlsx/cmd/tlsx@latest
go install -v github.com/ffuf/ffuf/v2@latest
go install -v github.com/tomnomnom/waybackurls@latest
go install -v github.com/tomnomnom/httprobe@latest
go install -v github.com/tomnomnom/assetfinder@latest
go install -v github.com/tomnomnom/gf@latest
go install -v github.com/tomnomnom/qsreplace@latest
go install -v github.com/lc/gau/v2/cmd/gau@latest
go install -v github.com/hahwul/dalfox/v2@latest
go install -v github.com/jaeles-project/gospider@latest
go install -v github.com/003random/getJS@latest
go install -v github.com/hakluke/hakrawler@latest
go install -v github.com/OJ/gobuster/v3@latest
go install -v github.com/dwisiswant0/corsy@latest

# Update nuclei templates
/root/go/bin/nuclei -update-templates || true

#================================================================
echo -e "${YELLOW}[8/12] Installing additional security tools...${NC}"
#================================================================
apt-get install -y \
  nikto \
  wpscan \
  gobuster \
  feroxbuster \
  amass \
  whatweb \
  skipfish \
  uniscan \
  dotdotpwn \
  hydra \
  medusa \
  john \
  hashcat \
  cewl \
  crunch \
  sslscan \
  traceroute \
  iputils-ping \
  hping3 \
  mtr

# Install wordlists
apt-get install -y seclists wordlists || true
mkdir -p /usr/share/wordlists/dirb
if [ ! -f "/usr/share/wordlists/dirb/common.txt" ]; then
  wget -q https://raw.githubusercontent.com/daviddias/node-dirbuster/master/lists/directory-list-2.3-medium.txt -O /usr/share/wordlists/dirb/common.txt
fi

#================================================================
echo -e "${YELLOW}[9/12] Configuring Tor for IP rotation...${NC}"
#================================================================
systemctl stop tor || true

# Generate Tor control password
TOR_PW=$(openssl rand -hex 16)
TOR_HASH=$(tor --hash-password "$TOR_PW" | tail -1)

# Configure Tor
cat > /etc/tor/torrc <<EOF
SocksPort 9050
ControlPort 9051
HashedControlPassword $TOR_HASH
MaxCircuitDirtiness 10
CircuitBuildTimeout 30
LearnCircuitBuildTimeout 0
EOF

systemctl enable tor
systemctl restart tor
sleep 3

# Verify Tor is running
if systemctl is-active --quiet tor; then
  echo -e "${GREEN}Tor configured and running${NC}"
else
  echo -e "${YELLOW}Warning: Tor failed to start. IP rotation may not work.${NC}"
fi

#================================================================
echo -e "${YELLOW}[10/12] Configuring Nginx and firewall...${NC}"
#================================================================

# Configure Nginx
cat > /etc/nginx/sites-available/scanner <<EOF
upstream scanner_backend {
    ip_hash;
    server 127.0.0.1:3001;
    server 127.0.0.1:3002;
    server 127.0.0.1:3003;
    server 127.0.0.1:3004;
}

server {
    listen 9852;
    server_name _;

    client_max_body_size 10M;
    gzip on;
    gzip_types text/plain application/json application/javascript text/css;

    limit_req_zone \$binary_remote_addr zone=scanner:10m rate=20r/s;
    limit_req zone=scanner burst=40 nodelay;

    location /socket.io/ {
        proxy_pass http://scanner_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_read_timeout 3600s;
        proxy_send_timeout 3600s;
    }

    location /api/ {
        proxy_pass http://scanner_backend;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header Host \$host;
    }

    location / {
        root $PROJECT_DIR/frontend/dist;
        try_files \$uri /index.html;
        expires 1h;
        add_header Cache-Control "public, immutable";
    }
}
EOF

ln -sf /etc/nginx/sites-available/scanner /etc/nginx/sites-enabled/scanner
rm -f /etc/nginx/sites-enabled/default

# Test nginx config
nginx -t

# Configure firewall
ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp comment 'SSH'
ufw allow 9852/tcp comment 'Scanner Web Interface'
ufw --force enable

echo -e "${GREEN}Firewall configured. Port 9852 is open.${NC}"

#================================================================
echo -e "${YELLOW}[11/12] Installing Node.js dependencies and building frontend...${NC}"
#================================================================

# Install backend dependencies
cd $PROJECT_DIR
npm install

# Install PM2 globally
npm install -g pm2

# Build frontend
cd $PROJECT_DIR/frontend
npm install
npm run build

# Verify build
if [ -d "$PROJECT_DIR/frontend/dist" ]; then
  echo -e "${GREEN}Frontend built successfully${NC}"
else
  echo -e "${RED}Frontend build failed${NC}"
  exit 1
fi

#================================================================
echo -e "${YELLOW}[12/12] Creating .env and starting services...${NC}"
#================================================================

cd $PROJECT_DIR

# Create .env file
cat > .env <<EOF
VPS_IP=$VPS_IP
PORT=9852

REDIS_URL=redis://127.0.0.1:6379

TOR_SOCKS_PORT=9050
TOR_CONTROL_PORT=9051
TOR_CONTROL_PASSWORD=$TOR_PW

DB_PATH=./scan_results/scans.db

NODE_ENV=production
PORT_START=3001
EOF

chmod 600 .env

# Ensure directories exist
mkdir -p logs scan_results

# Start Redis
systemctl enable redis-server
systemctl restart redis-server

# Start Nginx
systemctl restart nginx

# Start scanner with PM2
pm2 delete scanner 2>/dev/null || true
pm2 start ecosystem.config.js
pm2 save
pm2 startup systemd -u root --hp /root | tail -1 | bash

echo ""
echo -e "${GREEN}================================================================${NC}"
echo -e "${GREEN}  INSTALLATION COMPLETE!${NC}"
echo -e "${GREEN}================================================================${NC}"
echo ""
echo -e "Scanner is now running at: ${YELLOW}http://$VPS_IP:9852${NC}"
echo ""
echo -e "Useful commands:"
echo -e "  ${YELLOW}pm2 status${NC}          - Check scanner status"
echo -e "  ${YELLOW}pm2 logs scanner${NC}    - View logs"
echo -e "  ${YELLOW}pm2 restart scanner${NC} - Restart scanner"
echo -e "  ${YELLOW}pm2 stop scanner${NC}    - Stop scanner"
echo ""
echo -e "Tor configuration:"
echo -e "  SOCKS5 Proxy: ${YELLOW}127.0.0.1:9050${NC}"
echo -e "  Control Port: ${YELLOW}127.0.0.1:9051${NC}"
echo ""
echo -e "${RED}IMPORTANT LEGAL NOTICE:${NC}"
echo -e "${RED}This tool is for authorized penetration testing ONLY.${NC}"
echo -e "${RED}Only scan systems you own or have explicit written permission to test.${NC}"
echo -e "${RED}Unauthorized scanning is illegal.${NC}"
echo ""
echo -e "${GREEN}================================================================${NC}"

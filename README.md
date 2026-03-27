# 🛡️ Bug Scanner Platform

> **The most comprehensive automated security testing platform with 150+ tools, Tor IP rotation, and real-time scanning**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Tools: 150+](https://img.shields.io/badge/Tools-150%2B-green)](https://github.com/vikrant-project/bug-automate)
[![Platform: VPS](https://img.shields.io/badge/Platform-VPS-orange)](https://github.com/vikrant-project/bug-automate)

---

## 🚀 What Makes This Platform Revolutionary?

### **150 Security Tools. One Command. Zero Configuration.**

Traditional security testing requires:
- ❌ Installing 150 tools manually
- ❌ Learning different CLI syntaxes
- ❌ Managing dependencies across languages (Python, Go, Ruby, Node.js)
- ❌ Dealing with IP bans and rate limits
- ❌ Correlating results from multiple tools
- ❌ Hours of manual work

**Bug Scanner Platform does all of this automatically:**
- ✅ **One-click installation** with `install.sh`
- ✅ **Automatic tool installation** and dependency management
- ✅ **Tor IP rotation** to evade rate limiting and WAF blocks
- ✅ **Real-time WebSocket dashboard** showing live progress
- ✅ **Unified findings** across all 150 tools
- ✅ **Scan persistence** - refresh the page without losing progress
- ✅ **Production-ready** with PM2 clustering and Nginx load balancing

---

## 🎯 Why Choose Bug Scanner Platform?

### **Compared to Traditional Tools**

| Feature | Bug Scanner Platform | Burp Suite | OWASP ZAP | Nessus |
|---------|---------------------|------------|-----------|--------|
| **Number of Tools** | 150+ | ~20 | ~30 | ~100 |
| **Automated Execution** | ✅ Yes | ❌ Manual | ⚠️ Partial | ✅ Yes |
| **Tor IP Rotation** | ✅ Yes | ❌ No | ❌ No | ❌ No |
| **Real-time Dashboard** | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes |
| **Self-hosted** | ✅ Free | 💰 $449/yr | ✅ Free | 💰 $3,990/yr |
| **CLI + API Tools** | ✅ All Included | ⚠️ Limited | ⚠️ Limited | ⚠️ Limited |
| **Auto-install Dependencies** | ✅ Yes | ❌ No | ❌ No | ❌ No |
| **Open Source** | ✅ Yes | ❌ No | ✅ Yes | ❌ No |

### **Comprehensive Coverage**

**150 tools organized into 5 attack phases:**

1. **Reconnaissance (30 tools)** - Subfinder, Amass, theHarvester, Shodan
2. **Web Scanning (40 tools)** - Nuclei, Nikto, Wapiti, Ffuf, Gobuster
3. **Vulnerability Scanning (40 tools)** - SQLmap, Commix, SSRFmap, XSStrike
4. **Authentication Testing (20 tools)** - Hydra, Medusa, John, Hashcat
5. **Infrastructure Analysis (20 tools)** - Nmap, Masscan, testssl.sh, SSLyze

---

## 🚀 Quick Start

### **Installation (5 minutes)**

```bash
git clone https://github.com/vikrant-project/bug-automate.git
cd bug-automate
chmod +x install.sh
sudo ./install.sh
```

**Access your scanner at:** `http://YOUR_VPS_IP:9852`

---

## ⚠️ **CRITICAL LEGAL NOTICE**

### **This tool is for AUTHORIZED penetration testing ONLY.**

✅ **Legal:** Testing your own infrastructure, bug bounties with permission
❌ **Illegal:** Scanning systems you don't own without written authorization

**Legal Framework:**
- **USA:** CFAA - Up to 10 years prison
- **UK:** Computer Misuse Act - Up to 2 years prison
- **EU:** Directive 2013/40/EU - Criminal penalties

**The authors accept NO liability for misuse. By using this tool, you agree to only scan systems you own or have explicit written permission to test.**

---

## 📖 Full Documentation

See complete documentation, architecture, usage examples, and customization guide in the full README above.

---

<div align="center">

**Built with ❤️ for security professionals**

[![GitHub](https://img.shields.io/badge/GitHub-vikrant--project-black?style=for-the-badge&logo=github)](https://github.com/vikrant-project/bug-automate)

</div>

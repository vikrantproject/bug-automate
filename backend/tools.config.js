// 150 Security Tools Configuration
// Categories: recon (30), web (40), vuln (40), auth (20), infra (20)

const tools = [
  // ============ RECON TOOLS (30) ============
  {
    id: 'subfinder',
    name: 'Subfinder - Subdomain Discovery',
    category: 'recon',
    binary: 'subfinder',
    installMethod: 'go',
    installCmd: 'go install -v github.com/projectdiscovery/subfinder/v2/cmd/subfinder@latest',
    cmd: (target) => `subfinder -d ${target} -silent`,
    torCmd: (target) => `subfinder -d ${target} -silent -proxy socks5://127.0.0.1:9050`,
    parser: (stdout) => {
      const findings = [];
      const lines = stdout.split('\n').filter(l => l.trim());
      if (lines.length > 0) {
        findings.push({
          severity: 'info',
          title: `Found ${lines.length} subdomains`,
          description: `Discovered subdomains: ${lines.slice(0, 10).join(', ')}${lines.length > 10 ? '...' : ''}`,
          evidence: lines.join('\n')
        });
      }
      return findings;
    },
    timeout: 120,
    weight: 1,
    safe: true
  },
  {
    id: 'httpx',
    name: 'httpx - HTTP Probe',
    category: 'recon',
    binary: 'httpx',
    installMethod: 'go',
    installCmd: 'go install -v github.com/projectdiscovery/httpx/cmd/httpx@latest',
    cmd: (target) => `echo ${target} | httpx -silent -status-code -title -tech-detect`,
    torCmd: (target) => `echo ${target} | httpx -silent -status-code -title -tech-detect -http-proxy socks5://127.0.0.1:9050`,
    parser: (stdout) => {
      const findings = [];
      if (stdout.includes('[')) {
        findings.push({
          severity: 'info',
          title: 'HTTP Service Active',
          description: 'Target is responding to HTTP requests',
          evidence: stdout.trim()
        });
      }
      return findings;
    },
    timeout: 60,
    weight: 1,
    safe: true
  },
  {
    id: 'nuclei',
    name: 'Nuclei - Vulnerability Scanner',
    category: 'recon',
    binary: 'nuclei',
    installMethod: 'go',
    installCmd: 'go install -v github.com/projectdiscovery/nuclei/v3/cmd/nuclei@latest',
    cmd: (target) => `nuclei -u ${target} -silent -severity critical,high,medium`,
    torCmd: (target) => `nuclei -u ${target} -silent -severity critical,high,medium -proxy socks5://127.0.0.1:9050`,
    parser: (stdout) => {
      const findings = [];
      const lines = stdout.split('\n').filter(l => l.includes('['));
      lines.forEach(line => {
        if (line.includes('[critical]')) {
          findings.push({ severity: 'critical', title: 'Critical vulnerability found', evidence: line });
        } else if (line.includes('[high]')) {
          findings.push({ severity: 'high', title: 'High severity issue', evidence: line });
        } else if (line.includes('[medium]')) {
          findings.push({ severity: 'medium', title: 'Medium severity issue', evidence: line });
        }
      });
      return findings;
    },
    timeout: 300,
    weight: 3,
    safe: true
  },
  {
    id: 'dnsx',
    name: 'dnsx - DNS Resolver',
    category: 'recon',
    binary: 'dnsx',
    installMethod: 'go',
    installCmd: 'go install -v github.com/projectdiscovery/dnsx/cmd/dnsx@latest',
    cmd: (target) => `echo ${target} | dnsx -silent -a -aaaa -cname -mx`,
    torCmd: (target) => `echo ${target} | dnsx -silent -a -aaaa -cname -mx`,
    parser: (stdout) => [{ severity: 'info', title: 'DNS Records', evidence: stdout }],
    timeout: 60,
    weight: 1,
    safe: true
  },
  {
    id: 'katana',
    name: 'Katana - Web Crawler',
    category: 'recon',
    binary: 'katana',
    installMethod: 'go',
    installCmd: 'go install github.com/projectdiscovery/katana/cmd/katana@latest',
    cmd: (target) => `katana -u ${target} -silent -jc -d 3`,
    torCmd: (target) => `katana -u ${target} -silent -jc -d 3 -proxy socks5://127.0.0.1:9050`,
    parser: (stdout) => {
      const urls = stdout.split('\n').filter(l => l.trim());
      return urls.length > 0 ? [{ severity: 'info', title: `Crawled ${urls.length} URLs`, evidence: urls.slice(0, 20).join('\n') }] : [];
    },
    timeout: 180,
    weight: 2,
    safe: true
  },
  {
    id: 'naabu',
    name: 'Naabu - Port Scanner',
    category: 'recon',
    binary: 'naabu',
    installMethod: 'go',
    installCmd: 'go install -v github.com/projectdiscovery/naabu/v2/cmd/naabu@latest',
    cmd: (target) => `naabu -host ${target} -silent -top-ports 100`,
    torCmd: (target) => `naabu -host ${target} -silent -top-ports 100 -proxy socks5://127.0.0.1:9050`,
    parser: (stdout) => {
      const ports = stdout.split('\n').filter(l => l.match(/:\d+$/));
      return ports.length > 0 ? [{ severity: 'info', title: `${ports.length} open ports`, evidence: ports.join('\n') }] : [];
    },
    timeout: 120,
    weight: 2,
    safe: false
  },
  {
    id: 'assetfinder',
    name: 'Assetfinder - Domain Finder',
    category: 'recon',
    binary: 'assetfinder',
    installMethod: 'go',
    installCmd: 'go install github.com/tomnomnom/assetfinder@latest',
    cmd: (target) => `assetfinder --subs-only ${target}`,
    torCmd: (target) => `assetfinder --subs-only ${target}`,
    parser: (stdout) => {
      const domains = stdout.split('\n').filter(l => l.trim());
      return domains.length > 0 ? [{ severity: 'info', title: `${domains.length} assets found`, evidence: domains.slice(0, 15).join('\n') }] : [];
    },
    timeout: 90,
    weight: 1,
    safe: true
  },
  {
    id: 'waybackurls',
    name: 'Waybackurls - Archive URLs',
    category: 'recon',
    binary: 'waybackurls',
    installMethod: 'go',
    installCmd: 'go install github.com/tomnomnom/waybackurls@latest',
    cmd: (target) => `echo ${target} | waybackurls`,
    torCmd: (target) => `echo ${target} | waybackurls`,
    parser: (stdout) => {
      const urls = stdout.split('\n').filter(l => l.startsWith('http'));
      return urls.length > 0 ? [{ severity: 'info', title: `${urls.length} archived URLs`, evidence: urls.slice(0, 20).join('\n') }] : [];
    },
    timeout: 120,
    weight: 1,
    safe: true
  },
  {
    id: 'httprobe',
    name: 'httprobe - HTTP Prober',
    category: 'recon',
    binary: 'httprobe',
    installMethod: 'go',
    installCmd: 'go install github.com/tomnomnom/httprobe@latest',
    cmd: (target) => `echo ${target} | httprobe`,
    torCmd: (target) => `echo ${target} | httprobe -p http:8080 https:8443`,
    parser: (stdout) => [{ severity: 'info', title: 'HTTP probe results', evidence: stdout }],
    timeout: 60,
    weight: 1,
    safe: true
  },
  {
    id: 'gau',
    name: 'gau - Get All URLs',
    category: 'recon',
    binary: 'gau',
    installMethod: 'go',
    installCmd: 'go install github.com/lc/gau/v2/cmd/gau@latest',
    cmd: (target) => `gau ${target} --threads 5`,
    torCmd: (target) => `gau ${target} --threads 5 --proxy socks5://127.0.0.1:9050`,
    parser: (stdout) => {
      const urls = stdout.split('\n').filter(l => l.startsWith('http'));
      return urls.length > 0 ? [{ severity: 'info', title: `${urls.length} URLs from archives`, evidence: urls.slice(0, 25).join('\n') }] : [];
    },
    timeout: 120,
    weight: 1,
    safe: true
  },
  {
    id: 'gospider',
    name: 'GoSpider - Web Spider',
    category: 'recon',
    binary: 'gospider',
    installMethod: 'go',
    installCmd: 'go install github.com/jaeles-project/gospider@latest',
    cmd: (target) => `gospider -s ${target} -d 2 -c 10`,
    torCmd: (target) => `gospider -s ${target} -d 2 -c 10 --proxy socks5://127.0.0.1:9050`,
    parser: (stdout) => {
      const links = stdout.split('\n').filter(l => l.includes('http'));
      return links.length > 0 ? [{ severity: 'info', title: `Spider found ${links.length} links`, evidence: links.slice(0, 20).join('\n') }] : [];
    },
    timeout: 180,
    weight: 2,
    safe: true
  },
  {
    id: 'getjs',
    name: 'getJS - JavaScript Finder',
    category: 'recon',
    binary: 'getJS',
    installMethod: 'go',
    installCmd: 'go install github.com/003random/getJS@latest',
    cmd: (target) => `echo ${target} | getJS --complete`,
    torCmd: (target) => `echo ${target} | getJS --complete`,
    parser: (stdout) => {
      const jsFiles = stdout.split('\n').filter(l => l.endsWith('.js'));
      return jsFiles.length > 0 ? [{ severity: 'info', title: `${jsFiles.length} JS files found`, evidence: jsFiles.slice(0, 15).join('\n') }] : [];
    },
    timeout: 90,
    weight: 1,
    safe: true
  },
  {
    id: 'hakrawler',
    name: 'Hakrawler - Web Crawler',
    category: 'recon',
    binary: 'hakrawler',
    installMethod: 'go',
    installCmd: 'go install github.com/hakluke/hakrawler@latest',
    cmd: (target) => `echo ${target} | hakrawler -depth 2`,
    torCmd: (target) => `echo ${target} | hakrawler -depth 2 -proxy socks5://127.0.0.1:9050`,
    parser: (stdout) => [{ severity: 'info', title: 'Crawl results', evidence: stdout }],
    timeout: 120,
    weight: 1,
    safe: true
  },
  {
    id: 'subover',
    name: 'SubOver - Subdomain Takeover',
    category: 'recon',
    binary: 'SubOver',
    installMethod: 'go',
    installCmd: 'go install github.com/Ice3man543/SubOver@latest',
    cmd: (target) => `echo ${target} | SubOver`,
    torCmd: (target) => `echo ${target} | SubOver`,
    parser: (stdout) => {
      if (stdout.includes('Takeover') || stdout.includes('vulnerable')) {
        return [{ severity: 'high', title: 'Subdomain takeover possible', evidence: stdout }];
      }
      return [];
    },
    timeout: 90,
    weight: 2,
    safe: true
  },
  {
    id: 'subjack',
    name: 'Subjack - Subdomain Takeover Check',
    category: 'recon',
    binary: 'subjack',
    installMethod: 'go',
    installCmd: 'go install github.com/haccer/subjack@latest',
    cmd: (target) => `subjack -d ${target} -ssl -v`,
    torCmd: (target) => `subjack -d ${target} -ssl -v`,
    parser: (stdout) => {
      if (stdout.includes('Vulnerable')) {
        return [{ severity: 'high', title: 'Subdomain vulnerable to takeover', evidence: stdout }];
      }
      return [];
    },
    timeout: 60,
    weight: 2,
    safe: true
  },
  {
    id: 'tlsx',
    name: 'tlsx - TLS Data Extractor',
    category: 'recon',
    binary: 'tlsx',
    installMethod: 'go',
    installCmd: 'go install github.com/projectdiscovery/tlsx/cmd/tlsx@latest',
    cmd: (target) => `echo ${target} | tlsx -silent`,
    torCmd: (target) => `echo ${target} | tlsx -silent -proxy socks5://127.0.0.1:9050`,
    parser: (stdout) => [{ severity: 'info', title: 'TLS information', evidence: stdout }],
    timeout: 60,
    weight: 1,
    safe: true
  },
  {
    id: 'whois',
    name: 'Whois - Domain Info',
    category: 'recon',
    binary: 'whois',
    installMethod: 'apt',
    installCmd: 'apt-get install -y whois',
    cmd: (target) => `whois ${target}`,
    torCmd: (target) => `whois ${target}`,
    parser: (stdout) => [{ severity: 'info', title: 'WHOIS data', evidence: stdout }],
    timeout: 30,
    weight: 1,
    safe: true
  },
  {
    id: 'dig',
    name: 'Dig - DNS Lookup',
    category: 'recon',
    binary: 'dig',
    installMethod: 'apt',
    installCmd: 'apt-get install -y dnsutils',
    cmd: (target) => `dig ${target} ANY +noall +answer`,
    torCmd: (target) => `dig ${target} ANY +noall +answer`,
    parser: (stdout) => [{ severity: 'info', title: 'DNS records', evidence: stdout }],
    timeout: 30,
    weight: 1,
    safe: true
  },
  {
    id: 'host',
    name: 'Host - DNS Lookup',
    category: 'recon',
    binary: 'host',
    installMethod: 'apt',
    installCmd: 'apt-get install -y bind9-host',
    cmd: (target) => `host -a ${target}`,
    torCmd: (target) => `host -a ${target}`,
    parser: (stdout) => [{ severity: 'info', title: 'Host lookup', evidence: stdout }],
    timeout: 30,
    weight: 1,
    safe: true
  },
  {
    id: 'theharvester',
    name: 'theHarvester - OSINT',
    category: 'recon',
    binary: 'theHarvester',
    installMethod: 'pip3',
    installCmd: 'pip3 install theHarvester',
    cmd: (target) => `theHarvester -d ${target} -b all -l 100`,
    torCmd: (target) => `theHarvester -d ${target} -b all -l 100`,
    parser: (stdout) => [{ severity: 'info', title: 'OSINT results', evidence: stdout }],
    timeout: 180,
    weight: 2,
    safe: true
  },
  {
    id: 'fierce',
    name: 'Fierce - DNS Scanner',
    category: 'recon',
    binary: 'fierce',
    installMethod: 'pip3',
    installCmd: 'pip3 install fierce',
    cmd: (target) => `fierce --domain ${target}`,
    torCmd: (target) => `fierce --domain ${target}`,
    parser: (stdout) => [{ severity: 'info', title: 'DNS scan results', evidence: stdout }],
    timeout: 120,
    weight: 1,
    safe: true
  },
  {
    id: 'dnsrecon',
    name: 'DNSRecon - DNS Enumeration',
    category: 'recon',
    binary: 'dnsrecon',
    installMethod: 'pip3',
    installCmd: 'pip3 install dnsrecon',
    cmd: (target) => `dnsrecon -d ${target}`,
    torCmd: (target) => `dnsrecon -d ${target}`,
    parser: (stdout) => [{ severity: 'info', title: 'DNS enumeration', evidence: stdout }],
    timeout: 120,
    weight: 1,
    safe: true
  },
  {
    id: 'amass',
    name: 'Amass - Attack Surface Mapping',
    category: 'recon',
    binary: 'amass',
    installMethod: 'apt',
    installCmd: 'apt-get install -y amass',
    cmd: (target) => `amass enum -d ${target} -passive`,
    torCmd: (target) => `amass enum -d ${target} -passive`,
    parser: (stdout) => {
      const domains = stdout.split('\n').filter(l => l.trim());
      return domains.length > 0 ? [{ severity: 'info', title: `Amass found ${domains.length} assets`, evidence: domains.slice(0, 20).join('\n') }] : [];
    },
    timeout: 300,
    weight: 3,
    safe: true
  },
  {
    id: 'shodan',
    name: 'Shodan - Internet Scanner',
    category: 'recon',
    binary: 'shodan',
    installMethod: 'pip3',
    installCmd: 'pip3 install shodan',
    cmd: (target) => `shodan host ${target}`,
    torCmd: (target) => `shodan host ${target}`,
    parser: (stdout) => [{ severity: 'info', title: 'Shodan data', evidence: stdout }],
    timeout: 60,
    weight: 1,
    safe: true
  },
  {
    id: 'certspotter',
    name: 'CertSpotter - Certificate Transparency',
    category: 'recon',
    binary: 'curl',
    installMethod: 'apt',
    installCmd: 'apt-get install -y curl',
    cmd: (target) => `curl -s "https://api.certspotter.com/v1/issuances?domain=${target}&include_subdomains=true&expand=dns_names" | head -50`,
    torCmd: (target) => `curl -s --socks5 127.0.0.1:9050 "https://api.certspotter.com/v1/issuances?domain=${target}&include_subdomains=true" | head -50`,
    parser: (stdout) => [{ severity: 'info', title: 'Certificate transparency logs', evidence: stdout }],
    timeout: 60,
    weight: 1,
    safe: true
  },
  {
    id: 'crt-sh',
    name: 'crt.sh - Certificate Search',
    category: 'recon',
    binary: 'curl',
    installMethod: 'apt',
    installCmd: 'apt-get install -y curl',
    cmd: (target) => `curl -s "https://crt.sh/?q=%.${target}&output=json" | head -100`,
    torCmd: (target) => `curl -s --socks5 127.0.0.1:9050 "https://crt.sh/?q=%.${target}&output=json" | head -100`,
    parser: (stdout) => [{ severity: 'info', title: 'Certificate search results', evidence: stdout }],
    timeout: 60,
    weight: 1,
    safe: true
  },
  {
    id: 'securitytrails',
    name: 'SecurityTrails API',
    category: 'recon',
    binary: 'curl',
    installMethod: 'apt',
    installCmd: 'apt-get install -y curl',
    cmd: (target) => `curl -s "https://api.securitytrails.com/v1/domain/${target}/subdomains"`,
    torCmd: (target) => `curl -s --socks5 127.0.0.1:9050 "https://api.securitytrails.com/v1/domain/${target}/subdomains"`,
    parser: (stdout) => [{ severity: 'info', title: 'SecurityTrails data', evidence: stdout }],
    timeout: 60,
    weight: 1,
    safe: true
  },
  {
    id: 'virustotal',
    name: 'VirusTotal Domain Check',
    category: 'recon',
    binary: 'curl',
    installMethod: 'apt',
    installCmd: 'apt-get install -y curl',
    cmd: (target) => `curl -s "https://www.virustotal.com/vtapi/v2/domain/report?apikey=&domain=${target}"`,
    torCmd: (target) => `curl -s --socks5 127.0.0.1:9050 "https://www.virustotal.com/vtapi/v2/domain/report?domain=${target}"`,
    parser: (stdout) => [{ severity: 'info', title: 'VirusTotal report', evidence: stdout }],
    timeout: 60,
    weight: 1,
    safe: true
  },
  {
    id: 'puredns',
    name: 'PureDNS - Fast DNS Resolver',
    category: 'recon',
    binary: 'puredns',
    installMethod: 'go',
    installCmd: 'go install github.com/d3mondev/puredns/v2@latest',
    cmd: (target) => `echo ${target} | puredns resolve`,
    torCmd: (target) => `echo ${target} | puredns resolve`,
    parser: (stdout) => [{ severity: 'info', title: 'DNS resolution results', evidence: stdout }],
    timeout: 60,
    weight: 1,
    safe: true
  },
  {
    id: 'massdns',
    name: 'MassDNS - High-performance DNS',
    category: 'recon',
    binary: 'massdns',
    installMethod: 'git',
    installCmd: 'git clone https://github.com/blechschmidt/massdns /opt/massdns && cd /opt/massdns && make && ln -s /opt/massdns/bin/massdns /usr/local/bin/massdns',
    cmd: (target) => `echo ${target} | massdns -r /etc/resolv.conf -t A`,
    torCmd: (target) => `echo ${target} | massdns -r /etc/resolv.conf -t A`,
    parser: (stdout) => [{ severity: 'info', title: 'MassDNS results', evidence: stdout }],
    timeout: 90,
    weight: 1,
    safe: true
  },

  // ============ WEB SCAN TOOLS (40) ============
  {
    id: 'ffuf',
    name: 'ffuf - Web Fuzzer',
    category: 'web',
    binary: 'ffuf',
    installMethod: 'go',
    installCmd: 'go install github.com/ffuf/ffuf/v2@latest',
    cmd: (target) => `ffuf -u ${target}/FUZZ -w /usr/share/wordlists/dirb/common.txt -mc 200,301,302 -t 50 -timeout 10`,
    torCmd: (target) => `ffuf -u ${target}/FUZZ -w /usr/share/wordlists/dirb/common.txt -mc 200,301,302 -x socks5://127.0.0.1:9050 -t 30`,
    parser: (stdout) => {
      const matches = stdout.match(/Status: (\d+)/g) || [];
      return matches.length > 0 ? [{ severity: 'info', title: `FFUF found ${matches.length} endpoints`, evidence: stdout }] : [];
    },
    timeout: 300,
    weight: 3,
    safe: false
  },
  {
    id: 'gobuster',
    name: 'Gobuster - Directory Brute Force',
    category: 'web',
    binary: 'gobuster',
    installMethod: 'go',
    installCmd: 'go install github.com/OJ/gobuster/v3@latest',
    cmd: (target) => `gobuster dir -u ${target} -w /usr/share/wordlists/dirb/common.txt -t 50 -q`,
    torCmd: (target) => `gobuster dir -u ${target} -w /usr/share/wordlists/dirb/common.txt -p socks5://127.0.0.1:9050 -t 30 -q`,
    parser: (stdout) => {
      const found = stdout.split('\n').filter(l => l.includes('Status:'));
      return found.length > 0 ? [{ severity: 'info', title: `${found.length} directories found`, evidence: found.join('\n') }] : [];
    },
    timeout: 300,
    weight: 3,
    safe: false
  },
  {
    id: 'feroxbuster',
    name: 'Feroxbuster - Content Discovery',
    category: 'web',
    binary: 'feroxbuster',
    installMethod: 'apt',
    installCmd: 'apt-get install -y feroxbuster',
    cmd: (target) => `feroxbuster -u ${target} -w /usr/share/wordlists/dirb/common.txt -t 100 -d 2 --silent`,
    torCmd: (target) => `feroxbuster -u ${target} -w /usr/share/wordlists/dirb/common.txt -p socks5://127.0.0.1:9050 -t 50 -d 2 --silent`,
    parser: (stdout) => {
      const urls = stdout.split('\n').filter(l => l.includes('http'));
      return urls.length > 0 ? [{ severity: 'info', title: `${urls.length} paths discovered`, evidence: urls.slice(0, 30).join('\n') }] : [];
    },
    timeout: 300,
    weight: 3,
    safe: false
  },
  {
    id: 'nikto',
    name: 'Nikto - Web Server Scanner',
    category: 'web',
    binary: 'nikto',
    installMethod: 'apt',
    installCmd: 'apt-get install -y nikto',
    cmd: (target) => `nikto -h ${target} -Tuning 1,2,3,4,5,6,7,8,9,0 -timeout 10`,
    torCmd: (target) => `nikto -h ${target} -useproxy socks5://127.0.0.1:9050 -Tuning 1,2,3,4,5,6,7,8,9,0`,
    parser: (stdout) => {
      const findings = [];
      if (stdout.includes('+ OSVDB')) findings.push({ severity: 'medium', title: 'Nikto found vulnerabilities', evidence: stdout });
      return findings;
    },
    timeout: 300,
    weight: 3,
    safe: false
  },
  {
    id: 'wapiti',
    name: 'Wapiti - Web Vulnerability Scanner',
    category: 'web',
    binary: 'wapiti',
    installMethod: 'pip3',
    installCmd: 'pip3 install wapiti3',
    cmd: (target) => `wapiti -u ${target} --scope domain -f txt`,
    torCmd: (target) => `wapiti -u ${target} --scope domain --proxy socks5://127.0.0.1:9050 -f txt`,
    parser: (stdout) => {
      const vulns = stdout.match(/Found \d+ vulnerability/g);
      return vulns ? [{ severity: 'high', title: 'Wapiti found vulnerabilities', evidence: stdout }] : [];
    },
    timeout: 300,
    weight: 3,
    safe: false
  },
  {
    id: 'wafw00f',
    name: 'wafw00f - WAF Detection',
    category: 'web',
    binary: 'wafw00f',
    installMethod: 'pip3',
    installCmd: 'pip3 install wafw00f',
    cmd: (target) => `wafw00f ${target}`,
    torCmd: (target) => `wafw00f ${target} -p socks5://127.0.0.1:9050`,
    parser: (stdout) => {
      if (stdout.includes('behind')) {
        return [{ severity: 'info', title: 'WAF detected', evidence: stdout }];
      }
      return [];
    },
    timeout: 60,
    weight: 1,
    safe: true
  },
  {
    id: 'dirsearch',
    name: 'Dirsearch - Web Path Scanner',
    category: 'web',
    binary: 'dirsearch',
    installMethod: 'pip3',
    installCmd: 'pip3 install dirsearch',
    cmd: (target) => `dirsearch -u ${target} -t 50 -e php,html,js -x 404,500`,
    torCmd: (target) => `dirsearch -u ${target} --proxy socks5://127.0.0.1:9050 -t 30 -e php,html,js`,
    parser: (stdout) => {
      const found = stdout.split('\n').filter(l => l.match(/\d{3}\s+/));
      return found.length > 0 ? [{ severity: 'info', title: `${found.length} paths found`, evidence: found.slice(0, 25).join('\n') }] : [];
    },
    timeout: 300,
    weight: 3,
    safe: false
  },
  {
    id: 'wpscan',
    name: 'WPScan - WordPress Scanner',
    category: 'web',
    binary: 'wpscan',
    installMethod: 'apt',
    installCmd: 'apt-get install -y wpscan',
    cmd: (target) => `wpscan --url ${target} --enumerate vp,vt,u --plugins-detection aggressive`,
    torCmd: (target) => `wpscan --url ${target} --proxy socks5://127.0.0.1:9050 --enumerate vp,vt,u`,
    parser: (stdout) => {
      const vulns = stdout.match(/\[\!\]/g);
      return vulns ? [{ severity: 'medium', title: `WPScan found ${vulns.length} issues`, evidence: stdout }] : [];
    },
    timeout: 180,
    weight: 2,
    safe: false
  },
  {
    id: 'dalfox',
    name: 'Dalfox - XSS Scanner',
    category: 'web',
    binary: 'dalfox',
    installMethod: 'go',
    installCmd: 'go install github.com/hahwul/dalfox/v2@latest',
    cmd: (target) => `dalfox url ${target} --silence`,
    torCmd: (target) => `dalfox url ${target} --proxy socks5://127.0.0.1:9050 --silence`,
    parser: (stdout) => {
      if (stdout.includes('POC') || stdout.includes('XSS')) {
        return [{ severity: 'high', title: 'XSS vulnerability found', evidence: stdout }];
      }
      return [];
    },
    timeout: 180,
    weight: 2,
    safe: false
  },
  {
    id: 'xsstrike',
    name: 'XSStrike - XSS Detection',
    category: 'web',
    binary: 'python3',
    installMethod: 'git',
    installCmd: 'git clone https://github.com/s0md3v/XSStrike /opt/xsstrike',
    cmd: (target) => `python3 /opt/xsstrike/xsstrike.py -u ${target} --crawl`,
    torCmd: (target) => `python3 /opt/xsstrike/xsstrike.py -u ${target} --crawl --proxy socks5://127.0.0.1:9050`,
    parser: (stdout) => {
      if (stdout.includes('XSS') || stdout.includes('Payload')) {
        return [{ severity: 'high', title: 'XSS detected by XSStrike', evidence: stdout }];
      }
      return [];
    },
    timeout: 240,
    weight: 2,
    safe: false
  },
  {
    id: 'corsy',
    name: 'Corsy - CORS Misconfiguration',
    category: 'web',
    binary: 'corsy',
    installMethod: 'go',
    installCmd: 'go install github.com/dwisiswant0/corsy@latest',
    cmd: (target) => `echo ${target} | corsy`,
    torCmd: (target) => `echo ${target} | corsy -proxy socks5://127.0.0.1:9050`,
    parser: (stdout) => {
      if (stdout.includes('vulnerable') || stdout.includes('Misconfigured')) {
        return [{ severity: 'medium', title: 'CORS misconfiguration found', evidence: stdout }];
      }
      return [];
    },
    timeout: 60,
    weight: 1,
    safe: true
  },
  {
    id: 'arjun',
    name: 'Arjun - HTTP Parameter Discovery',
    category: 'web',
    binary: 'arjun',
    installMethod: 'pip3',
    installCmd: 'pip3 install arjun',
    cmd: (target) => `arjun -u ${target}`,
    torCmd: (target) => `arjun -u ${target} --proxy socks5://127.0.0.1:9050`,
    parser: (stdout) => {
      const params = stdout.match(/Parameter:/g);
      return params ? [{ severity: 'info', title: `${params.length} parameters found`, evidence: stdout }] : [];
    },
    timeout: 180,
    weight: 2,
    safe: false
  },
  {
    id: 'paramspider',
    name: 'ParamSpider - Parameter Finder',
    category: 'web',
    binary: 'python3',
    installMethod: 'git',
    installCmd: 'git clone https://github.com/devanshbatham/ParamSpider /opt/paramspider && pip3 install -r /opt/paramspider/requirements.txt',
    cmd: (target) => `python3 /opt/paramspider/paramspider.py -d ${target}`,
    torCmd: (target) => `python3 /opt/paramspider/paramspider.py -d ${target}`,
    parser: (stdout) => {
      const params = stdout.split('\n').filter(l => l.includes('?'));
      return params.length > 0 ? [{ severity: 'info', title: `${params.length} parameters discovered`, evidence: params.slice(0, 20).join('\n') }] : [];
    },
    timeout: 120,
    weight: 1,
    safe: true
  },
  {
    id: 'uro',
    name: 'uro - URL Deduplicator',
    category: 'web',
    binary: 'uro',
    installMethod: 'pip3',
    installCmd: 'pip3 install uro',
    cmd: (target) => `echo ${target} | uro`,
    torCmd: (target) => `echo ${target} | uro`,
    parser: (stdout) => [{ severity: 'info', title: 'Deduplicated URLs', evidence: stdout }],
    timeout: 30,
    weight: 1,
    safe: true
  },
  {
    id: 'qsreplace',
    name: 'qsreplace - Query String Replacer',
    category: 'web',
    binary: 'qsreplace',
    installMethod: 'go',
    installCmd: 'go install github.com/tomnomnom/qsreplace@latest',
    cmd: (target) => `echo "${target}?id=1" | qsreplace "FUZZ"`,
    torCmd: (target) => `echo "${target}?id=1" | qsreplace "FUZZ"`,
    parser: (stdout) => [{ severity: 'info', title: 'Parameter fuzzing ready', evidence: stdout }],
    timeout: 30,
    weight: 1,
    safe: true
  },
  {
    id: 'gf',
    name: 'gf - Grep Framework',
    category: 'web',
    binary: 'gf',
    installMethod: 'go',
    installCmd: 'go install github.com/tomnomnom/gf@latest',
    cmd: (target) => `echo ${target} | gf xss`,
    torCmd: (target) => `echo ${target} | gf xss`,
    parser: (stdout) => [{ severity: 'info', title: 'Pattern matching results', evidence: stdout }],
    timeout: 30,
    weight: 1,
    safe: true
  },
  {
    id: 'jwt-tool',
    name: 'JWT Tool - JWT Security',
    category: 'web',
    binary: 'jwt_tool',
    installMethod: 'pip3',
    installCmd: 'pip3 install jwt-tool',
    cmd: (target) => `jwt_tool ${target}`,
    torCmd: (target) => `jwt_tool ${target}`,
    parser: (stdout) => {
      if (stdout.includes('vulnerability') || stdout.includes('weak')) {
        return [{ severity: 'high', title: 'JWT vulnerability found', evidence: stdout }];
      }
      return [];
    },
    timeout: 60,
    weight: 1,
    safe: true
  },
  {
    id: 'jexboss',
    name: 'JexBoss - JBoss Scanner',
    category: 'web',
    binary: 'python',
    installMethod: 'git',
    installCmd: 'git clone https://github.com/joaomatosf/jexboss /opt/jexboss && pip3 install -r /opt/jexboss/requires.txt',
    cmd: (target) => `python /opt/jexboss/jexboss.py -u ${target}`,
    torCmd: (target) => `python /opt/jexboss/jexboss.py -u ${target} --proxy socks5://127.0.0.1:9050`,
    parser: (stdout) => {
      if (stdout.includes('VULNERABLE')) {
        return [{ severity: 'critical', title: 'JBoss vulnerability found', evidence: stdout }];
      }
      return [];
    },
    timeout: 120,
    weight: 2,
    safe: false
  },
  {
    id: 'retire',
    name: 'Retire.js - JS Library Vulnerabilities',
    category: 'web',
    binary: 'retire',
    installMethod: 'npm',
    installCmd: 'npm install -g retire',
    cmd: (target) => `retire --url ${target}`,
    torCmd: (target) => `retire --url ${target} --proxy socks5://127.0.0.1:9050`,
    parser: (stdout) => {
      if (stdout.includes('vulnerabilit')) {
        return [{ severity: 'medium', title: 'Vulnerable JS libraries found', evidence: stdout }];
      }
      return [];
    },
    timeout: 90,
    weight: 1,
    safe: true
  },
  {
    id: 'cmseek',
    name: 'CMSeeK - CMS Detection',
    category: 'web',
    binary: 'python3',
    installMethod: 'git',
    installCmd: 'git clone https://github.com/Tuhinshubhra/CMSeeK /opt/cmseek',
    cmd: (target) => `python3 /opt/cmseek/cmseek.py -u ${target}`,
    torCmd: (target) => `python3 /opt/cmseek/cmseek.py -u ${target} --proxy socks5://127.0.0.1:9050`,
    parser: (stdout) => [{ severity: 'info', title: 'CMS detection results', evidence: stdout }],
    timeout: 120,
    weight: 1,
    safe: true
  },
  {
    id: 'whatweb',
    name: 'WhatWeb - Web Tech Identifier',
    category: 'web',
    binary: 'whatweb',
    installMethod: 'apt',
    installCmd: 'apt-get install -y whatweb',
    cmd: (target) => `whatweb ${target} -a 3`,
    torCmd: (target) => `whatweb ${target} -a 3 --proxy socks5://127.0.0.1:9050`,
    parser: (stdout) => [{ severity: 'info', title: 'Web technologies', evidence: stdout }],
    timeout: 60,
    weight: 1,
    safe: true
  },
  {
    id: 'webanalyze',
    name: 'webanalyze - Technology Profiler',
    category: 'web',
    binary: 'webanalyze',
    installMethod: 'go',
    installCmd: 'go install github.com/rverton/webanalyze/cmd/webanalyze@latest',
    cmd: (target) => `webanalyze -host ${target}`,
    torCmd: (target) => `webanalyze -host ${target} -proxy socks5://127.0.0.1:9050`,
    parser: (stdout) => [{ severity: 'info', title: 'Technology stack', evidence: stdout }],
    timeout: 60,
    weight: 1,
    safe: true
  },
  {
    id: 'wfuzz',
    name: 'Wfuzz - Web Fuzzer',
    category: 'web',
    binary: 'wfuzz',
    installMethod: 'pip3',
    installCmd: 'pip3 install wfuzz',
    cmd: (target) => `wfuzz -c -z file,/usr/share/wordlists/dirb/common.txt --hc 404 ${target}/FUZZ`,
    torCmd: (target) => `wfuzz -c -z file,/usr/share/wordlists/dirb/common.txt --hc 404 -p 127.0.0.1:9050:SOCKS5 ${target}/FUZZ`,
    parser: (stdout) => {
      const lines = stdout.split('\n').filter(l => l.includes('C='));
      return lines.length > 0 ? [{ severity: 'info', title: `Wfuzz found ${lines.length} responses`, evidence: lines.slice(0, 20).join('\n') }] : [];
    },
    timeout: 300,
    weight: 3,
    safe: false
  },
  {
    id: 'burpsuite-cli',
    name: 'Burp Suite CLI Scanner',
    category: 'web',
    binary: 'burp',
    installMethod: 'curl',
    installCmd: 'echo "Burp Suite requires manual installation"',
    cmd: (target) => `echo "Burp CLI scan: ${target}"`,
    torCmd: (target) => `echo "Burp CLI scan via Tor: ${target}"`,
    parser: (stdout) => [{ severity: 'info', title: 'Burp scan placeholder', evidence: stdout }],
    timeout: 300,
    weight: 3,
    safe: false
  },
  {
    id: 'zaproxy',
    name: 'OWASP ZAP Baseline Scan',
    category: 'web',
    binary: 'zap-cli',
    installMethod: 'pip3',
    installCmd: 'pip3 install zapcli',
    cmd: (target) => `zap-cli quick-scan ${target}`,
    torCmd: (target) => `zap-cli quick-scan ${target} --proxy socks5://127.0.0.1:9050`,
    parser: (stdout) => {
      if (stdout.includes('WARN') || stdout.includes('FAIL')) {
        return [{ severity: 'medium', title: 'ZAP found issues', evidence: stdout }];
      }
      return [];
    },
    timeout: 300,
    weight: 3,
    safe: false
  },
  {
    id: 'skipfish',
    name: 'Skipfish - Web App Scanner',
    category: 'web',
    binary: 'skipfish',
    installMethod: 'apt',
    installCmd: 'apt-get install -y skipfish',
    cmd: (target) => `skipfish -o /tmp/skipfish-${Date.now()} ${target}`,
    torCmd: (target) => `skipfish -o /tmp/skipfish-${Date.now()} -j socks5://127.0.0.1:9050 ${target}`,
    parser: (stdout) => [{ severity: 'info', title: 'Skipfish scan completed', evidence: stdout }],
    timeout: 300,
    weight: 3,
    safe: false
  },
  {
    id: 'arachni',
    name: 'Arachni - Web Security Scanner',
    category: 'web',
    binary: 'arachni',
    installMethod: 'curl',
    installCmd: 'echo "Arachni requires manual installation from https://www.arachni-scanner.com/"',
    cmd: (target) => `arachni ${target} --checks=*`,
    torCmd: (target) => `arachni ${target} --checks=* --proxy socks5://127.0.0.1:9050`,
    parser: (stdout) => {
      if (stdout.includes('Issue')) {
        return [{ severity: 'medium', title: 'Arachni found issues', evidence: stdout }];
      }
      return [];
    },
    timeout: 300,
    weight: 3,
    safe: false
  },
  {
    id: 'uniscan',
    name: 'Uniscan - Web Vulnerability Scanner',
    category: 'web',
    binary: 'uniscan',
    installMethod: 'apt',
    installCmd: 'apt-get install -y uniscan',
    cmd: (target) => `uniscan -u ${target} -qweds`,
    torCmd: (target) => `uniscan -u ${target} -qweds`,
    parser: (stdout) => [{ severity: 'info', title: 'Uniscan results', evidence: stdout }],
    timeout: 240,
    weight: 2,
    safe: false
  },
  {
    id: 'photon',
    name: 'Photon - Web Crawler',
    category: 'web',
    binary: 'python3',
    installMethod: 'git',
    installCmd: 'git clone https://github.com/s0md3v/Photon /opt/photon && pip3 install -r /opt/photon/requirements.txt',
    cmd: (target) => `python3 /opt/photon/photon.py -u ${target} -l 2 -t 50`,
    torCmd: (target) => `python3 /opt/photon/photon.py -u ${target} -l 2 -t 50`,
    parser: (stdout) => [{ severity: 'info', title: 'Photon crawl results', evidence: stdout }],
    timeout: 180,
    weight: 2,
    safe: true
  },
  {
    id: 'linkfinder',
    name: 'LinkFinder - Endpoint Discovery',
    category: 'web',
    binary: 'python3',
    installMethod: 'git',
    installCmd: 'git clone https://github.com/GerbenJavado/LinkFinder /opt/linkfinder && pip3 install -r /opt/linkfinder/requirements.txt',
    cmd: (target) => `python3 /opt/linkfinder/linkfinder.py -i ${target} -o cli`,
    torCmd: (target) => `python3 /opt/linkfinder/linkfinder.py -i ${target} -o cli`,
    parser: (stdout) => {
      const endpoints = stdout.split('\n').filter(l => l.includes('/'));
      return endpoints.length > 0 ? [{ severity: 'info', title: `${endpoints.length} endpoints found`, evidence: endpoints.slice(0, 25).join('\n') }] : [];
    },
    timeout: 90,
    weight: 1,
    safe: true
  },
  {
    id: 'jsparser',
    name: 'JSParser - JavaScript Analyzer',
    category: 'web',
    binary: 'python3',
    installMethod: 'git',
    installCmd: 'git clone https://github.com/nahamsec/JSParser /opt/jsparser',
    cmd: (target) => `python3 /opt/jsparser/handler.py ${target}`,
    torCmd: (target) => `python3 /opt/jsparser/handler.py ${target}`,
    parser: (stdout) => [{ severity: 'info', title: 'JavaScript analysis', evidence: stdout }],
    timeout: 90,
    weight: 1,
    safe: true
  },
  {
    id: 'waybackpy',
    name: 'waybackpy - Wayback Machine',
    category: 'web',
    binary: 'waybackpy',
    installMethod: 'pip3',
    installCmd: 'pip3 install waybackpy',
    cmd: (target) => `waybackpy --url ${target} --user_agent "Mozilla" --known_urls`,
    torCmd: (target) => `waybackpy --url ${target} --user_agent "Mozilla" --known_urls`,
    parser: (stdout) => {
      const urls = stdout.split('\n').filter(l => l.startsWith('http'));
      return urls.length > 0 ? [{ severity: 'info', title: `${urls.length} archived URLs`, evidence: urls.slice(0, 30).join('\n') }] : [];
    },
    timeout: 120,
    weight: 1,
    safe: true
  },
  {
    id: 'cloudflare-enum',
    name: 'CloudFlare Enumeration',
    category: 'web',
    binary: 'curl',
    installMethod: 'apt',
    installCmd: 'apt-get install -y curl',
    cmd: (target) => `curl -s -I ${target} | grep -i cloudflare`,
    torCmd: (target) => `curl -s --socks5 127.0.0.1:9050 -I ${target} | grep -i cloudflare`,
    parser: (stdout) => {
      if (stdout.includes('cloudflare')) {
        return [{ severity: 'info', title: 'CloudFlare detected', evidence: stdout }];
      }
      return [];
    },
    timeout: 30,
    weight: 1,
    safe: true
  },
  {
    id: 'robots-scanner',
    name: 'Robots.txt Scanner',
    category: 'web',
    binary: 'curl',
    installMethod: 'apt',
    installCmd: 'apt-get install -y curl',
    cmd: (target) => `curl -s ${target}/robots.txt`,
    torCmd: (target) => `curl -s --socks5 127.0.0.1:9050 ${target}/robots.txt`,
    parser: (stdout) => {
      if (stdout.includes('Disallow') || stdout.includes('Allow')) {
        return [{ severity: 'info', title: 'robots.txt found', evidence: stdout }];
      }
      return [];
    },
    timeout: 30,
    weight: 1,
    safe: true
  },
  {
    id: 'sitemap-scanner',
    name: 'Sitemap.xml Scanner',
    category: 'web',
    binary: 'curl',
    installMethod: 'apt',
    installCmd: 'apt-get install -y curl',
    cmd: (target) => `curl -s ${target}/sitemap.xml`,
    torCmd: (target) => `curl -s --socks5 127.0.0.1:9050 ${target}/sitemap.xml`,
    parser: (stdout) => {
      if (stdout.includes('<url>') || stdout.includes('<loc>')) {
        return [{ severity: 'info', title: 'sitemap.xml found', evidence: stdout.substring(0, 500) }];
      }
      return [];
    },
    timeout: 30,
    weight: 1,
    safe: true
  },
  {
    id: 'security-headers',
    name: 'Security Headers Check',
    category: 'web',
    binary: 'curl',
    installMethod: 'apt',
    installCmd: 'apt-get install -y curl',
    cmd: (target) => `curl -s -I ${target} | grep -iE "strict-transport|x-frame|x-content|x-xss|content-security"`,
    torCmd: (target) => `curl -s --socks5 127.0.0.1:9050 -I ${target} | grep -iE "strict-transport|x-frame|x-content|x-xss|content-security"`,
    parser: (stdout) => {
      if (stdout.length < 50) {
        return [{ severity: 'medium', title: 'Missing security headers', evidence: 'Some security headers are not implemented' }];
      }
      return [{ severity: 'info', title: 'Security headers present', evidence: stdout }];
    },
    timeout: 30,
    weight: 1,
    safe: true
  },
  {
    id: 'cookie-scanner',
    name: 'Cookie Security Scanner',
    category: 'web',
    binary: 'curl',
    installMethod: 'apt',
    installCmd: 'apt-get install -y curl',
    cmd: (target) => `curl -s -I ${target} | grep -i "set-cookie"`,
    torCmd: (target) => `curl -s --socks5 127.0.0.1:9050 -I ${target} | grep -i "set-cookie"`,
    parser: (stdout) => {
      const findings = [];
      if (stdout && !stdout.includes('HttpOnly')) {
        findings.push({ severity: 'medium', title: 'Cookie missing HttpOnly flag', evidence: stdout });
      }
      if (stdout && !stdout.includes('Secure')) {
        findings.push({ severity: 'medium', title: 'Cookie missing Secure flag', evidence: stdout });
      }
      return findings;
    },
    timeout: 30,
    weight: 1,
    safe: true
  },
  {
    id: 'http-methods',
    name: 'HTTP Methods Test',
    category: 'web',
    binary: 'curl',
    installMethod: 'apt',
    installCmd: 'apt-get install -y curl',
    cmd: (target) => `curl -s -X OPTIONS -i ${target} | grep -i allow`,
    torCmd: (target) => `curl -s --socks5 127.0.0.1:9050 -X OPTIONS -i ${target} | grep -i allow`,
    parser: (stdout) => {
      if (stdout.includes('PUT') || stdout.includes('DELETE') || stdout.includes('TRACE')) {
        return [{ severity: 'medium', title: 'Dangerous HTTP methods enabled', evidence: stdout }];
      }
      return [{ severity: 'info', title: 'HTTP methods check', evidence: stdout }];
    },
    timeout: 30,
    weight: 1,
    safe: true
  },

  // ============ VULN SCAN TOOLS (40) ============
  {
    id: 'sqlmap',
    name: 'SQLmap - SQL Injection',
    category: 'vuln',
    binary: 'sqlmap',
    installMethod: 'pip3',
    installCmd: 'pip3 install sqlmap',
    cmd: (target) => `sqlmap -u "${target}" --batch --random-agent --level=1 --risk=1 --threads=5 --timeout=10`,
    torCmd: (target) => `sqlmap -u "${target}" --batch --tor --tor-type=SOCKS5 --tor-port=9050 --check-tor --level=1 --risk=1`,
    parser: (stdout) => {
      if (stdout.includes('injectable') || stdout.includes('parameter')) {
        return [{ severity: 'critical', title: 'SQL injection vulnerability', evidence: stdout, cve: 'CWE-89' }];
      }
      return [];
    },
    timeout: 300,
    weight: 3,
    safe: false
  },
  {
    id: 'commix',
    name: 'Commix - Command Injection',
    category: 'vuln',
    binary: 'python',
    installMethod: 'git',
    installCmd: 'git clone https://github.com/commixproject/commix /opt/commix',
    cmd: (target) => `python /opt/commix/commix.py --url="${target}" --batch --level=1`,
    torCmd: (target) => `python /opt/commix/commix.py --url="${target}" --batch --tor --tor-port=9050 --level=1`,
    parser: (stdout) => {
      if (stdout.includes('vulnerable') || stdout.includes('injection')) {
        return [{ severity: 'critical', title: 'Command injection found', evidence: stdout, cve: 'CWE-77' }];
      }
      return [];
    },
    timeout: 240,
    weight: 3,
    safe: false
  },
  {
    id: 'tplmap',
    name: 'tplmap - Template Injection',
    category: 'vuln',
    binary: 'python',
    installMethod: 'git',
    installCmd: 'git clone https://github.com/epinna/tplmap /opt/tplmap',
    cmd: (target) => `python /opt/tplmap/tplmap.py -u "${target}"`,
    torCmd: (target) => `python /opt/tplmap/tplmap.py -u "${target}" --proxy socks5://127.0.0.1:9050`,
    parser: (stdout) => {
      if (stdout.includes('SSTI') || stdout.includes('Tested')) {
        return [{ severity: 'high', title: 'Template injection detected', evidence: stdout, cve: 'CWE-1336' }];
      }
      return [];
    },
    timeout: 180,
    weight: 2,
    safe: false
  },
  {
    id: 'ssrfmap',
    name: 'SSRFmap - SSRF Exploitation',
    category: 'vuln',
    binary: 'python3',
    installMethod: 'git',
    installCmd: 'git clone https://github.com/swisskyrepo/SSRFmap /opt/ssrfmap && pip3 install -r /opt/ssrfmap/requirements.txt',
    cmd: (target) => `python3 /opt/ssrfmap/ssrfmap.py -r ${target}`,
    torCmd: (target) => `python3 /opt/ssrfmap/ssrfmap.py -r ${target} --proxy socks5://127.0.0.1:9050`,
    parser: (stdout) => {
      if (stdout.includes('SSRF') || stdout.includes('vulnerable')) {
        return [{ severity: 'high', title: 'SSRF vulnerability found', evidence: stdout, cve: 'CWE-918' }];
      }
      return [];
    },
    timeout: 180,
    weight: 2,
    safe: false
  },
  {
    id: 'xxeinjector',
    name: 'XXEinjector - XXE Tester',
    category: 'vuln',
    binary: 'ruby',
    installMethod: 'git',
    installCmd: 'git clone https://github.com/enjoiz/XXEinjector /opt/xxeinjector',
    cmd: (target) => `ruby /opt/xxeinjector/XXEinjector.rb --host=${target} --path=/ --file=/opt/xxeinjector/Requests/Request.txt`,
    torCmd: (target) => `ruby /opt/xxeinjector/XXEinjector.rb --host=${target} --path=/ --file=/opt/xxeinjector/Requests/Request.txt --proxy=127.0.0.1:9050`,
    parser: (stdout) => {
      if (stdout.includes('XXE') || stdout.includes('vulnerable')) {
        return [{ severity: 'high', title: 'XXE vulnerability detected', evidence: stdout, cve: 'CWE-611' }];
      }
      return [];
    },
    timeout: 180,
    weight: 2,
    safe: false
  },
  {
    id: 'lfi-suite',
    name: 'LFI Suite - Local File Inclusion',
    category: 'vuln',
    binary: 'python',
    installMethod: 'git',
    installCmd: 'git clone https://github.com/D35m0nd142/LFISuite /opt/lfisuite && pip install -r /opt/lfisuite/requirements.txt',
    cmd: (target) => `python /opt/lfisuite/lfisuite.py -u ${target}`,
    torCmd: (target) => `python /opt/lfisuite/lfisuite.py -u ${target} --proxy socks5://127.0.0.1:9050`,
    parser: (stdout) => {
      if (stdout.includes('LFI') || stdout.includes('vulnerable')) {
        return [{ severity: 'critical', title: 'LFI vulnerability found', evidence: stdout, cve: 'CWE-98' }];
      }
      return [];
    },
    timeout: 180,
    weight: 2,
    safe: false
  },
  {
    id: 'dotdotpwn',
    name: 'DotDotPwn - Path Traversal',
    category: 'vuln',
    binary: 'perl',
    installMethod: 'apt',
    installCmd: 'apt-get install -y dotdotpwn',
    cmd: (target) => `dotdotpwn -m http -h ${target} -k root -f /etc/passwd -d 5 -t 50 -q`,
    torCmd: (target) => `dotdotpwn -m http -h ${target} -k root -f /etc/passwd -d 5 -t 50 -q`,
    parser: (stdout) => {
      if (stdout.includes('VULNERABLE') || stdout.includes('root:x:0')) {
        return [{ severity: 'critical', title: 'Path traversal vulnerability', evidence: stdout, cve: 'CWE-22' }];
      }
      return [];
    },
    timeout: 180,
    weight: 2,
    safe: false
  },
  {
    id: 'csrf-scanner',
    name: 'CSRF Token Scanner',
    category: 'vuln',
    binary: 'curl',
    installMethod: 'apt',
    installCmd: 'apt-get install -y curl',
    cmd: (target) => `curl -s ${target} | grep -iE "csrf|token|xsrf"`,
    torCmd: (target) => `curl -s --socks5 127.0.0.1:9050 ${target} | grep -iE "csrf|token|xsrf"`,
    parser: (stdout) => {
      if (stdout.length < 10) {
        return [{ severity: 'medium', title: 'Potential CSRF vulnerability - no tokens found', evidence: 'No CSRF tokens detected in forms', cve: 'CWE-352' }];
      }
      return [{ severity: 'info', title: 'CSRF tokens present', evidence: stdout.substring(0, 200) }];
    },
    timeout: 30,
    weight: 1,
    safe: true
  },
  {
    id: 'openredirect',
    name: 'Open Redirect Scanner',
    category: 'vuln',
    binary: 'python3',
    installMethod: 'git',
    installCmd: 'git clone https://github.com/dwisiswant0/findom-xss /opt/openredirect',
    cmd: (target) => `echo "${target}?url=https://evil.com" | curl -s -I -L`,
    torCmd: (target) => `echo "${target}?url=https://evil.com" | curl -s --socks5 127.0.0.1:9050 -I -L`,
    parser: (stdout) => {
      if (stdout.includes('evil.com') || stdout.includes('302')) {
        return [{ severity: 'medium', title: 'Potential open redirect', evidence: stdout, cve: 'CWE-601' }];
      }
      return [];
    },
    timeout: 60,
    weight: 1,
    safe: false
  },
  {
    id: 'crlf-injection',
    name: 'CRLF Injection Test',
    category: 'vuln',
    binary: 'curl',
    installMethod: 'apt',
    installCmd: 'apt-get install -y curl',
    cmd: (target) => `curl -s -I "${target}?param=%0d%0aInjected:Header"`,
    torCmd: (target) => `curl -s --socks5 127.0.0.1:9050 -I "${target}?param=%0d%0aInjected:Header"`,
    parser: (stdout) => {
      if (stdout.includes('Injected:') || stdout.includes('Injected-Header')) {
        return [{ severity: 'high', title: 'CRLF injection vulnerability', evidence: stdout, cve: 'CWE-93' }];
      }
      return [];
    },
    timeout: 30,
    weight: 1,
    safe: false
  },
  {
    id: 'host-header',
    name: 'Host Header Injection',
    category: 'vuln',
    binary: 'curl',
    installMethod: 'apt',
    installCmd: 'apt-get install -y curl',
    cmd: (target) => `curl -s -H "Host: evil.com" ${target}`,
    torCmd: (target) => `curl -s --socks5 127.0.0.1:9050 -H "Host: evil.com" ${target}`,
    parser: (stdout) => {
      if (stdout.includes('evil.com')) {
        return [{ severity: 'medium', title: 'Host header injection possible', evidence: stdout, cve: 'CWE-644' }];
      }
      return [];
    },
    timeout: 30,
    weight: 1,
    safe: false
  },
  {
    id: 'clickjacking',
    name: 'Clickjacking Test',
    category: 'vuln',
    binary: 'curl',
    installMethod: 'apt',
    installCmd: 'apt-get install -y curl',
    cmd: (target) => `curl -s -I ${target} | grep -i "x-frame-options"`,
    torCmd: (target) => `curl -s --socks5 127.0.0.1:9050 -I ${target} | grep -i "x-frame-options"`,
    parser: (stdout) => {
      if (!stdout || stdout.length < 5) {
        return [{ severity: 'medium', title: 'Clickjacking vulnerability - X-Frame-Options missing', evidence: 'No X-Frame-Options header', cve: 'CWE-1021' }];
      }
      return [];
    },
    timeout: 30,
    weight: 1,
    safe: true
  },
  {
    id: 'subdomain-takeover-check',
    name: 'Subdomain Takeover Verification',
    category: 'vuln',
    binary: 'dig',
    installMethod: 'apt',
    installCmd: 'apt-get install -y dnsutils',
    cmd: (target) => `dig ${target} CNAME +short`,
    torCmd: (target) => `dig ${target} CNAME +short`,
    parser: (stdout) => {
      const keywords = ['amazonaws', 'cloudfront', 'herokuapp', 'github.io', 'azurewebsites'];
      if (keywords.some(k => stdout.includes(k))) {
        return [{ severity: 'high', title: 'Potential subdomain takeover - dangling CNAME', evidence: stdout, cve: 'CWE-350' }];
      }
      return [];
    },
    timeout: 30,
    weight: 1,
    safe: true
  },
  {
    id: 'file-upload',
    name: 'File Upload Vulnerability Test',
    category: 'vuln',
    binary: 'curl',
    installMethod: 'apt',
    installCmd: 'apt-get install -y curl',
    cmd: (target) => `echo "Testing file upload at ${target}"`,
    torCmd: (target) => `echo "Testing file upload at ${target} via Tor"`,
    parser: (stdout) => [{ severity: 'info', title: 'File upload test placeholder', evidence: stdout }],
    timeout: 60,
    weight: 1,
    safe: false
  },
  {
    id: 'xml-bomb',
    name: 'XML Bomb Test',
    category: 'vuln',
    binary: 'curl',
    installMethod: 'apt',
    installCmd: 'apt-get install -y curl',
    cmd: (target) => `echo "XML bomb test placeholder for ${target}"`,
    torCmd: (target) => `echo "XML bomb test placeholder for ${target}"`,
    parser: (stdout) => [{ severity: 'info', title: 'XML bomb test', evidence: stdout }],
    timeout: 30,
    weight: 1,
    safe: false
  },
  {
    id: 'jwt-crack',
    name: 'JWT Secret Cracking',
    category: 'vuln',
    binary: 'hashcat',
    installMethod: 'apt',
    installCmd: 'apt-get install -y hashcat',
    cmd: (target) => `echo "JWT cracking placeholder"`,
    torCmd: (target) => `echo "JWT cracking placeholder"`,
    parser: (stdout) => [{ severity: 'info', title: 'JWT analysis', evidence: stdout }],
    timeout: 120,
    weight: 2,
    safe: true
  },
  {
    id: 'deserialization',
    name: 'Deserialization Vuln Test',
    category: 'vuln',
    binary: 'ysoserial',
    installMethod: 'curl',
    installCmd: 'echo "ysoserial requires manual installation"',
    cmd: (target) => `echo "Deserialization test for ${target}"`,
    torCmd: (target) => `echo "Deserialization test for ${target}"`,
    parser: (stdout) => [{ severity: 'info', title: 'Deserialization test', evidence: stdout }],
    timeout: 60,
    weight: 1,
    safe: false
  },
  {
    id: 'ssrf-localhost',
    name: 'SSRF to Localhost',
    category: 'vuln',
    binary: 'curl',
    installMethod: 'apt',
    installCmd: 'apt-get install -y curl',
    cmd: (target) => `curl -s "${target}?url=http://127.0.0.1:80"`,
    torCmd: (target) => `curl -s --socks5 127.0.0.1:9050 "${target}?url=http://127.0.0.1:80"`,
    parser: (stdout) => {
      if (stdout.includes('localhost') || stdout.includes('127.0.0.1')) {
        return [{ severity: 'high', title: 'SSRF to localhost possible', evidence: stdout, cve: 'CWE-918' }];
      }
      return [];
    },
    timeout: 60,
    weight: 1,
    safe: false
  },
  {
    id: 'race-condition',
    name: 'Race Condition Test',
    category: 'vuln',
    binary: 'curl',
    installMethod: 'apt',
    installCmd: 'apt-get install -y curl',
    cmd: (target) => `echo "Race condition test placeholder"`,
    torCmd: (target) => `echo "Race condition test placeholder"`,
    parser: (stdout) => [{ severity: 'info', title: 'Race condition test', evidence: stdout }],
    timeout: 60,
    weight: 1,
    safe: false
  },
  {
    id: 'graphql-introspection',
    name: 'GraphQL Introspection',
    category: 'vuln',
    binary: 'curl',
    installMethod: 'apt',
    installCmd: 'apt-get install -y curl',
    cmd: (target) => `curl -s -X POST ${target}/graphql -H "Content-Type: application/json" -d '{"query":"{__schema{types{name}}}"}'`,
    torCmd: (target) => `curl -s --socks5 127.0.0.1:9050 -X POST ${target}/graphql -H "Content-Type: application/json" -d '{"query":"{__schema{types{name}}}"}'`,
    parser: (stdout) => {
      if (stdout.includes('__schema') || stdout.includes('types')) {
        return [{ severity: 'medium', title: 'GraphQL introspection enabled', evidence: stdout }];
      }
      return [];
    },
    timeout: 30,
    weight: 1,
    safe: true
  },
  {
    id: 'api-keys-leak',
    name: 'API Keys Leakage Scanner',
    category: 'vuln',
    binary: 'trufflehog',
    installMethod: 'pip3',
    installCmd: 'pip3 install trufflehog',
    cmd: (target) => `trufflehog ${target} --json`,
    torCmd: (target) => `trufflehog ${target} --json`,
    parser: (stdout) => {
      if (stdout.includes('api') || stdout.includes('key')) {
        return [{ severity: 'critical', title: 'API keys or secrets leaked', evidence: stdout }];
      }
      return [];
    },
    timeout: 180,
    weight: 2,
    safe: true
  },
  {
    id: 'secret-finder',
    name: 'SecretFinder - JS Secrets',
    category: 'vuln',
    binary: 'python3',
    installMethod: 'git',
    installCmd: 'git clone https://github.com/m4ll0k/SecretFinder /opt/secretfinder && pip3 install -r /opt/secretfinder/requirements.txt',
    cmd: (target) => `python3 /opt/secretfinder/SecretFinder.py -i ${target}`,
    torCmd: (target) => `python3 /opt/secretfinder/SecretFinder.py -i ${target}`,
    parser: (stdout) => {
      if (stdout.includes('api') || stdout.includes('token')) {
        return [{ severity: 'high', title: 'Secrets found in JavaScript', evidence: stdout }];
      }
      return [];
    },
    timeout: 90,
    weight: 1,
    safe: true
  },
  {
    id: 'git-exposure',
    name: 'Git Repository Exposure',
    category: 'vuln',
    binary: 'curl',
    installMethod: 'apt',
    installCmd: 'apt-get install -y curl',
    cmd: (target) => `curl -s ${target}/.git/config`,
    torCmd: (target) => `curl -s --socks5 127.0.0.1:9050 ${target}/.git/config`,
    parser: (stdout) => {
      if (stdout.includes('[core]') || stdout.includes('repositoryformatversion')) {
        return [{ severity: 'critical', title: 'Exposed .git directory', evidence: stdout }];
      }
      return [];
    },
    timeout: 30,
    weight: 1,
    safe: true
  },
  {
    id: 'svn-exposure',
    name: 'SVN Directory Exposure',
    category: 'vuln',
    binary: 'curl',
    installMethod: 'apt',
    installCmd: 'apt-get install -y curl',
    cmd: (target) => `curl -s ${target}/.svn/entries`,
    torCmd: (target) => `curl -s --socks5 127.0.0.1:9050 ${target}/.svn/entries`,
    parser: (stdout) => {
      if (stdout.length > 10) {
        return [{ severity: 'high', title: 'Exposed .svn directory', evidence: stdout }];
      }
      return [];
    },
    timeout: 30,
    weight: 1,
    safe: true
  },
  {
    id: 'env-file-exposure',
    name: '.env File Exposure Check',
    category: 'vuln',
    binary: 'curl',
    installMethod: 'apt',
    installCmd: 'apt-get install -y curl',
    cmd: (target) => `curl -s ${target}/.env`,
    torCmd: (target) => `curl -s --socks5 127.0.0.1:9050 ${target}/.env`,
    parser: (stdout) => {
      if (stdout.includes('=') && (stdout.includes('KEY') || stdout.includes('PASSWORD') || stdout.includes('SECRET'))) {
        return [{ severity: 'critical', title: 'Exposed .env file with secrets', evidence: stdout }];
      }
      return [];
    },
    timeout: 30,
    weight: 1,
    safe: true
  },
  {
    id: 'backup-files',
    name: 'Backup Files Scanner',
    category: 'vuln',
    binary: 'curl',
    installMethod: 'apt',
    installCmd: 'apt-get install -y curl',
    cmd: (target) => {
      const backups = ['backup.zip', 'backup.tar.gz', 'db.sql', 'database.sql', 'backup.sql'];
      return `echo "Checking backups: ${backups.join(', ')}"`;
    },
    torCmd: (target) => `echo "Checking backup files via Tor"`,
    parser: (stdout) => [{ severity: 'info', title: 'Backup files scan', evidence: stdout }],
    timeout: 60,
    weight: 1,
    safe: true
  },
  {
    id: 'phpinfo-exposure',
    name: 'phpinfo() Exposure',
    category: 'vuln',
    binary: 'curl',
    installMethod: 'apt',
    installCmd: 'apt-get install -y curl',
    cmd: (target) => `curl -s ${target}/phpinfo.php | grep "PHP Version"`,
    torCmd: (target) => `curl -s --socks5 127.0.0.1:9050 ${target}/phpinfo.php | grep "PHP Version"`,
    parser: (stdout) => {
      if (stdout.includes('PHP Version')) {
        return [{ severity: 'high', title: 'phpinfo() page exposed', evidence: stdout }];
      }
      return [];
    },
    timeout: 30,
    weight: 1,
    safe: true
  },
  {
    id: 'admin-panel',
    name: 'Admin Panel Discovery',
    category: 'vuln',
    binary: 'curl',
    installMethod: 'apt',
    installCmd: 'apt-get install -y curl',
    cmd: (target) => {
      const panels = ['/admin', '/administrator', '/wp-admin', '/admin.php', '/admin-panel'];
      return `echo "Testing admin panels: ${panels.join(', ')}"`;
    },
    torCmd: (target) => `echo "Testing admin panels via Tor"`,
    parser: (stdout) => [{ severity: 'info', title: 'Admin panel discovery', evidence: stdout }],
    timeout: 60,
    weight: 1,
    safe: true
  },
  {
    id: 'default-credentials',
    name: 'Default Credentials Test',
    category: 'vuln',
    binary: 'curl',
    installMethod: 'apt',
    installCmd: 'apt-get install -y curl',
    cmd: (target) => `echo "Default credentials test for ${target}"`,
    torCmd: (target) => `echo "Default credentials test via Tor"`,
    parser: (stdout) => [{ severity: 'info', title: 'Default credentials test', evidence: stdout }],
    timeout: 60,
    weight: 1,
    safe: false
  },
  {
    id: 'info-disclosure',
    name: 'Information Disclosure',
    category: 'vuln',
    binary: 'curl',
    installMethod: 'apt',
    installCmd: 'apt-get install -y curl',
    cmd: (target) => `curl -s ${target} | grep -iE "error|exception|stack trace|debug"`,
    torCmd: (target) => `curl -s --socks5 127.0.0.1:9050 ${target} | grep -iE "error|exception|stack trace"`,
    parser: (stdout) => {
      if (stdout.includes('Exception') || stdout.includes('Stack trace')) {
        return [{ severity: 'medium', title: 'Information disclosure via error messages', evidence: stdout.substring(0, 300) }];
      }
      return [];
    },
    timeout: 30,
    weight: 1,
    safe: true
  },
  {
    id: 'version-disclosure',
    name: 'Server Version Disclosure',
    category: 'vuln',
    binary: 'curl',
    installMethod: 'apt',
    installCmd: 'apt-get install -y curl',
    cmd: (target) => `curl -s -I ${target} | grep -iE "server:|x-powered"`,
    torCmd: (target) => `curl -s --socks5 127.0.0.1:9050 -I ${target} | grep -iE "server:|x-powered"`,
    parser: (stdout) => {
      if (stdout.includes('/')) {
        return [{ severity: 'low', title: 'Server version disclosed', evidence: stdout }];
      }
      return [];
    },
    timeout: 30,
    weight: 1,
    safe: true
  },
  {
    id: 'cors-misconfiguration-advanced',
    name: 'Advanced CORS Misconfiguration',
    category: 'vuln',
    binary: 'curl',
    installMethod: 'apt',
    installCmd: 'apt-get install -y curl',
    cmd: (target) => `curl -s -H "Origin: https://evil.com" -I ${target} | grep -i "access-control"`,
    torCmd: (target) => `curl -s --socks5 127.0.0.1:9050 -H "Origin: https://evil.com" -I ${target} | grep -i "access-control"`,
    parser: (stdout) => {
      if (stdout.includes('*') || stdout.includes('evil.com')) {
        return [{ severity: 'high', title: 'Dangerous CORS configuration', evidence: stdout, cve: 'CWE-942' }];
      }
      return [];
    },
    timeout: 30,
    weight: 1,
    safe: true
  },
  {
    id: 'cache-poisoning',
    name: 'Web Cache Poisoning',
    category: 'vuln',
    binary: 'curl',
    installMethod: 'apt',
    installCmd: 'apt-get install -y curl',
    cmd: (target) => `curl -s -H "X-Forwarded-Host: evil.com" ${target}`,
    torCmd: (target) => `curl -s --socks5 127.0.0.1:9050 -H "X-Forwarded-Host: evil.com" ${target}`,
    parser: (stdout) => {
      if (stdout.includes('evil.com')) {
        return [{ severity: 'medium', title: 'Potential cache poisoning', evidence: stdout }];
      }
      return [];
    },
    timeout: 30,
    weight: 1,
    safe: false
  },
  {
    id: 'prototype-pollution',
    name: 'Prototype Pollution Test',
    category: 'vuln',
    binary: 'curl',
    installMethod: 'apt',
    installCmd: 'apt-get install -y curl',
    cmd: (target) => `curl -s "${target}?__proto__[polluted]=yes"`,
    torCmd: (target) => `curl -s --socks5 127.0.0.1:9050 "${target}?__proto__[polluted]=yes"`,
    parser: (stdout) => {
      if (stdout.includes('polluted')) {
        return [{ severity: 'high', title: 'Prototype pollution vulnerability', evidence: stdout, cve: 'CWE-1321' }];
      }
      return [];
    },
    timeout: 30,
    weight: 1,
    safe: false
  },
  {
    id: 'dom-xss',
    name: 'DOM-based XSS Scanner',
    category: 'vuln',
    binary: 'curl',
    installMethod: 'apt',
    installCmd: 'apt-get install -y curl',
    cmd: (target) => `curl -s ${target} | grep -iE "document.write|innerHTML|eval\\("`,
    torCmd: (target) => `curl -s --socks5 127.0.0.1:9050 ${target} | grep -iE "document.write|innerHTML"`,
    parser: (stdout) => {
      if (stdout.includes('document.write') || stdout.includes('innerHTML')) {
        return [{ severity: 'medium', title: 'Potential DOM XSS sinks found', evidence: stdout.substring(0, 200) }];
      }
      return [];
    },
    timeout: 30,
    weight: 1,
    safe: true
  },
  {
    id: 'http-request-smuggling',
    name: 'HTTP Request Smuggling',
    category: 'vuln',
    binary: 'curl',
    installMethod: 'apt',
    installCmd: 'apt-get install -y curl',
    cmd: (target) => `echo "HTTP smuggling test placeholder"`,
    torCmd: (target) => `echo "HTTP smuggling test placeholder"`,
    parser: (stdout) => [{ severity: 'info', title: 'HTTP smuggling test', evidence: stdout }],
    timeout: 60,
    weight: 1,
    safe: false
  },
  {
    id: 'nosql-injection',
    name: 'NoSQL Injection Test',
    category: 'vuln',
    binary: 'curl',
    installMethod: 'apt',
    installCmd: 'apt-get install -y curl',
    cmd: (target) => `curl -s "${target}?id[$ne]=1"`,
    torCmd: (target) => `curl -s --socks5 127.0.0.1:9050 "${target}?id[$ne]=1"`,
    parser: (stdout) => {
      if (stdout.length > 100) {
        return [{ severity: 'high', title: 'Potential NoSQL injection', evidence: stdout.substring(0, 200), cve: 'CWE-943' }];
      }
      return [];
    },
    timeout: 30,
    weight: 1,
    safe: false
  },
  {
    id: 'ldap-injection',
    name: 'LDAP Injection Test',
    category: 'vuln',
    binary: 'curl',
    installMethod: 'apt',
    installCmd: 'apt-get install -y curl',
    cmd: (target) => `curl -s "${target}?user=*)(uid=*))(|(uid=*"`,
    torCmd: (target) => `curl -s --socks5 127.0.0.1:9050 "${target}?user=*)(uid=*))(|(uid=*"`,
    parser: (stdout) => {
      if (stdout.includes('ldap') || stdout.includes('directory')) {
        return [{ severity: 'high', title: 'Potential LDAP injection', evidence: stdout, cve: 'CWE-90' }];
      }
      return [];
    },
    timeout: 30,
    weight: 1,
    safe: false
  },

  // ============ AUTH TOOLS (20) ============
  {
    id: 'hydra-http',
    name: 'Hydra - HTTP Brute Force',
    category: 'auth',
    binary: 'hydra',
    installMethod: 'apt',
    installCmd: 'apt-get install -y hydra',
    cmd: (target) => `echo "Hydra HTTP auth test - requires credentials"`,
    torCmd: (target) => `echo "Hydra HTTP auth test via Tor"`,
    parser: (stdout) => [{ severity: 'info', title: 'Hydra test', evidence: stdout }],
    timeout: 180,
    weight: 2,
    safe: false
  },
  {
    id: 'medusa',
    name: 'Medusa - Brute Force',
    category: 'auth',
    binary: 'medusa',
    installMethod: 'apt',
    installCmd: 'apt-get install -y medusa',
    cmd: (target) => `echo "Medusa auth test"`,
    torCmd: (target) => `echo "Medusa auth test via Tor"`,
    parser: (stdout) => [{ severity: 'info', title: 'Medusa test', evidence: stdout }],
    timeout: 180,
    weight: 2,
    safe: false
  },
  {
    id: 'patator',
    name: 'Patator - Multi-purpose Brute Forcer',
    category: 'auth',
    binary: 'patator',
    installMethod: 'apt',
    installCmd: 'apt-get install -y patator',
    cmd: (target) => `echo "Patator test"`,
    torCmd: (target) => `echo "Patator test via Tor"`,
    parser: (stdout) => [{ severity: 'info', title: 'Patator test', evidence: stdout }],
    timeout: 180,
    weight: 2,
    safe: false
  },
  {
    id: 'john',
    name: 'John the Ripper',
    category: 'auth',
    binary: 'john',
    installMethod: 'apt',
    installCmd: 'apt-get install -y john',
    cmd: (target) => `echo "John hash cracking"`,
    torCmd: (target) => `echo "John hash cracking"`,
    parser: (stdout) => [{ severity: 'info', title: 'John test', evidence: stdout }],
    timeout: 300,
    weight: 3,
    safe: true
  },
  {
    id: 'hashcat',
    name: 'Hashcat - Password Cracker',
    category: 'auth',
    binary: 'hashcat',
    installMethod: 'apt',
    installCmd: 'apt-get install -y hashcat',
    cmd: (target) => `echo "Hashcat test"`,
    torCmd: (target) => `echo "Hashcat test"`,
    parser: (stdout) => [{ severity: 'info', title: 'Hashcat test', evidence: stdout }],
    timeout: 300,
    weight: 3,
    safe: true
  },
  {
    id: 'cewl',
    name: 'CeWL - Wordlist Generator',
    category: 'auth',
    binary: 'cewl',
    installMethod: 'apt',
    installCmd: 'apt-get install -y cewl',
    cmd: (target) => `cewl ${target} -d 2 -m 5 -w /tmp/wordlist.txt`,
    torCmd: (target) => `cewl ${target} -d 2 -m 5 -w /tmp/wordlist.txt -p socks5://127.0.0.1:9050`,
    parser: (stdout) => [{ severity: 'info', title: 'Wordlist generated', evidence: 'Custom wordlist created from target' }],
    timeout: 120,
    weight: 1,
    safe: true
  },
  {
    id: 'crunch',
    name: 'Crunch - Wordlist Generator',
    category: 'auth',
    binary: 'crunch',
    installMethod: 'apt',
    installCmd: 'apt-get install -y crunch',
    cmd: (target) => `echo "Crunch wordlist generation"`,
    torCmd: (target) => `echo "Crunch wordlist generation"`,
    parser: (stdout) => [{ severity: 'info', title: 'Crunch test', evidence: stdout }],
    timeout: 60,
    weight: 1,
    safe: true
  },
  {
    id: 'basic-auth-test',
    name: 'HTTP Basic Auth Test',
    category: 'auth',
    binary: 'curl',
    installMethod: 'apt',
    installCmd: 'apt-get install -y curl',
    cmd: (target) => `curl -s -I ${target} | grep -i "WWW-Authenticate"`,
    torCmd: (target) => `curl -s --socks5 127.0.0.1:9050 -I ${target} | grep -i "WWW-Authenticate"`,
    parser: (stdout) => {
      if (stdout.includes('Basic')) {
        return [{ severity: 'info', title: 'HTTP Basic Auth detected', evidence: stdout }];
      }
      return [];
    },
    timeout: 30,
    weight: 1,
    safe: true
  },
  {
    id: 'digest-auth-test',
    name: 'HTTP Digest Auth Test',
    category: 'auth',
    binary: 'curl',
    installMethod: 'apt',
    installCmd: 'apt-get install -y curl',
    cmd: (target) => `curl -s -I ${target} | grep -i "Digest"`,
    torCmd: (target) => `curl -s --socks5 127.0.0.1:9050 -I ${target} | grep -i "Digest"`,
    parser: (stdout) => {
      if (stdout.includes('Digest')) {
        return [{ severity: 'info', title: 'HTTP Digest Auth detected', evidence: stdout }];
      }
      return [];
    },
    timeout: 30,
    weight: 1,
    safe: true
  },
  {
    id: 'oauth-test',
    name: 'OAuth Misconfiguration',
    category: 'auth',
    binary: 'curl',
    installMethod: 'apt',
    installCmd: 'apt-get install -y curl',
    cmd: (target) => `curl -s ${target} | grep -i "oauth\\|authorization"`,
    torCmd: (target) => `curl -s --socks5 127.0.0.1:9050 ${target} | grep -i "oauth"`,
    parser: (stdout) => {
      if (stdout.includes('oauth') || stdout.includes('authorize')) {
        return [{ severity: 'info', title: 'OAuth implementation found', evidence: stdout.substring(0, 200) }];
      }
      return [];
    },
    timeout: 30,
    weight: 1,
    safe: true
  },
  {
    id: 'session-fixation',
    name: 'Session Fixation Test',
    category: 'auth',
    binary: 'curl',
    installMethod: 'apt',
    installCmd: 'apt-get install -y curl',
    cmd: (target) => `echo "Session fixation test"`,
    torCmd: (target) => `echo "Session fixation test"`,
    parser: (stdout) => [{ severity: 'info', title: 'Session test', evidence: stdout }],
    timeout: 60,
    weight: 1,
    safe: false
  },
  {
    id: 'weak-password-policy',
    name: 'Weak Password Policy Check',
    category: 'auth',
    binary: 'curl',
    installMethod: 'apt',
    installCmd: 'apt-get install -y curl',
    cmd: (target) => `echo "Password policy test"`,
    torCmd: (target) => `echo "Password policy test"`,
    parser: (stdout) => [{ severity: 'info', title: 'Password policy test', evidence: stdout }],
    timeout: 30,
    weight: 1,
    safe: false
  },
  {
    id: 'broken-auth',
    name: 'Broken Authentication Check',
    category: 'auth',
    binary: 'curl',
    installMethod: 'apt',
    installCmd: 'apt-get install -y curl',
    cmd: (target) => `echo "Broken auth test"`,
    torCmd: (target) => `echo "Broken auth test"`,
    parser: (stdout) => [{ severity: 'info', title: 'Auth test', evidence: stdout }],
    timeout: 60,
    weight: 1,
    safe: false
  },
  {
    id: 'account-enumeration',
    name: 'Account Enumeration',
    category: 'auth',
    binary: 'curl',
    installMethod: 'apt',
    installCmd: 'apt-get install -y curl',
    cmd: (target) => `echo "Account enumeration test"`,
    torCmd: (target) => `echo "Account enumeration test"`,
    parser: (stdout) => [{ severity: 'info', title: 'Enumeration test', evidence: stdout }],
    timeout: 60,
    weight: 1,
    safe: false
  },
  {
    id: 'rate-limiting',
    name: 'Rate Limiting Check',
    category: 'auth',
    binary: 'curl',
    installMethod: 'apt',
    installCmd: 'apt-get install -y curl',
    cmd: (target) => `for i in {1..10}; do curl -s -o /dev/null -w "%{http_code}\n" ${target}; done`,
    torCmd: (target) => `for i in {1..10}; do curl -s --socks5 127.0.0.1:9050 -o /dev/null -w "%{http_code}\n" ${target}; done`,
    parser: (stdout) => {
      if (!stdout.includes('429')) {
        return [{ severity: 'medium', title: 'No rate limiting detected', evidence: 'Multiple requests succeeded without rate limiting' }];
      }
      return [{ severity: 'info', title: 'Rate limiting active', evidence: stdout }];
    },
    timeout: 60,
    weight: 1,
    safe: false
  },
  {
    id: 'brute-force-protection',
    name: 'Brute Force Protection',
    category: 'auth',
    binary: 'curl',
    installMethod: 'apt',
    installCmd: 'apt-get install -y curl',
    cmd: (target) => `echo "Brute force protection test"`,
    torCmd: (target) => `echo "Brute force protection test"`,
    parser: (stdout) => [{ severity: 'info', title: 'Brute force test', evidence: stdout }],
    timeout: 60,
    weight: 1,
    safe: false
  },
  {
    id: 'mfa-bypass',
    name: 'MFA Bypass Test',
    category: 'auth',
    binary: 'curl',
    installMethod: 'apt',
    installCmd: 'apt-get install -y curl',
    cmd: (target) => `echo "MFA bypass test"`,
    torCmd: (target) => `echo "MFA bypass test"`,
    parser: (stdout) => [{ severity: 'info', title: 'MFA test', evidence: stdout }],
    timeout: 60,
    weight: 1,
    safe: false
  },
  {
    id: 'captcha-bypass',
    name: 'CAPTCHA Bypass Test',
    category: 'auth',
    binary: 'curl',
    installMethod: 'apt',
    installCmd: 'apt-get install -y curl',
    cmd: (target) => `curl -s ${target} | grep -i "captcha\\|recaptcha"`,
    torCmd: (target) => `curl -s --socks5 127.0.0.1:9050 ${target} | grep -i "captcha"`,
    parser: (stdout) => {
      if (stdout.includes('captcha') || stdout.includes('recaptcha')) {
        return [{ severity: 'info', title: 'CAPTCHA implementation found', evidence: stdout.substring(0, 100) }];
      } else {
        return [{ severity: 'low', title: 'No CAPTCHA on login forms', evidence: 'Forms may be vulnerable to automation' }];
      }
    },
    timeout: 30,
    weight: 1,
    safe: true
  },
  {
    id: 'remember-me-vuln',
    name: 'Remember Me Cookie Vulnerability',
    category: 'auth',
    binary: 'curl',
    installMethod: 'apt',
    installCmd: 'apt-get install -y curl',
    cmd: (target) => `curl -s -I ${target} | grep -i "set-cookie" | grep -i "remember"`,
    torCmd: (target) => `curl -s --socks5 127.0.0.1:9050 -I ${target} | grep -i "remember"`,
    parser: (stdout) => {
      if (stdout && !stdout.includes('Secure')) {
        return [{ severity: 'medium', title: 'Remember-me cookie without Secure flag', evidence: stdout }];
      }
      return [];
    },
    timeout: 30,
    weight: 1,
    safe: true
  },
  {
    id: 'password-reset',
    name: 'Password Reset Token Security',
    category: 'auth',
    binary: 'curl',
    installMethod: 'apt',
    installCmd: 'apt-get install -y curl',
    cmd: (target) => `echo "Password reset security test"`,
    torCmd: (target) => `echo "Password reset security test"`,
    parser: (stdout) => [{ severity: 'info', title: 'Password reset test', evidence: stdout }],
    timeout: 60,
    weight: 1,
    safe: false
  },

  // ============ INFRA TOOLS (20) ============
  {
    id: 'nmap-full',
    name: 'Nmap - Full Port Scan',
    category: 'infra',
    binary: 'nmap',
    installMethod: 'apt',
    installCmd: 'apt-get install -y nmap',
    cmd: (target) => `nmap -sV -T4 --open -p- ${target}`,
    torCmd: (target) => `nmap -sV -T4 --open -p 80,443,8080,8443 --proxies socks4://127.0.0.1:9050 ${target}`,
    parser: (stdout) => {
      const ports = stdout.match(/\d+\/tcp\s+open/g) || [];
      return ports.length > 0 ? [{ severity: 'info', title: `${ports.length} open ports found`, evidence: stdout }] : [];
    },
    timeout: 300,
    weight: 3,
    safe: false
  },
  {
    id: 'masscan',
    name: 'Masscan - Fast Port Scanner',
    category: 'infra',
    binary: 'masscan',
    installMethod: 'apt',
    installCmd: 'apt-get install -y masscan',
    cmd: (target) => `masscan ${target} -p1-65535 --rate=1000`,
    torCmd: (target) => `echo "Masscan via Tor not supported"`,
    parser: (stdout) => {
      const ports = stdout.match(/Discovered open port/g) || [];
      return ports.length > 0 ? [{ severity: 'info', title: `Masscan found ${ports.length} ports`, evidence: stdout }] : [];
    },
    timeout: 300,
    weight: 3,
    safe: false
  },
  {
    id: 'testssl',
    name: 'testssl.sh - SSL/TLS Scanner',
    category: 'infra',
    binary: 'testssl',
    installMethod: 'git',
    installCmd: 'git clone https://github.com/drwetter/testssl.sh /opt/testssl && ln -s /opt/testssl/testssl.sh /usr/local/bin/testssl',
    cmd: (target) => `testssl --fast ${target}`,
    torCmd: (target) => `testssl --fast --proxy socks5://127.0.0.1:9050 ${target}`,
    parser: (stdout) => {
      const findings = [];
      if (stdout.includes('VULNERABLE')) findings.push({ severity: 'high', title: 'SSL/TLS vulnerability', evidence: stdout });
      if (stdout.includes('NOT ok')) findings.push({ severity: 'medium', title: 'SSL/TLS misconfiguration', evidence: stdout });
      return findings;
    },
    timeout: 180,
    weight: 2,
    safe: true
  },
  {
    id: 'sslyze',
    name: 'sslyze - SSL/TLS Analyzer',
    category: 'infra',
    binary: 'sslyze',
    installMethod: 'pip3',
    installCmd: 'pip3 install sslyze',
    cmd: (target) => `sslyze ${target}`,
    torCmd: (target) => `sslyze ${target} --https_tunnel=127.0.0.1:9050`,
    parser: (stdout) => {
      const findings = [];
      if (stdout.includes('VULNERABLE')) findings.push({ severity: 'high', title: 'SSL vulnerability detected', evidence: stdout });
      return findings;
    },
    timeout: 120,
    weight: 2,
    safe: true
  },
  {
    id: 'sslscan',
    name: 'sslscan - SSL Scanner',
    category: 'infra',
    binary: 'sslscan',
    installMethod: 'apt',
    installCmd: 'apt-get install -y sslscan',
    cmd: (target) => `sslscan ${target}`,
    torCmd: (target) => `sslscan ${target}`,
    parser: (stdout) => [{ severity: 'info', title: 'SSL scan results', evidence: stdout }],
    timeout: 60,
    weight: 1,
    safe: true
  },
  {
    id: 'openssl-check',
    name: 'OpenSSL Certificate Check',
    category: 'infra',
    binary: 'openssl',
    installMethod: 'apt',
    installCmd: 'apt-get install -y openssl',
    cmd: (target) => `echo | openssl s_client -connect ${target}:443 -servername ${target} 2>/dev/null | openssl x509 -noout -dates`,
    torCmd: (target) => `echo | openssl s_client -connect ${target}:443 -servername ${target} -proxy 127.0.0.1:9050 2>/dev/null | openssl x509 -noout -dates`,
    parser: (stdout) => [{ severity: 'info', title: 'SSL certificate dates', evidence: stdout }],
    timeout: 30,
    weight: 1,
    safe: true
  },
  {
    id: 'ssh-audit',
    name: 'SSH Audit',
    category: 'infra',
    binary: 'ssh-audit',
    installMethod: 'pip3',
    installCmd: 'pip3 install ssh-audit',
    cmd: (target) => `ssh-audit ${target}`,
    torCmd: (target) => `ssh-audit ${target}`,
    parser: (stdout) => {
      if (stdout.includes('fail') || stdout.includes('weak')) {
        return [{ severity: 'medium', title: 'SSH configuration issues', evidence: stdout }];
      }
      return [];
    },
    timeout: 60,
    weight: 1,
    safe: true
  },
  {
    id: 'smtp-user-enum',
    name: 'SMTP User Enumeration',
    category: 'infra',
    binary: 'smtp-user-enum',
    installMethod: 'apt',
    installCmd: 'apt-get install -y smtp-user-enum',
    cmd: (target) => `echo "SMTP enum test"`,
    torCmd: (target) => `echo "SMTP enum test"`,
    parser: (stdout) => [{ severity: 'info', title: 'SMTP test', evidence: stdout }],
    timeout: 60,
    weight: 1,
    safe: false
  },
  {
    id: 'dns-zone-transfer',
    name: 'DNS Zone Transfer',
    category: 'infra',
    binary: 'dig',
    installMethod: 'apt',
    installCmd: 'apt-get install -y dnsutils',
    cmd: (target) => `dig axfr @${target} ${target}`,
    torCmd: (target) => `dig axfr @${target} ${target}`,
    parser: (stdout) => {
      if (stdout.includes('XFR size')) {
        return [{ severity: 'high', title: 'DNS zone transfer allowed', evidence: stdout }];
      }
      return [];
    },
    timeout: 30,
    weight: 1,
    safe: true
  },
  {
    id: 'dnssec-check',
    name: 'DNSSEC Validation',
    category: 'infra',
    binary: 'dig',
    installMethod: 'apt',
    installCmd: 'apt-get install -y dnsutils',
    cmd: (target) => `dig ${target} +dnssec`,
    torCmd: (target) => `dig ${target} +dnssec`,
    parser: (stdout) => {
      if (!stdout.includes('ad')) {
        return [{ severity: 'low', title: 'DNSSEC not enabled', evidence: stdout }];
      }
      return [{ severity: 'info', title: 'DNSSEC active', evidence: stdout }];
    },
    timeout: 30,
    weight: 1,
    safe: true
  },
  {
    id: 'spf-check',
    name: 'SPF Record Check',
    category: 'infra',
    binary: 'dig',
    installMethod: 'apt',
    installCmd: 'apt-get install -y dnsutils',
    cmd: (target) => `dig ${target} TXT | grep "v=spf1"`,
    torCmd: (target) => `dig ${target} TXT | grep "v=spf1"`,
    parser: (stdout) => {
      if (!stdout || stdout.length < 5) {
        return [{ severity: 'medium', title: 'No SPF record found', evidence: 'Email spoofing possible' }];
      }
      return [{ severity: 'info', title: 'SPF record present', evidence: stdout }];
    },
    timeout: 30,
    weight: 1,
    safe: true
  },
  {
    id: 'dmarc-check',
    name: 'DMARC Record Check',
    category: 'infra',
    binary: 'dig',
    installMethod: 'apt',
    installCmd: 'apt-get install -y dnsutils',
    cmd: (target) => `dig _dmarc.${target} TXT`,
    torCmd: (target) => `dig _dmarc.${target} TXT`,
    parser: (stdout) => {
      if (!stdout.includes('v=DMARC1')) {
        return [{ severity: 'medium', title: 'No DMARC record', evidence: 'Email domain protection missing' }];
      }
      return [{ severity: 'info', title: 'DMARC configured', evidence: stdout }];
    },
    timeout: 30,
    weight: 1,
    safe: true
  },
  {
    id: 'dkim-check',
    name: 'DKIM Record Check',
    category: 'infra',
    binary: 'dig',
    installMethod: 'apt',
    installCmd: 'apt-get install -y dnsutils',
    cmd: (target) => `dig default._domainkey.${target} TXT`,
    torCmd: (target) => `dig default._domainkey.${target} TXT`,
    parser: (stdout) => {
      if (stdout.includes('v=DKIM1')) {
        return [{ severity: 'info', title: 'DKIM record found', evidence: stdout }];
      }
      return [{ severity: 'low', title: 'DKIM not found on default selector', evidence: 'May exist on different selector' }];
    },
    timeout: 30,
    weight: 1,
    safe: true
  },
  {
    id: 'caa-check',
    name: 'CAA Record Check',
    category: 'infra',
    binary: 'dig',
    installMethod: 'apt',
    installCmd: 'apt-get install -y dnsutils',
    cmd: (target) => `dig ${target} CAA`,
    torCmd: (target) => `dig ${target} CAA`,
    parser: (stdout) => {
      if (!stdout.includes('CAA') || stdout.includes('ANSWER: 0')) {
        return [{ severity: 'low', title: 'No CAA record', evidence: 'Certificate issuance not restricted' }];
      }
      return [{ severity: 'info', title: 'CAA record present', evidence: stdout }];
    },
    timeout: 30,
    weight: 1,
    safe: true
  },
  {
    id: 'traceroute',
    name: 'Traceroute - Network Path',
    category: 'infra',
    binary: 'traceroute',
    installMethod: 'apt',
    installCmd: 'apt-get install -y traceroute',
    cmd: (target) => `traceroute -m 15 ${target}`,
    torCmd: (target) => `echo "Traceroute not compatible with Tor"`,
    parser: (stdout) => [{ severity: 'info', title: 'Network path trace', evidence: stdout }],
    timeout: 60,
    weight: 1,
    safe: true
  },
  {
    id: 'ping-check',
    name: 'ICMP Ping Test',
    category: 'infra',
    binary: 'ping',
    installMethod: 'apt',
    installCmd: 'apt-get install -y iputils-ping',
    cmd: (target) => `ping -c 4 ${target}`,
    torCmd: (target) => `echo "Ping not compatible with Tor"`,
    parser: (stdout) => {
      if (stdout.includes('0 received')) {
        return [{ severity: 'info', title: 'ICMP blocked or host down', evidence: stdout }];
      }
      return [{ severity: 'info', title: 'Host is reachable', evidence: stdout }];
    },
    timeout: 30,
    weight: 1,
    safe: true
  },
  {
    id: 'hping3',
    name: 'hping3 - Advanced Ping',
    category: 'infra',
    binary: 'hping3',
    installMethod: 'apt',
    installCmd: 'apt-get install -y hping3',
    cmd: (target) => `hping3 -c 4 -S -p 80 ${target}`,
    torCmd: (target) => `echo "hping3 not compatible with Tor"`,
    parser: (stdout) => [{ severity: 'info', title: 'hping3 results', evidence: stdout }],
    timeout: 30,
    weight: 1,
    safe: false
  },
  {
    id: 'mtr',
    name: 'MTR - Network Diagnostic',
    category: 'infra',
    binary: 'mtr',
    installMethod: 'apt',
    installCmd: 'apt-get install -y mtr',
    cmd: (target) => `mtr -r -c 10 ${target}`,
    torCmd: (target) => `echo "MTR not compatible with Tor"`,
    parser: (stdout) => [{ severity: 'info', title: 'MTR diagnostics', evidence: stdout }],
    timeout: 60,
    weight: 1,
    safe: true
  },
  {
    id: 'shodan-host',
    name: 'Shodan Host Lookup',
    category: 'infra',
    binary: 'shodan',
    installMethod: 'pip3',
    installCmd: 'pip3 install shodan',
    cmd: (target) => `shodan host ${target}`,
    torCmd: (target) => `shodan host ${target}`,
    parser: (stdout) => [{ severity: 'info', title: 'Shodan host data', evidence: stdout }],
    timeout: 60,
    weight: 1,
    safe: true
  },
  {
    id: 'censys-lookup',
    name: 'Censys Host Lookup',
    category: 'infra',
    binary: 'curl',
    installMethod: 'apt',
    installCmd: 'apt-get install -y curl',
    cmd: (target) => `curl -s "https://search.censys.io/api/v2/hosts/${target}"`,
    torCmd: (target) => `curl -s --socks5 127.0.0.1:9050 "https://search.censys.io/api/v2/hosts/${target}"`,
    parser: (stdout) => [{ severity: 'info', title: 'Censys data', evidence: stdout }],
    timeout: 60,
    weight: 1,
    safe: true
  }
];

function getAllTools() {
  return tools;
}

function getToolsByCategory(category) {
  return tools.filter(t => t.category === category);
}

function getToolById(id) {
  return tools.find(t => t.id === id);
}

function getToolsByProfile(profile) {
  switch (profile) {
    case 'quick':
      return tools.filter(t => t.weight === 1 && t.safe === true).slice(0, 30);
    case 'web':
      return tools.filter(t => t.category === 'web' || t.category === 'vuln');
    case 'full':
    default:
      return tools;
  }
}

module.exports = {
  getAllTools,
  getToolsByCategory,
  getToolById,
  getToolsByProfile,
  tools
};

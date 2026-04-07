const { spawn } = require('child_process');
const os = require('os');

const nextBin = require.resolve('next/dist/bin/next');

function getLanIpv4() {
  const ifaces = os.networkInterfaces();
  const addresses = [];
  
  for (const [name, entries] of Object.entries(ifaces)) {
    for (const info of entries || []) {
      if (!info || info.internal) continue;
      // family can be 'IPv4' or 4
      if (info.family !== 'IPv4' && info.family !== 4) continue;
      
      let score = 0;
      const lowerName = name.toLowerCase();
      
      // Prioritize common physical interface names
      if (lowerName.includes('wi-fi') || lowerName.includes('wifi') || lowerName.includes('wlan')) score += 10;
      if (lowerName.includes('ethernet')) score += 5;
      
      // Windows Hotspot often shows up as "Local Area Connection* X"
      if (lowerName.includes('local area connection')) score += 15;
      
      // Windows default Hotspot subnet is often 192.168.137.x
      if (info.address.startsWith('192.168.137.')) score += 20;

      // Deprioritize virtual/tunnel interfaces
      if (lowerName.includes('virtual') || lowerName.includes('vbox') || 
          lowerName.includes('docker') || lowerName.includes('wsl') || 
          lowerName.includes('vmware') || lowerName.includes('zerotier') ||
          lowerName.includes('tailscale') || lowerName.includes('vpn')) score -= 30;

      addresses.push({ address: info.address, score, name });
    }
  }
  
  if (addresses.length === 0) return null;
  
  // Sort by score descending, then by address name as a tiebreaker
  addresses.sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
  return addresses[0].address;
}

const port = String((process.env.PORT || '').trim() || '3000');
const lanIp = getLanIpv4();

// Bind to all interfaces so BOTH work:
// - http://localhost:<port> on your PC
// - http://<LAN_IP>:<port> on your phone (same Wi‑Fi)
// Note: 0.0.0.0 is only a bind address (not the URL you open in the browser).
const bindHost = '0.0.0.0';

const args = [nextBin, 'dev', '--webpack', '-H', bindHost, '-p', port];
const child = spawn(process.execPath, args, {
  // Use pipes so we can rewrite the displayed Network URL (0.0.0.0 -> LAN IP),
  // but force color so output stays colored even though it's not a TTY.
  stdio: ['inherit', 'pipe', 'pipe'],
  env: { ...process.env, FORCE_COLOR: process.env.FORCE_COLOR || '1' },
});

function pipeWithNetworkRewrite(stream, targetStream) {
  if (!stream) return;
  stream.setEncoding('utf8');
  let buf = '';
  stream.on('data', (chunk) => {
    buf += chunk;
    const parts = buf.split(/\r?\n/);
    buf = parts.pop() ?? '';
    for (const line of parts) {
      let out = line;
      if (lanIp) {
        // 1. Replace 0.0.0.0 if present
        out = out.replaceAll('0.0.0.0', lanIp);
        // 2. Force Network URL to use IPv4 even if Next.js prints IPv6 or something else
        if (out.toLowerCase().includes('network:')) {
          out = out.replace(/(https?:\/\/)([^\s:]+)(:\d+)?/, `$1${lanIp}$3`);
        }
      }
      targetStream.write(out + '\n');
    }
  });
  stream.on('end', () => {
    if (!buf) return;
    let out = buf;
    if (lanIp) {
      out = out.replaceAll('0.0.0.0', lanIp);
      if (out.toLowerCase().includes('network:')) {
        out = out.replace(/(https?:\/\/)([^\s:]+)(:\d+)?/, `$1${lanIp}$3`);
      }
    }
    targetStream.write(out);
  });
}

pipeWithNetworkRewrite(child.stdout, process.stdout);
pipeWithNetworkRewrite(child.stderr, process.stderr);

child.on('exit', (code, signal) => {
  if (signal) process.exit(1);
  process.exit(code ?? 1);
});

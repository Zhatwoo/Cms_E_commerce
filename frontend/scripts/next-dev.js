const { spawn } = require('child_process');
const os = require('os');

const nextBin = require.resolve('next/dist/bin/next');

function getLanIpv4() {
  const ifaces = os.networkInterfaces();
  for (const entries of Object.values(ifaces)) {
    for (const info of entries || []) {
      if (!info) continue;
      if (info.family !== 'IPv4') continue;
      if (info.internal) continue;
      return info.address;
    }
  }
  return null;
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
      const out = lanIp ? line.replaceAll('0.0.0.0', lanIp) : line;
      targetStream.write(out + '\n');
    }
  });
  stream.on('end', () => {
    if (!buf) return;
    const out = lanIp ? buf.replaceAll('0.0.0.0', lanIp) : buf;
    targetStream.write(out);
  });
}

pipeWithNetworkRewrite(child.stdout, process.stdout);
pipeWithNetworkRewrite(child.stderr, process.stderr);

child.on('exit', (code, signal) => {
  if (signal) process.exit(1);
  process.exit(code ?? 1);
});

const { spawn } = require('child_process');
const os = require('os');
const net = require('net');

function getLocalIp() {
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net && net.family === 'IPv4' && !net.internal) {
        return net.address;
      }
    }
  }
  return 'localhost';
}

function parsePortArg() {
  const args = process.argv.slice(2);
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--port' || arg === '-p') {
      return parseInt(args[i + 1], 10);
    }
    if (arg.startsWith('--port=')) {
      return parseInt(arg.split('=')[1], 10);
    }
    if (arg.startsWith('-p')) {
      return parseInt(arg.slice(2), 10);
    }
  }
  return undefined;
}

function getAvailablePort(start) {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.unref();
    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        resolve(getAvailablePort(start + 1));
      } else {
        reject(err);
      }
    });
    server.listen(start, () => {
      const { port } = server.address();
      server.close(() => resolve(port));
    });
  });
}

async function start() {
  const desiredPort = parsePortArg() || parseInt(process.env.PORT, 10) || 3000;
  const port = await getAvailablePort(desiredPort);
  const ip = getLocalIp();

  const dev = spawn('next', ['dev', '--hostname', '0.0.0.0', '--port', port], {
    stdio: ['inherit', 'pipe', 'inherit'],
    shell: true,
  });

  dev.stdout.on('data', (data) => {
    const text = data.toString();
    process.stdout.write(text);
    if (text.includes('started server')) {
      console.log(`\n  ➜  Network: http://${ip}:${port}\n`);
    }
  });

  dev.on('close', (code) => process.exit(code));
}

start();

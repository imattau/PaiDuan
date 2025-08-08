const { spawn } = require('child_process');
const os = require('os');

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

const port = process.env.PORT || 3000;
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

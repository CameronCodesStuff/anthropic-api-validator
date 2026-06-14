const canvas = document.getElementById('particleCanvas');
const ctx = canvas.getContext('2d');

let particles = [];
const particleCount = 75;

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

class Particle {
    constructor() {
        this.reset();
        this.y = Math.random() * canvas.height;
    }
    reset() {
        this.x = Math.random() * canvas.width;
        this.y = -10;
        this.size = Math.random() * 2 + 0.5;
        this.speedY = Math.random() * 1.5 + 0.5;
        this.speedX = (Math.random() - 0.5) * 0.3;
        this.alpha = Math.random() * 0.5 + 0.2;
    }
    update() {
        this.y += this.speedY;
        this.x += this.speedX;
        if (this.y > canvas.height + 10) {
            this.reset();
        }
    }
    draw() {
        ctx.fillStyle = `rgba(255, 0, 68, ${this.alpha})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

for (let i = 0; i < particleCount; i++) {
    particles.push(new Particle());
}

function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let p of particles) {
        p.update();
        p.draw();
    }
    requestAnimationFrame(animate);
}
animate();

function updatePlaceholder() {
    const provider = document.getElementById('providerSelect').value;
    const input = document.getElementById('apiKey');
    if (provider === 'anthropic') input.placeholder = 'sk-ant-...';
    else if (provider === 'openai') input.placeholder = 'sk-proj-...';
    else if (provider === 'gemini') input.placeholder = 'AIzaSy...';
}

async function validateKey() {
    const provider = document.getElementById('providerSelect').value;
    const key = document.getElementById('apiKey').value.trim();
    const statusDiv = document.getElementById('status');
    const btn = document.getElementById('checkBtn');

    if (!key) {
        statusDiv.className = "status-display error";
        statusDiv.innerText = "CRITICAL: Key matrix string missing.";
        return;
    }

    btn.disabled = true;
    statusDiv.className = "status-display loading";
    statusDiv.innerText = `Pinging ${provider.toUpperCase()} nodes...`;

    let url = '';
    let config = { method: 'POST', headers: {} };

    if (provider === 'anthropic') {
        url = `https://corsproxy.io/?${encodeURIComponent('https://api.anthropic.com/v1/messages')}`;
        config.headers = {
            'x-api-key': key,
            'anthropic-version': '2023-06-01',
            'content-type': 'application/json'
        };
        config.body = JSON.stringify({
            model: 'claude-3-haiku-20240307',
            max_tokens: 1,
            messages: [{ role: 'user', content: 'Ping' }]
        });
    } else if (provider === 'openai') {
        url = 'https://api.openai.com/v1/models';
        config.method = 'GET';
        config.headers = {
            'Authorization': `Bearer ${key}`
        };
    } else if (provider === 'gemini') {
        url = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;
        config.method = 'GET';
    }

    try {
        const response = await fetch(url, config);
        const data = await response.json();

        if (response.ok) {
            statusDiv.className = "status-display success";
            statusDiv.innerHTML = `<strong>SUCCESS:</strong> Handshake complete. Key is valid.`;
        } else {
            statusDiv.className = "status-display error";
            let msg = 'Authentication rejected.';
            if (provider === 'anthropic' && data.error?.message) msg = data.error.message;
            else if (provider === 'openai' && data.error?.message) msg = data.error.message;
            else if (provider === 'gemini' && data.error?.message) msg = data.error.message;
            statusDiv.innerHTML = `<strong>FAILED:</strong> ${msg}`;
        }
    } catch (err) {
        statusDiv.className = "status-display error";
        statusDiv.innerHTML = `<strong>ERROR:</strong> Network handshake disrupted or blocked.`;
    } finally {
        btn.disabled = false;
    }
}

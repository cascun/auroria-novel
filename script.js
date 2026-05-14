const bedroom = document.getElementById("bedroom");
const landscape = document.getElementById("landscape");
const canvas = document.getElementById("rip-canvas");
const whiteout = document.getElementById("whiteout");
const secretCodeLayer = document.getElementById("secret-code-layer");
const scrollIndicator = document.getElementById("scroll-indicator");
const ctx = canvas.getContext("2d");

const dustCanvas = document.getElementById("dust-canvas");
const dustCtx = dustCanvas.getContext("2d");

let targetMouseX = 0;
let targetMouseY = 0;
let currentMouseX = 0;
let currentMouseY = 0;
let mouseX = window.innerWidth / 2;
let mouseY = window.innerHeight / 2;
let mouseActive = false;

const audioBedroom = document.getElementById("audio-bedroom");
const audioAuroria = document.getElementById("audio-auroria");
const audioRift = document.getElementById("audio-rift");
const audioToggle = document.getElementById("audio-toggle");
const iconMute = document.getElementById("icon-mute");
const iconPlay = document.getElementById("icon-play");
let audioEnabled = false;

const crackPaths = [
    [
        [0, -1],
        [0.02, -0.7],
        [-0.01, -0.44],
        [0.05, -0.18],
        [-0.02, 0.08],
        [0.03, 0.34],
        [-0.04, 0.66],
        [0.01, 1],
    ],
    [
        [0.02, -0.28],
        [0.2, -0.46],
        [0.4, -0.62],
        [0.67, -0.76],
        [0.93, -0.86],
    ],
    [
        [0, -0.08],
        [-0.19, -0.21],
        [-0.43, -0.27],
        [-0.7, -0.2],
        [-0.98, -0.3],
    ],
    [
        [0.02, 0.18],
        [0.22, 0.33],
        [0.45, 0.45],
        [0.69, 0.52],
        [0.98, 0.72],
    ],
    [
        [-0.01, 0.38],
        [-0.21, 0.53],
        [-0.42, 0.76],
        [-0.68, 0.88],
    ],
    [
        [0.05, -0.56],
        [-0.1, -0.72],
        [-0.2, -0.94],
    ],
    [
        [-0.02, 0.02],
        [0.2, 0],
        [0.39, -0.06],
        [0.61, 0.02],
    ],
];

function clamp(value, min = 0, max = 1) {
    return Math.min(max, Math.max(min, value));
}

function lerp(start, end, factor) {
    return start + (end - start) * factor;
}

function smoothstep(edge0, edge1, value) {
    const x = clamp((value - edge0) / (edge1 - edge0));
    return x * x * (3 - 2 * x);
}

function resizeCanvas() {
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    const width = window.innerWidth;
    const height = window.innerHeight;
    canvas.width = Math.floor(width * pixelRatio);
    canvas.height = Math.floor(height * pixelRatio);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

    dustCanvas.width = Math.floor(width * pixelRatio);
    dustCanvas.height = Math.floor(height * pixelRatio);
    dustCanvas.style.width = `${width}px`;
    dustCanvas.style.height = `${height}px`;
    dustCtx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

    initDust();
    drawRip(getScrollProgress());
}

function getScrollProgress() {
    const travel = window.innerHeight * 3.4;
    return clamp(window.scrollY / travel);
}

function drawPath(points, centerX, centerY, scaleX, scaleY, progress, width, alpha) {
    if (progress <= 0 || alpha <= 0) return;

    const visible = Math.max(2, Math.ceil(points.length * progress));
    ctx.beginPath();
    points.slice(0, visible).forEach(([x, y], index) => {
        const px = centerX + x * scaleX;
        const py = centerY + y * scaleY;
        if (index === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
    });

    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.shadowColor = `rgba(255, 255, 255, ${0.85 * alpha})`;
    ctx.shadowBlur = 22 * alpha;
    ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
    ctx.lineWidth = width;
    ctx.stroke();

    ctx.shadowBlur = 0;
    ctx.strokeStyle = `rgba(100, 225, 255, ${0.22 * alpha})`;
    ctx.lineWidth = width * 3.2;
    ctx.stroke();
}

function drawGlassCracks(centerX, centerY, scaleX, scaleY, progress, intensity) {
    crackPaths.forEach((path, index) => {
        const stagger = index * 0.08;
        const pathProgress = smoothstep(stagger, stagger + 0.58, progress);
        drawPath(path, centerX, centerY, scaleX, scaleY, pathProgress, 1.2 + intensity * 2.2, 0.18 + intensity * 0.75);
    });
}

function drawRift(centerX, centerY, width, height, openness, glow) {
    if (openness <= 0) return;

    const pointsLeft = [];
    const pointsRight = [];
    const segments = 18;

    for (let i = 0; i <= segments; i += 1) {
        const t = i / segments;
        const y = centerY - height / 2 + t * height;
        const wave = Math.sin(t * Math.PI * 5.5) * 0.18 + Math.sin(t * Math.PI * 13) * 0.08;
        const taper = Math.sin(t * Math.PI);
        const half = width * taper * (0.18 + openness * 0.82);
        pointsLeft.push([centerX - half + wave * width, y]);
        pointsRight.push([centerX + half + wave * width * 0.55, y]);
    }

    const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, Math.max(width, height) * 0.75);
    gradient.addColorStop(0, `rgba(255, 255, 255, ${0.95 * glow})`);
    gradient.addColorStop(0.35, `rgba(206, 246, 255, ${0.52 * glow})`);
    gradient.addColorStop(1, "rgba(255, 255, 255, 0)");

    ctx.save();
    ctx.globalCompositeOperation = "screen";
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.ellipse(centerX, centerY, width * 1.8, height * 0.62, -0.05, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowColor = "rgba(255,255,255,0.95)";
    ctx.shadowBlur = 34 + glow * 62;
    ctx.fillStyle = `rgba(255,255,255,${0.82 * glow})`;
    ctx.beginPath();
    pointsLeft.forEach(([x, y], index) => {
        if (index === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    });
    pointsRight.reverse().forEach(([x, y]) => ctx.lineTo(x, y));
    ctx.closePath();
    ctx.fill();
    ctx.restore();
}

function drawRip(progress) {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const centerX = width * 0.5;
    const centerY = height * 0.47;

    ctx.clearRect(0, 0, width, height);

    const crackBirth = smoothstep(0.02, 0.30, progress);
    const riftOpen = smoothstep(0.20, 0.55, progress);
    const engulf = smoothstep(0.45, 0.70, progress);
    const revealAuroria = smoothstep(0.65, 1, progress);
    const bedroomFade = smoothstep(0.40, 0.75, progress);
    const whiteoutFade = 1 - smoothstep(0.70, 1, progress);

    bedroom.style.opacity = 1 - bedroomFade * 0.88;
    if (secretCodeLayer) secretCodeLayer.style.opacity = 1 - bedroomFade * 0.88;
    dustCanvas.style.opacity = 1 - bedroomFade; // Fade out with the bedroom
    landscape.style.opacity = revealAuroria;
    whiteout.style.opacity = engulf * whiteoutFade;
    canvas.style.opacity = 1 - revealAuroria;

    const glow = document.getElementById("cursor-glow");
    if (glow && mouseActive) {
        glow.style.opacity = 1 - bedroomFade;
    }

    if (scrollIndicator) {
        // Fade out very quickly as soon as scrolling starts (by 2% progress)
        const indicatorFade = smoothstep(0, 0.02, progress);
        scrollIndicator.style.opacity = 1 - indicatorFade;
    }

    const scaleX = width * (0.03 + crackBirth * 0.22 + riftOpen * 0.08);
    const scaleY = height * (0.04 + crackBirth * 0.35 + riftOpen * 0.12);
    drawGlassCracks(centerX, centerY, scaleX, scaleY, crackBirth, crackBirth);

    const riftWidth = width * (0.01 + riftOpen * 0.3 + engulf * 0.9);
    const riftHeight = height * (0.06 + riftOpen * 0.94 + engulf * 0.7);
    drawRift(centerX, centerY, riftWidth, riftHeight, riftOpen, crackBirth + riftOpen + engulf);

    // Audio Crossfading
    if (audioBedroom && audioAuroria) {
        const bedroomMaxVolume = 0.03; // Extremely quiet, subtle background noise
        const auroriaMaxVolume = 0.4;
        audioBedroom.volume = clamp(1 - bedroomFade) * bedroomMaxVolume;
        audioAuroria.volume = clamp(revealAuroria) * auroriaMaxVolume;
    }
    if (audioRift) {
        const riftMaxVolume = 0.6; // Adjust this to balance the rift sound
        // Fade in as the rift opens, fade out as Auroria is revealed
        audioRift.volume = clamp(riftOpen * (1 - revealAuroria)) * riftMaxVolume;
    }
}

function updateScene() {
    drawRip(getScrollProgress());
}

const reveals = document.querySelectorAll(".reveal");

const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("active");
        observer.unobserve(entry.target);
    });
}, { threshold: 0.15 });

reveals.forEach((reveal) => {
    revealObserver.observe(reveal);
});

/* --- SECRET CODE LOGIC --- */
const revealBtn = document.getElementById("reveal-btn");
const secretCodeInput = document.getElementById("secret-code");
const lightbox = document.getElementById("video-lightbox");
const secretVideo = document.getElementById("secret-video");
const videoSource = document.getElementById("video-source");
const closeLightbox = document.getElementById("close-lightbox");

function checkSecretCode() {
    const code = secretCodeInput.value.trim();
    if (!code) return;

    const videoUrl = `video/${code}.mp4`;
    
    videoSource.src = videoUrl;
    secretVideo.load();
    
    secretVideo.onloadeddata = () => {
        lightbox.classList.add("active");
        secretVideo.play();
        secretCodeInput.style.borderColor = "rgba(255, 255, 255, 0.3)";
    };
    
    secretVideo.onerror = () => {
        secretCodeInput.style.borderColor = "red";
        setTimeout(() => {
            secretCodeInput.style.borderColor = "rgba(255, 255, 255, 0.3)";
        }, 1000);
    };
}

revealBtn.addEventListener("click", checkSecretCode);
secretCodeInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") checkSecretCode();
});

closeLightbox.addEventListener("click", () => {
    lightbox.classList.remove("active");
    secretVideo.pause();
    secretVideo.currentTime = 0;
    secretCodeInput.value = "";
});

/* --- DUST PARTICLES --- */
let particles = [];
const particleCount = 80;

class Particle {
    constructor() {
        this.x = Math.random() * window.innerWidth;
        this.y = Math.random() * window.innerHeight;
        this.size = Math.random() * 2.5 + 1.2;
        this.scaleX = Math.random() * 0.8 + 0.6; // Irregular shape
        this.scaleY = Math.random() * 0.8 + 0.6;
        this.speedX = Math.random() * 0.2 - 0.1;
        this.speedY = Math.random() * 0.2 - 0.1;
        this.opacity = Math.random() * 0.4 + 0.15;
    }

    update() {
        this.x += this.speedX;
        this.y += this.speedY;

        if (mouseActive) {
            const dx = this.x - mouseX;
            const dy = this.y - mouseY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            const interactionRadius = 180;
            if (distance < interactionRadius) {
                const force = (interactionRadius - distance) / interactionRadius;
                const angle = Math.atan2(dy, dx);
                this.x += Math.cos(angle) * force * 4;
                this.y += Math.sin(angle) * force * 4;
            }
        }

        if (this.x < -10) this.x = window.innerWidth + 10;
        if (this.x > window.innerWidth + 10) this.x = -10;
        if (this.y < -10) this.y = window.innerHeight + 10;
        if (this.y > window.innerHeight + 10) this.y = -10;
    }

    draw() {
        dustCtx.save();
        dustCtx.translate(this.x, this.y);
        dustCtx.scale(this.scaleX, this.scaleY);

        dustCtx.beginPath();
        const gradient = dustCtx.createRadialGradient(0, 0, 0, 0, 0, this.size);
        gradient.addColorStop(0, `rgba(210, 210, 220, ${this.opacity})`);
        gradient.addColorStop(1, `rgba(210, 210, 220, 0)`); // Soft, blurred edge
        
        dustCtx.arc(0, 0, this.size, 0, Math.PI * 2);
        dustCtx.fillStyle = gradient;
        dustCtx.fill();
        
        dustCtx.restore();
    }
}

function initDust() {
    particles = [];
    for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle());
    }
}

function animateDust() {
    dustCtx.clearRect(0, 0, dustCanvas.width, dustCanvas.height);
    particles.forEach(p => {
        p.update();
        p.draw();
    });

    // 3D Parallax Update
    currentMouseX = lerp(currentMouseX, targetMouseX, 0.05);
    currentMouseY = lerp(currentMouseY, targetMouseY, 0.05);

    const shiftX = currentMouseX * -15; 
    const shiftY = currentMouseY * -15;
    const landscapeShiftX = currentMouseX * -5;
    const landscapeShiftY = currentMouseY * -5;

    bedroom.style.transform = `scale(1.05) translate(${shiftX}px, ${shiftY}px)`;
    if (secretCodeLayer) secretCodeLayer.style.transform = `scale(1.05) translate(${shiftX}px, ${shiftY}px)`;
    dustCanvas.style.transform = `scale(1.05) translate(${shiftX}px, ${shiftY}px)`;
    canvas.style.transform = `scale(1.05) translate(${shiftX}px, ${shiftY}px)`;
    landscape.style.transform = `scale(1.05) translate(${landscapeShiftX}px, ${landscapeShiftY}px)`;

    const glow = document.getElementById("cursor-glow");
    if (glow && mouseActive) {
        const glowX = ((currentMouseX + 1) / 2) * window.innerWidth;
        const glowY = ((currentMouseY + 1) / 2) * window.innerHeight;
        glow.style.transform = `translate(${glowX}px, ${glowY}px)`;
        
        if (secretCodeLayer) {
            // Adjust mask coordinates to account for the layer's parallax shift
            const maskX = mouseX - shiftX;
            const maskY = mouseY - shiftY;
            const maskSize = 180;
            const gradient = `radial-gradient(circle ${maskSize}px at ${maskX}px ${maskY}px, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 80%)`;
            secretCodeLayer.style.webkitMaskImage = gradient;
            secretCodeLayer.style.maskImage = gradient;
        }
    }

    requestAnimationFrame(animateDust);
}

// Initialize and start event loops
window.addEventListener("resize", resizeCanvas);
window.addEventListener("scroll", updateScene, { passive: true });
window.addEventListener("mousemove", (e) => {
    targetMouseX = (e.clientX / window.innerWidth) * 2 - 1;
    targetMouseY = (e.clientY / window.innerHeight) * 2 - 1;
    mouseX = e.clientX;
    mouseY = e.clientY;
    
    if (!mouseActive) {
        mouseActive = true;
        drawRip(getScrollProgress());
    }
});

audioToggle.addEventListener("click", () => {
    audioEnabled = !audioEnabled;
    if (audioEnabled) {
        if (audioBedroom) audioBedroom.play().catch(e => console.log("Audio play blocked", e));
        if (audioAuroria) audioAuroria.play().catch(e => console.log("Audio play blocked", e));
        if (audioRift) audioRift.play().catch(e => console.log("Audio play blocked", e));
        iconMute.style.display = "none";
        iconPlay.style.display = "block";
    } else {
        if (audioBedroom) audioBedroom.pause();
        if (audioAuroria) audioAuroria.pause();
        if (audioRift) audioRift.pause();
        iconMute.style.display = "block";
        iconPlay.style.display = "none";
    }
});

resizeCanvas();
animateDust();

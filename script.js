const bedroom = document.getElementById("bedroom");
const landscape = document.getElementById("landscape");
const canvas = document.getElementById("rip-canvas");
const whiteout = document.getElementById("whiteout");
const ctx = canvas.getContext("2d");

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
    landscape.style.opacity = revealAuroria;
    whiteout.style.opacity = engulf * whiteoutFade;
    canvas.style.opacity = 1 - revealAuroria;

    const scaleX = width * (0.03 + crackBirth * 0.22 + riftOpen * 0.08);
    const scaleY = height * (0.04 + crackBirth * 0.35 + riftOpen * 0.12);
    drawGlassCracks(centerX, centerY, scaleX, scaleY, crackBirth, crackBirth);

    const riftWidth = width * (0.01 + riftOpen * 0.3 + engulf * 0.9);
    const riftHeight = height * (0.06 + riftOpen * 0.94 + engulf * 0.7);
    drawRift(centerX, centerY, riftWidth, riftHeight, riftOpen, crackBirth + riftOpen + engulf);
}

function updateScene() {
    drawRip(getScrollProgress());
}

window.addEventListener("resize", resizeCanvas);
window.addEventListener("scroll", updateScene, { passive: true });
resizeCanvas();

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

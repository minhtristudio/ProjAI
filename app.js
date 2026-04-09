/* ============================================
   ProjAI — Neural Network Background
   Dynamic Neuron Particles + Product Tour
   Mobile Performance Optimized
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {

    // ─── ENVIRONMENT DETECTION ───
    let isMobile = window.innerWidth < 768;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // ─── MOUSE STATE ───
    const mouse = { x: -1000, y: -1000, active: false };
    window.addEventListener('mousemove', e => { mouse.x = e.clientX; mouse.y = e.clientY; mouse.active = true; }, { passive: true });
    window.addEventListener('mouseleave', () => { mouse.active = false; });
    window.addEventListener('touchmove', e => {
        if (e.touches[0]) { mouse.x = e.touches[0].clientX; mouse.y = e.touches[0].clientY; mouse.active = true; }
    }, { passive: true });
    window.addEventListener('touchend', () => { mouse.active = false; }, { passive: true });

    // ─── SCROLL STATE ───
    let scrollY = 0;
    window.addEventListener('scroll', () => { scrollY = window.scrollY; }, { passive: true });

    // ─── COLOR PALETTE ───
    const ACCENT = { r: 108, g: 111, b: 241 };
    const COLORS = [
        { r: 108, g: 111, b: 241 },
        { r: 140, g: 143, b: 240 },
        { r: 85, g: 88, b: 220 },
        { r: 170, g: 172, b: 250 },
    ];


    /* ═══════════════════════════════════════════
       NEURAL NETWORK BACKGROUND
       Interactive grid of neurons that pulse,
       connect, and react to mouse proximity.
       ═══════════════════════════════════════════ */

    class NeuralBackground {
        constructor(canvas) {
            this.canvas = canvas;
            this.ctx = canvas.getContext('2d');
            this.nodes = [];
            this.connections = [];
            this.waves = [];
            this.visible = true;
            this.resize();
            this.initNodes();

            // Periodically fire random activation waves
            this._waveTimer = setInterval(() => {
                if (!prefersReducedMotion && this.visible) {
                    this.fireWave(
                        Math.random() * this.w,
                        Math.random() * this.h
                    );
                }
            }, 3000 + Math.random() * 4000);
        }

        resize() {
            this.w = window.innerWidth;
            this.h = Math.max(window.innerHeight, document.body.scrollHeight);
            const dpr = window.devicePixelRatio || 1;
            this.canvas.width = this.w * dpr;
            this.canvas.height = this.h * dpr;
            this.canvas.style.width = this.w + 'px';
            this.canvas.style.height = this.h + 'px';
            this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            this.spacing = isMobile ? 80 : 60;
            this.initNodes();
        }

        initNodes() {
            this.nodes = [];
            const cols = Math.ceil(this.w / this.spacing) + 1;
            const rows = Math.ceil(this.h / this.spacing) + 1;
            for (let r = 0; r < rows; r++) {
                for (let c = 0; c < cols; c++) {
                    this.nodes.push({
                        x: c * this.spacing + (this.spacing / 2),
                        y: r * this.spacing + (this.spacing / 2),
                        baseX: c * this.spacing + (this.spacing / 2),
                        baseY: r * this.spacing + (this.spacing / 2),
                        activation: 0,
                        targetActivation: 0,
                        size: 1.2 + Math.random() * 0.8,
                        phase: Math.random() * Math.PI * 2,
                        speed: 0.008 + Math.random() * 0.012,
                        connections: []
                    });
                }
            }
            // Build connections (to nearby nodes)
            this.connections = [];
            const maxDist = this.spacing * 1.6;
            for (let i = 0; i < this.nodes.length; i++) {
                for (let j = i + 1; j < this.nodes.length; j++) {
                    const dx = this.nodes[i].x - this.nodes[j].x;
                    const dy = this.nodes[i].y - this.nodes[j].y;
                    const d = Math.sqrt(dx * dx + dy * dy);
                    if (d < maxDist) {
                        this.connections.push({ a: i, b: j, dist: d, maxDist: maxDist });
                        this.nodes[i].connections.push(j);
                    }
                }
            }
        }

        fireWave(x, y) {
            this.waves.push({
                x, y,
                radius: 0,
                maxRadius: 400 + Math.random() * 300,
                speed: 1.5 + Math.random() * 1.5,
                strength: 0.6 + Math.random() * 0.4,
                life: 0
            });
        }

        update() {
            if (prefersReducedMotion) return;

            // Update waves
            for (let w = this.waves.length - 1; w >= 0; w--) {
                const wave = this.waves[w];
                wave.radius += wave.speed;
                wave.life++;
                if (wave.radius > wave.maxRadius) {
                    this.waves.splice(w, 1);
                    continue;
                }
                // Activate nodes near the wave front
                const front = wave.radius;
                const thickness = 80;
                for (const node of this.nodes) {
                    const dx = node.x - wave.x;
                    const dy = node.y - wave.y;
                    const d = Math.sqrt(dx * dx + dy * dy);
                    if (Math.abs(d - front) < thickness) {
                        const proximity = 1 - Math.abs(d - front) / thickness;
                        const falloff = 1 - wave.radius / wave.maxRadius;
                        node.targetActivation = Math.max(node.targetActivation,
                            proximity * falloff * wave.strength);
                    }
                }
            }

            // Mouse proximity activation
            if (mouse.active) {
                const mx = mouse.x;
                const my = mouse.y + scrollY;
                const mouseRadius = isMobile ? 120 : 180;
                for (const node of this.nodes) {
                    const dx = node.x - mx;
                    const dy = node.y - my;
                    const d = Math.sqrt(dx * dx + dy * dy);
                    if (d < mouseRadius) {
                        const proximity = 1 - d / mouseRadius;
                        node.targetActivation = Math.max(node.targetActivation, proximity * 0.8);
                    }
                }
            }

            // Update node activations
            for (const node of this.nodes) {
                // Breathing animation
                node.phase += node.speed;
                const breathe = Math.sin(node.phase) * 0.15;
                node.targetActivation = Math.max(node.targetActivation, breathe * 0.3);

                // Smooth interpolation
                node.activation += (node.targetActivation - node.activation) * 0.06;
                node.targetActivation *= 0.97; // decay

                // Slight position drift
                node.x = node.baseX + Math.sin(node.phase * 0.7) * 1.5;
                node.y = node.baseY + Math.cos(node.phase * 0.5) * 1.5;
            }
        }

        draw() {
            if (!this.visible) return;
            if (prefersReducedMotion && this._drawnOnce) return;

            this.ctx.clearRect(0, 0, this.w, this.h);

            // Draw connections
            for (const conn of this.connections) {
                const a = this.nodes[conn.a];
                const b = this.nodes[conn.b];
                const activation = Math.max(a.activation, b.activation);
                if (activation < 0.02) continue;

                const alpha = activation * 0.15;
                this.ctx.beginPath();
                this.ctx.moveTo(a.x, a.y);
                this.ctx.lineTo(b.x, b.y);
                this.ctx.strokeStyle = `rgba(${ACCENT.r},${ACCENT.g},${ACCENT.b},${alpha})`;
                this.ctx.lineWidth = 0.5 + activation * 0.5;
                this.ctx.stroke();
            }

            // Draw nodes
            for (const node of this.nodes) {
                if (node.activation < 0.01) continue;

                const alpha = Math.min(1, node.activation * 1.2);
                const size = node.size * (1 + node.activation * 2);

                // Glow
                if (node.activation > 0.2) {
                    this.ctx.beginPath();
                    this.ctx.arc(node.x, node.y, size * 4, 0, Math.PI * 2);
                    this.ctx.fillStyle = `rgba(${ACCENT.r},${ACCENT.g},${ACCENT.b},${node.activation * 0.04})`;
                    this.ctx.fill();
                }

                // Core dot
                this.ctx.beginPath();
                this.ctx.arc(node.x, node.y, size, 0, Math.PI * 2);
                this.ctx.fillStyle = `rgba(${ACCENT.r},${ACCENT.g},${ACCENT.b},${alpha * 0.6})`;
                this.ctx.fill();
            }

            // Draw wave rings (subtle)
            for (const wave of this.waves) {
                const progress = wave.radius / wave.maxRadius;
                const alpha = (1 - progress) * 0.03;
                this.ctx.beginPath();
                this.ctx.arc(wave.x, wave.y, wave.radius, 0, Math.PI * 2);
                this.ctx.strokeStyle = `rgba(${ACCENT.r},${ACCENT.g},${ACCENT.b},${alpha})`;
                this.ctx.lineWidth = 1;
                this.ctx.stroke();
            }

            if (prefersReducedMotion) this._drawnOnce = true;
        }
    }


    /* ═══════════════════════════════════════════
       PARTICLE SYSTEM — Neuron-like floating squares
       Appear/disappear in activation waves
       ═══════════════════════════════════════════ */

    class Particle {
        constructor(cw, ch, opts = {}) {
            this.cw = cw;
            this.ch = ch;
            this.reset(true, opts);
        }

        reset(initial = false, opts = {}) {
            this.x = Math.random() * this.cw;
            this.y = initial ? Math.random() * this.ch : this.ch + 30 + Math.random() * 40;
            this.size = (opts.minSize || 4) + Math.random() * (opts.maxSize || 24);
            this.baseSize = this.size;
            this.vy = -(Math.random() * 0.25 + 0.05);
            this.vx = (Math.random() - 0.5) * 0.15;
            this.rot = Math.random() * Math.PI * 2;
            this.rotV = (Math.random() - 0.5) * 0.006;
            this.opacity = 0;
            this.maxOpacity = Math.random() * 0.1 + 0.02;
            this.fadeSpeed = Math.random() * 0.002 + 0.0008;
            this.fadingIn = true;
            this.color = COLORS[Math.floor(Math.random() * COLORS.length)];
            this.strokeOnly = Math.random() > 0.35;
            this.radius = Math.random() * 5 + 1;
            this.life = 0;
            this.maxLife = Math.random() * 500 + 250;
            this.pulseOff = Math.random() * 6.28;
            this.pulseSpd = Math.random() * 0.015 + 0.005;
            // Neuron activation
            this.neuronActivation = 0;
        }

        update() {
            if (prefersReducedMotion) return;

            this.life++;
            this.y += this.vy;
            this.x += this.vx;
            this.rot += this.rotV;

            if (this.fadingIn) {
                this.opacity += this.fadeSpeed;
                if (this.opacity >= this.maxOpacity) {
                    this.opacity = this.maxOpacity;
                    this.fadingIn = false;
                }
            }

            const pulse = Math.sin(this.life * this.pulseSpd + this.pulseOff);
            this.size = this.baseSize * (1 + pulse * 0.1);

            // Neuron activation boost
            if (this.neuronActivation > 0) {
                this.neuronActivation *= 0.94;
                this.opacity = Math.min(0.35, this.opacity + this.neuronActivation * 0.15);
                this.size = this.baseSize * (1 + this.neuronActivation * 0.5);
            }

            if (this.life > this.maxLife * 0.7) this.opacity *= 0.997;

            if (this.life > this.maxLife || this.opacity < 0.001 || this.y < -60) {
                this.reset();
            }
        }

        draw(ctx) {
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(this.rot);
            ctx.globalAlpha = this.opacity;
            const { r, g, b } = this.color;
            const hs = this.size / 2;
            const rad = Math.max(1, Math.min(this.radius, hs));

            ctx.beginPath();
            ctx.moveTo(-hs + rad, -hs);
            ctx.lineTo(hs - rad, -hs);
            ctx.quadraticCurveTo(hs, -hs, hs, -hs + rad);
            ctx.lineTo(hs, hs - rad);
            ctx.quadraticCurveTo(hs, hs, hs - rad, hs);
            ctx.lineTo(-hs + rad, hs);
            ctx.quadraticCurveTo(-hs, hs, -hs, hs - rad);
            ctx.lineTo(-hs, -hs + rad);
            ctx.quadraticCurveTo(-hs, -hs, -hs + rad, -hs);
            ctx.closePath();

            if (this.strokeOnly) {
                ctx.strokeStyle = `rgba(${r},${g},${b},${Math.min(1, this.opacity * 4)})`;
                ctx.lineWidth = 0.8;
                ctx.stroke();
            } else {
                ctx.fillStyle = `rgba(${r},${g},${b},${this.opacity})`;
                ctx.fill();
            }

            // Neuron glow effect
            if (this.neuronActivation > 0.1) {
                ctx.globalAlpha = this.neuronActivation * 0.15;
                ctx.shadowColor = `rgba(${ACCENT.r},${ACCENT.g},${ACCENT.b},1)`;
                ctx.shadowBlur = 15;
                ctx.fill();
                ctx.shadowBlur = 0;
            }

            ctx.restore();
        }
    }


    /* ═══════════════════════════════════════════
       CANVAS MANAGER — Multi-canvas with neuron waves
       ═══════════════════════════════════════════ */

    class ParticleCanvas {
        constructor(canvasEl, opts = {}) {
            this.canvas = canvasEl;
            this.ctx = canvasEl.getContext('2d');
            this.particles = [];
            this.opts = opts;
            this.visible = true;
            this._isBg = false;

            if (isMobile && !opts.forceCount) {
                opts.count = Math.max(8, Math.floor((opts.count || 30) * 0.4));
            }

            this.resize();
            this.init();

            if (canvasEl.id) {
                canvasMap[canvasEl.id] = this;
            }
        }

        resize() {
            const rect = this.canvas.parentElement.getBoundingClientRect();
            this.canvas.width = rect.width * (window.devicePixelRatio || 1);
            this.canvas.height = rect.height * (window.devicePixelRatio || 1);
            this.ctx.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1);
            this.w = rect.width;
            this.h = rect.height;
        }

        init() {
            const count = this.opts.count || Math.min(40, Math.floor(this.w / 30));
            for (let i = 0; i < count; i++) {
                this.particles.push(new Particle(this.w, this.h, this.opts));
            }
        }

        // Fire an activation wave through particles
        fireActivationWave() {
            const count = Math.floor(this.particles.length * 0.4);
            const delay = () => 30 + Math.random() * 60;
            for (let i = 0; i < count; i++) {
                setTimeout(() => {
                    const p = this.particles[Math.floor(Math.random() * this.particles.length)];
                    if (p) p.neuronActivation = 0.5 + Math.random() * 0.5;
                }, i * delay());
            }
        }

        draw() {
            if (!this.visible) return;
            if (isMobile && this._isBg) return;
            if (prefersReducedMotion && this._drawnOnce) return;

            this.ctx.clearRect(0, 0, this.w, this.h);

            // Subtle grid
            this.ctx.globalAlpha = 0.012;
            this.ctx.strokeStyle = '#6c6ff1';
            this.ctx.lineWidth = 0.5;
            const gs = isMobile ? 100 : 60;
            for (let x = 0; x < this.w; x += gs) {
                this.ctx.beginPath(); this.ctx.moveTo(x, 0); this.ctx.lineTo(x, this.h); this.ctx.stroke();
            }
            for (let y = 0; y < this.h; y += gs) {
                this.ctx.beginPath(); this.ctx.moveTo(0, y); this.ctx.lineTo(this.w, y); this.ctx.stroke();
            }
            this.ctx.globalAlpha = 1;

            // Connection lines (desktop only)
            if (!isMobile) {
                const ps = this.particles;
                for (let i = 0; i < ps.length; i++) {
                    for (let j = i + 1; j < ps.length; j++) {
                        const dx = ps[i].x - ps[j].x;
                        const dy = ps[i].y - ps[j].y;
                        const d = Math.sqrt(dx * dx + dy * dy);
                        if (d < 120) {
                            const activation = Math.max(ps[i].neuronActivation, ps[j].neuronActivation);
                            const baseA = (1 - d / 120) * 0.03 * Math.min(ps[i].opacity, ps[j].opacity) * 15;
                            const a = baseA + activation * 0.08;
                            this.ctx.beginPath();
                            this.ctx.moveTo(ps[i].x, ps[i].y);
                            this.ctx.lineTo(ps[j].x, ps[j].y);
                            this.ctx.strokeStyle = `rgba(108,111,241,${a})`;
                            this.ctx.lineWidth = 0.4 + activation * 0.6;
                            this.ctx.stroke();
                        }
                    }
                }
            }

            this.particles.forEach(p => { p.update(); p.draw(this.ctx); });

            if (prefersReducedMotion) this._drawnOnce = true;
        }
    }


    // ─── CANVAS VISIBILITY MAP ───
    const canvasMap = {};


    // ─── INITIALIZE NEURAL BACKGROUND ───
    const bgCanvas = document.getElementById('bgCanvas');
    const neuralBg = new NeuralBackground(bgCanvas);

    // Fire an initial wave on load
    setTimeout(() => neuralBg.fireWave(window.innerWidth * 0.3, window.innerHeight * 0.4), 500);
    setTimeout(() => neuralBg.fireWave(window.innerWidth * 0.7, window.innerHeight * 0.6), 2000);


    // ─── INITIALIZE PREVIEW CANVASES ───
    const heroCanvas = document.getElementById('heroPreviewCanvas');
    let heroPC = null;
    if (heroCanvas) heroPC = new ParticleCanvas(heroCanvas, { count: 30, minSize: 6, maxSize: 32 });

    const pc1 = document.getElementById('previewCanvas1');
    const pc2 = document.getElementById('previewCanvas2');
    const pc3 = document.getElementById('previewCanvas3');
    let hpc1 = null, hpc2 = null, hpc3 = null;
    if (pc1) hpc1 = new ParticleCanvas(pc1, { count: 18, minSize: 4, maxSize: 20 });
    if (pc2) hpc2 = new ParticleCanvas(pc2, { count: 18, minSize: 4, maxSize: 20 });
    if (pc3) hpc3 = new ParticleCanvas(pc3, { count: 18, minSize: 4, maxSize: 20 });

    const featCanvas = document.getElementById('featuresPreviewCanvas');
    let featPC = null;
    if (featCanvas) featPC = new ParticleCanvas(featCanvas, { count: 35, minSize: 5, maxSize: 28 });

    const allCanvases = [heroPC, hpc1, hpc2, hpc3, featPC].filter(Boolean);

    // Observe all canvas elements
    const canvasObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            const canvasId = entry.target.id;
            const instance = canvasMap[canvasId];
            if (instance) instance.visible = entry.isIntersecting;
            // Fire activation wave when canvas becomes visible
            if (entry.isIntersecting && instance && instance.fireActivationWave) {
                instance.fireActivationWave();
            }
        });
    }, { threshold: 0 });

    allCanvases.forEach(c => { if (c.canvas) canvasObserver.observe(c.canvas); });


    // ─── PERIODIC NEURON ACTIVATION WAVES ───
    // Randomly fire activation waves across preview canvases
    setInterval(() => {
        if (prefersReducedMotion) return;
        const visible = allCanvases.filter(c => c.visible);
        if (visible.length > 0) {
            const target = visible[Math.floor(Math.random() * visible.length)];
            if (target.fireActivationWave) target.fireActivationWave();
        }
    }, 4000);


    // ─── FPS-THROTTLED ANIMATION LOOP ───
    let animId;
    let running = true;
    let lastFrame = 0;
    const TARGET_FPS = isMobile ? 24 : 60;
    const FRAME_INTERVAL = 1000 / TARGET_FPS;

    function animate(timestamp) {
        animId = requestAnimationFrame(animate);
        if (timestamp - lastFrame < FRAME_INTERVAL) return;
        lastFrame = timestamp;

        // Update & draw neural background
        neuralBg.update();
        neuralBg.draw();

        // Update & draw particle canvases
        allCanvases.forEach(c => c.draw());
    }

    if (prefersReducedMotion) {
        neuralBg.update(); neuralBg.draw();
        allCanvases.forEach(c => c.draw());
    } else {
        animate(0);
    }

    // Visibility pause
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            cancelAnimationFrame(animId);
            running = false;
        } else if (!running) {
            lastFrame = 0;
            if (prefersReducedMotion) {
                neuralBg.update(); neuralBg.draw();
                allCanvases.forEach(c => { c._drawnOnce = false; c.draw(); });
                running = true;
            } else {
                animate(0);
                running = true;
            }
        }
    });


    // ─── RESIZE HANDLER ───
    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            const wasMobile = isMobile;
            isMobile = window.innerWidth < 768;

            neuralBg.resize();

            // Resize particle canvases
            const rebuildList = [
                { pc: heroPC, baseCount: 30 },
                { pc: hpc1, baseCount: 18 },
                { pc: hpc2, baseCount: 18 },
                { pc: hpc3, baseCount: 18 },
                { pc: featPC, baseCount: 35 },
            ];
            rebuildList.forEach(({ pc, baseCount }) => {
                if (!pc) return;
                pc.particles = [];
                if (isMobile && !pc.opts.forceCount) {
                    pc.opts.count = Math.max(8, Math.floor(baseCount * 0.4));
                } else {
                    pc.opts.count = baseCount;
                }
                pc.resize();
                pc.init();
            });
        }, 200);
    }, { passive: true });


    // ─── NAV SCROLL ───
    const nav = document.getElementById('nav');
    window.addEventListener('scroll', () => {
        nav.classList.toggle('scrolled', window.scrollY > 60);
    }, { passive: true });


    // ─── MOBILE MENU ───
    const burger = document.getElementById('navBurger');
    const mobileNav = document.getElementById('mobileNav');
    let menuOpen = false;

    function openMobileMenu() {
        menuOpen = true;
        mobileNav.classList.add('open');
        burger.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closeMobileMenu() {
        menuOpen = false;
        mobileNav.classList.remove('open');
        burger.classList.remove('active');
        document.body.style.overflow = '';
    }

    if (burger && mobileNav) {
        burger.addEventListener('click', () => {
            if (menuOpen) closeMobileMenu();
            else openMobileMenu();
        });
        mobileNav.querySelectorAll('a').forEach(a => {
            a.addEventListener('click', closeMobileMenu);
        });
        document.addEventListener('click', e => {
            if (menuOpen && !burger.contains(e.target) && !mobileNav.contains(e.target)) {
                closeMobileMenu();
            }
        });
        document.addEventListener('keydown', e => {
            if (e.key === 'Escape' && menuOpen) closeMobileMenu();
        });
    }


    // ─── SMOOTH SCROLL ───
    document.querySelectorAll('a[href^="#"]').forEach(a => {
        a.addEventListener('click', e => {
            const target = document.querySelector(a.getAttribute('href'));
            if (target) {
                e.preventDefault();
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });


    // ─── SCROLL REVEAL ───
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
                revealObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

    document.querySelectorAll('.how-card, .feat-item, .setup-step, .faq-item, .section-header, .status-banner, .features-preview, .hero-preview').forEach((el, i) => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(24px)';
        el.style.transitionDelay = `${(i % 6) * 0.06}s`;
        el.style.transition = `opacity 0.7s var(--ease) ${el.style.transitionDelay}, transform 0.7s var(--ease) ${el.style.transitionDelay}, border-color 0.3s, box-shadow 0.3s, background 0.2s`;
        revealObserver.observe(el);
    });

    const style = document.createElement('style');
    style.textContent = '.revealed { opacity: 1 !important; transform: translateY(0) !important; }';
    document.head.appendChild(style);


    // ─── TOUCH GESTURE (Hero Preview) ───
    const heroPreview = document.querySelector('.hero-preview');
    if (heroPreview && 'ontouchstart' in window) {
        let touchStartX = 0, touchStartY = 0;
        heroPreview.addEventListener('touchstart', e => {
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
        }, { passive: true });
        heroPreview.addEventListener('touchend', e => {
            const dx = e.changedTouches[0].clientX - touchStartX;
            const dy = e.changedTouches[0].clientY - touchStartY;
            if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) {
                heroPreview.style.transform = dx > 0 ? 'translateX(8px)' : 'translateX(-8px)';
                setTimeout(() => {
                    heroPreview.style.transition = 'transform 0.3s ease';
                    heroPreview.style.transform = '';
                    setTimeout(() => { heroPreview.style.transition = ''; }, 300);
                }, 100);
            }
        }, { passive: true });
    }


    /* ═══════════════════════════════════════════
       INTERACTIVE PRODUCT TOUR
       Guided walkthrough with spotlight,
       glass tooltips, progress & keyboard nav
       ═══════════════════════════════════════════ */

    class ProductTour {
        constructor() {
            this.steps = [
                {
                    target: '[data-tour="hero"]',
                    title: 'Welcome to ProjAI',
                    description: 'An autonomous AI agent that searches, collects, and organizes artwork — running entirely on GitHub Actions with zero infrastructure cost.',
                    position: 'bottom'
                },
                {
                    target: '[data-tour="status"]',
                    title: 'Development Status',
                    description: 'The repository is currently internal and under active development. Track our progress as we prepare for the open-source release.',
                    position: 'bottom'
                },
                {
                    target: '[data-tour="how-it-works"]',
                    title: 'How It Works — Three Layers',
                    description: 'ProjAI combines headless browser automation, local LLM inference, and ngrok tunneling into a single autonomous pipeline. Each card shows a live preview of that layer.',
                    position: 'top'
                },
                {
                    target: '[data-tour="features"]',
                    title: 'Feature Stack',
                    description: 'Built for zero-cost operation: multi-source search, stealth browsing, AI chat with Qwen2.5-7B, serverless runtime, and a Material You dark interface.',
                    position: 'top'
                },
                {
                    target: '[data-tour="setup"]',
                    title: 'Get Started in 5 Minutes',
                    description: 'Fork the repo, add your ngrok token, enable Actions — and you\'re live. No local installations, no cloud accounts, no configuration headaches.',
                    position: 'top'
                }
            ];
            this.currentStep = -1;
            this.isActive = false;
            this.tooltip = null;
            this.spotlight = null;
            this.backdrop = null;

            this.createElements();
            this.bindEvents();
        }

        createElements() {
            // Spotlight overlay
            this.backdrop = document.createElement('div');
            this.backdrop.className = 'tour-backdrop';
            this.backdrop.setAttribute('role', 'dialog');
            this.backdrop.setAttribute('aria-modal', 'true');
            this.backdrop.setAttribute('aria-label', 'Product tour');
            document.body.appendChild(this.backdrop);

            // Tooltip
            this.tooltip = document.createElement('div');
            this.tooltip.className = 'tour-tooltip';
            this.tooltip.innerHTML = `
                <div class="tour-tooltip-inner">
                    <div class="tour-step-counter"></div>
                    <h3 class="tour-tooltip-title"></h3>
                    <p class="tour-tooltip-desc"></p>
                    <div class="tour-tooltip-actions">
                        <button class="tour-btn tour-btn-skip" aria-label="Skip tour">Skip</button>
                        <div class="tour-progress-dots"></div>
                        <button class="tour-btn tour-btn-next" aria-label="Next step">
                            <span>Next</span>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                        </button>
                    </div>
                </div>
                <div class="tour-tooltip-arrow"></div>
            `;
            document.body.appendChild(this.tooltip);

            // Launch button
            this.launchBtn = document.createElement('button');
            this.launchBtn.className = 'tour-launch-btn';
            this.launchBtn.setAttribute('aria-label', 'Start product tour');
            this.launchBtn.innerHTML = `
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polygon points="5 3 19 12 5 21 5 3"/>
                </svg>
                <span>Take a tour</span>
            `;
            document.body.appendChild(this.launchBtn);

            // Show launch button after a delay
            setTimeout(() => {
                this.launchBtn.classList.add('visible');
            }, 2000);
        }

        bindEvents() {
            // Launch
            this.launchBtn.addEventListener('click', () => this.start());

            // Keyboard
            document.addEventListener('keydown', e => {
                if (!this.isActive) return;
                if (e.key === 'ArrowRight' || e.key === 'Enter') this.next();
                else if (e.key === 'ArrowLeft') this.prev();
                else if (e.key === 'Escape') this.end();
            });

            // Tooltip buttons
            this.tooltip.querySelector('.tour-btn-skip').addEventListener('click', () => this.end());
            this.tooltip.querySelector('.tour-btn-next').addEventListener('click', () => this.next());

            // Resize
            window.addEventListener('resize', () => {
                if (this.isActive) this.positionTooltip();
            });
        }

        start() {
            this.isActive = true;
            this.currentStep = 0;
            this.launchBtn.classList.remove('visible');
            this.backdrop.classList.add('active');
            document.body.style.overflow = 'hidden';
            this.showStep();
        }

        end() {
            this.isActive = false;
            this.currentStep = -1;
            this.backdrop.classList.remove('active');
            this.tooltip.classList.remove('visible');
            document.body.style.overflow = '';

            // Remove all highlights
            this.steps.forEach(step => {
                const el = document.querySelector(step.target);
                if (el) el.classList.remove('tour-highlight');
            });

            // Show launch button again
            setTimeout(() => this.launchBtn.classList.add('visible'), 500);
        }

        next() {
            if (this.currentStep < this.steps.length - 1) {
                this.currentStep++;
                this.showStep();
            } else {
                this.end();
            }
        }

        prev() {
            if (this.currentStep > 0) {
                this.currentStep--;
                this.showStep();
            }
        }

        showStep() {
            const step = this.steps[this.currentStep];
            const target = document.querySelector(step.target);
            if (!target) { this.end(); return; }

            // Remove previous highlights
            this.steps.forEach(s => {
                const el = document.querySelector(s.target);
                if (el) el.classList.remove('tour-highlight');
            });

            // Highlight current target
            target.classList.add('tour-highlight');

            // Update spotlight
            const rect = target.getBoundingClientRect();
            const padding = isMobile ? 8 : 16;
            this.backdrop.style.setProperty('--spot-x', (rect.left - padding) + 'px');
            this.backdrop.style.setProperty('--spot-y', (rect.top - padding) + 'px');
            this.backdrop.style.setProperty('--spot-w', (rect.width + padding * 2) + 'px');
            this.backdrop.style.setProperty('--spot-h', (rect.height + padding * 2) + 'px');

            // Update tooltip content
            this.tooltip.querySelector('.tour-step-counter').textContent = `${this.currentStep + 1} / ${this.steps.length}`;
            this.tooltip.querySelector('.tour-tooltip-title').textContent = step.title;
            this.tooltip.querySelector('.tour-tooltip-desc').textContent = step.description;

            // Update progress dots
            const dotsContainer = this.tooltip.querySelector('.tour-progress-dots');
            dotsContainer.innerHTML = '';
            this.steps.forEach((_, i) => {
                const dot = document.createElement('span');
                dot.className = 'tour-dot' + (i === this.currentStep ? ' active' : '') + (i < this.currentStep ? ' completed' : '');
                dotsContainer.appendChild(dot);
            });

            // Update next button text
            const nextBtn = this.tooltip.querySelector('.tour-btn-next span');
            nextBtn.textContent = this.currentStep === this.steps.length - 1 ? 'Done' : 'Next';

            // Show tooltip
            this.tooltip.classList.add('visible');
            this.positionTooltip();

            // Scroll target into view
            target.scrollIntoView({ behavior: 'smooth', block: 'center' });

            // Fire a neural wave at the target position
            setTimeout(() => {
                neuralBg.fireWave(
                    rect.left + rect.width / 2,
                    rect.top + rect.height / 2 + scrollY
                );
            }, 300);
        }

        positionTooltip() {
            const step = this.steps[this.currentStep];
            const target = document.querySelector(step.target);
            if (!target) return;

            const rect = target.getBoundingClientRect();
            const tooltipRect = this.tooltip.getBoundingClientRect();
            const gap = isMobile ? 12 : 20;

            // Reset position
            this.tooltip.style.top = '';
            this.tooltip.style.bottom = '';
            this.tooltip.style.left = '';
            this.tooltip.style.right = '';

            const arrow = this.tooltip.querySelector('.tour-tooltip-arrow');
            arrow.className = 'tour-tooltip-arrow';

            if (step.position === 'bottom') {
                this.tooltip.style.top = (rect.bottom + gap) + 'px';
                this.tooltip.style.left = Math.max(16, Math.min(rect.left + rect.width / 2 - tooltipRect.width / 2, window.innerWidth - tooltipRect.width - 16)) + 'px';
                arrow.classList.add('arrow-top');
            } else {
                this.tooltip.style.bottom = (window.innerHeight - rect.top + gap) + 'px';
                this.tooltip.style.left = Math.max(16, Math.min(rect.left + rect.width / 2 - tooltipRect.width / 2, window.innerWidth - tooltipRect.width - 16)) + 'px';
                arrow.classList.add('arrow-bottom');
            }
        }
    }

    // Initialize tour
    const tour = new ProductTour();


    // ─── INLINE SCRIPT: MOBILE NAV SYNC ───
    // (Handled by the inline script in HTML)


    // ─── BACK TO TOP ───
    const backToTop = document.querySelector('.back-to-top');
    if (backToTop) {
        window.addEventListener('scroll', () => {
            backToTop.classList.toggle('visible', window.scrollY > 600);
        }, { passive: true });
        backToTop.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

});

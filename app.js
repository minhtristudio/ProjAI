/* ============================================
   ProjAI — Multi-canvas Particle System
   Glass Preview Panels + Interactions
   Mobile Performance Optimized
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {

    // ─── ENVIRONMENT DETECTION ───
    let isMobile = window.innerWidth < 768;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // ─── SINGLE ACCENT COLOR PALETTE ───
    // Muted, monochrome — NOT rainbow
    const COLORS = [
        { r: 108, g: 111, b: 241 },   // accent (muted indigo)
        { r: 140, g: 143, b: 240 },   // lighter accent
        { r: 85, g: 88, b: 220 },     // darker accent
        { r: 170, g: 172, b: 250 },   // very light accent
    ];

    // ─── PARTICLE CLASS ───
    class Particle {
        constructor(cw, ch, opts = {}) {
            this.cw = cw;
            this.ch = ch;
            this.reset(true, opts);
        }

        reset(initial = false, opts = {}) {
            this.x = Math.random() * this.cw;
            this.y = initial
                ? Math.random() * this.ch
                : this.ch + 30 + Math.random() * 40;
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
        }

        update() {
            // If reduced motion, skip all animation updates
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

            // Rounded rect path
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

            ctx.restore();
        }
    }


    // ─── CANVAS MANAGER ───
    class ParticleCanvas {
        constructor(canvasEl, opts = {}) {
            this.canvas = canvasEl;
            this.ctx = canvasEl.getContext('2d');
            this.particles = [];
            this.opts = opts;
            this.visible = true;
            this._isBg = false; // flag for background canvas

            // On mobile, reduce particle count by 60% unless forceCount is set
            if (isMobile && !opts.forceCount) {
                opts.count = Math.max(8, Math.floor((opts.count || 30) * 0.4));
            }

            this.resize();
            this.init();

            // Register in canvasMap for visibility control
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

        draw() {
            // Skip if this canvas is not visible in viewport
            if (!this.visible) return;

            // On mobile, skip background canvas entirely (hidden behind glass)
            if (isMobile && this._isBg) return;

            // If reduced motion, only draw once (static frame)
            if (prefersReducedMotion && this._drawnOnce) return;

            this.ctx.clearRect(0, 0, this.w, this.h);

            // Subtle grid — larger grid size on mobile for performance
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

            // Connection lines — skip on mobile (O(n²) is expensive)
            if (!isMobile) {
                const ps = this.particles;
                for (let i = 0; i < ps.length; i++) {
                    for (let j = i + 1; j < ps.length; j++) {
                        const dx = ps[i].x - ps[j].x;
                        const dy = ps[i].y - ps[j].y;
                        const d = Math.sqrt(dx * dx + dy * dy);
                        if (d < 120) {
                            const a = (1 - d / 120) * 0.03 * Math.min(ps[i].opacity, ps[j].opacity) * 15;
                            this.ctx.beginPath();
                            this.ctx.moveTo(ps[i].x, ps[i].y);
                            this.ctx.lineTo(ps[j].x, ps[j].y);
                            this.ctx.strokeStyle = `rgba(108,111,241,${a})`;
                            this.ctx.lineWidth = 0.4;
                            this.ctx.stroke();
                        }
                    }
                }
            }

            this.particles.forEach(p => { p.update(); p.draw(this.ctx); });

            // Mark as drawn for reduced-motion static mode
            if (prefersReducedMotion) {
                this._drawnOnce = true;
            }
        }
    }


    // ─── CANVAS VISIBILITY MAP ───
    const canvasMap = {};


    // ─── INITIALIZE ALL CANVASES ───

    // Background canvas
    const bgCanvas = document.getElementById('bgCanvas');
    const bgPC = new ParticleCanvas(bgCanvas, { count: Math.min(50, Math.floor(window.innerWidth / 30)) });
    bgPC._isBg = true;

    // Hero preview canvas
    const heroCanvas = document.getElementById('heroPreviewCanvas');
    let heroPC = null;
    if (heroCanvas) heroPC = new ParticleCanvas(heroCanvas, { count: 30, minSize: 6, maxSize: 32 });

    // How-it-works preview canvases
    const pc1 = document.getElementById('previewCanvas1');
    const pc2 = document.getElementById('previewCanvas2');
    const pc3 = document.getElementById('previewCanvas3');
    let hpc1 = null, hpc2 = null, hpc3 = null;
    if (pc1) hpc1 = new ParticleCanvas(pc1, { count: 18, minSize: 4, maxSize: 20 });
    if (pc2) hpc2 = new ParticleCanvas(pc2, { count: 18, minSize: 4, maxSize: 20 });
    if (pc3) hpc3 = new ParticleCanvas(pc3, { count: 18, minSize: 4, maxSize: 20 });

    // Features preview canvas
    const featCanvas = document.getElementById('featuresPreviewCanvas');
    let featPC = null;
    if (featCanvas) featPC = new ParticleCanvas(featCanvas, { count: 35, minSize: 5, maxSize: 28 });

    // All canvases to animate
    const allCanvases = [bgPC, heroPC, hpc1, hpc2, hpc3, featPC].filter(Boolean);

    // ─── INTERSECTION OBSERVER FOR CANVAS VISIBILITY ───
    // Pause canvases that are off-screen to save battery, especially on mobile
    const canvasObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            const canvasId = entry.target.id;
            const instance = canvasMap[canvasId];
            if (instance) {
                instance.visible = entry.isIntersecting;
            }
        });
    }, { threshold: 0 });

    // Observe all canvas elements
    allCanvases.forEach(c => {
        if (c.canvas) canvasObserver.observe(c.canvas);
    });


    // ─── FPS-THROTTLED ANIMATION LOOP ───
    let animId;
    let running = true;
    let lastFrame = 0;
    const TARGET_FPS = isMobile ? 24 : 60;
    const FRAME_INTERVAL = 1000 / TARGET_FPS;

    function animate(timestamp) {
        animId = requestAnimationFrame(animate);

        // Frame throttling
        if (timestamp - lastFrame < FRAME_INTERVAL) return;
        lastFrame = timestamp;

        allCanvases.forEach(c => c.draw());
    }

    // If reduced motion, draw once then stop the loop entirely
    if (prefersReducedMotion) {
        allCanvases.forEach(c => c.draw());
        // Still set up the loop so visibility changes can trigger redraws
        animId = requestAnimationFrame(function reducedAnimate(ts) {
            // Only redraw if a canvas just became visible and needs a static frame
            animId = requestAnimationFrame(reducedAnimate);
        });
    } else {
        animate(0);
    }

    // Visibility pause — enhanced with frame throttle reset
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            cancelAnimationFrame(animId);
            running = false;
        } else if (!running) {
            lastFrame = 0; // Reset throttle so next frame renders immediately
            if (prefersReducedMotion) {
                allCanvases.forEach(c => { c._drawnOnce = false; c.draw(); });
                running = true;
            } else {
                animate(0);
                running = true;
            }
        }
    });


    // ─── RESIZE HANDLER (DEBOUNCED) ───
    // On resize, recalculate mobile state and rebuild particle counts if needed
    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            const wasMobile = isMobile;
            isMobile = window.innerWidth < 768;

            // Recalculate FPS target when mobile state changes
            // (Inlined — no separate assignment since TARGET_FPS is const,
            //  we adjust via the draw method's isMobile check)

            if (wasMobile !== isMobile) {
                // Mobile state changed — rebuild background canvas with appropriate count
                bgPC.particles = [];
                if (isMobile && !bgPC.opts.forceCount) {
                    bgPC.opts.count = Math.max(8, Math.floor(50 * 0.4));
                } else if (!wasMobile) {
                    bgPC.opts.count = Math.min(50, Math.floor(window.innerWidth / 30));
                }
                bgPC.resize();
                bgPC.init();

                // Rebuild hero canvas
                if (heroPC) {
                    heroPC.particles = [];
                    if (isMobile && !heroPC.opts.forceCount) {
                        heroPC.opts.count = Math.max(8, Math.floor(30 * 0.4));
                    } else {
                        heroPC.opts.count = 30;
                    }
                    heroPC.resize();
                    heroPC.init();
                }

                // Rebuild how-it-works canvases
                [hpc1, hpc2, hpc3].forEach(c => {
                    if (c) {
                        c.particles = [];
                        if (isMobile && !c.opts.forceCount) {
                            c.opts.count = Math.max(8, Math.floor(18 * 0.4));
                        } else {
                            c.opts.count = 18;
                        }
                        c.resize();
                        c.init();
                    }
                });

                // Rebuild features canvas
                if (featPC) {
                    featPC.particles = [];
                    if (isMobile && !featPC.opts.forceCount) {
                        featPC.opts.count = Math.max(8, Math.floor(35 * 0.4));
                    } else {
                        featPC.opts.count = 35;
                    }
                    featPC.resize();
                    featPC.init();
                }
            } else {
                // Same mobile state — just resize
                bgPC.resize();
                bgPC.particles.forEach(p => { p.cw = bgPC.w; p.ch = bgPC.h; });
                bgPC.particles = [];
                bgPC.init();
                if (heroPC) { heroPC.resize(); heroPC.particles.forEach(p => { p.cw = heroPC.w; p.ch = heroPC.h; }); }
                [hpc1, hpc2, hpc3, featPC].forEach(c => {
                    if (c) { c.resize(); c.particles.forEach(p => { p.cw = c.w; p.ch = c.h; }); }
                });
            }
        }, 200);
    }, { passive: true });


    // ─── NAV SCROLL ───
    const nav = document.getElementById('nav');
    window.addEventListener('scroll', () => {
        nav.classList.toggle('scrolled', window.scrollY > 60);
    }, { passive: true });


    // ─── BACK TO TOP BUTTON ───
    const backToTop = document.querySelector('.back-to-top');
    if (backToTop) {
        window.addEventListener('scroll', () => {
            backToTop.classList.toggle('visible', window.scrollY > 600);
        }, { passive: true });

        backToTop.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }


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
            if (menuOpen) {
                closeMobileMenu();
            } else {
                openMobileMenu();
            }
        });

        // Close on anchor link click
        mobileNav.querySelectorAll('a').forEach(a => {
            a.addEventListener('click', () => {
                closeMobileMenu();
            });
        });

        // Close on outside click
        document.addEventListener('click', e => {
            if (menuOpen && !burger.contains(e.target) && !mobileNav.contains(e.target)) {
                closeMobileMenu();
            }
        });

        // Close on Escape key press
        document.addEventListener('keydown', e => {
            if (e.key === 'Escape' && menuOpen) {
                closeMobileMenu();
            }
        });
    }


    // ─── SMOOTH SCROLL ───
    document.querySelectorAll('a[href^="#"]').forEach(a => {
        a.addEventListener('click', e => {
            const target = document.querySelector(a.getAttribute('href'));
            if (target) { e.preventDefault(); target.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
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

    // Add CSS for revealed state
    const style = document.createElement('style');
    style.textContent = '.revealed { opacity: 1 !important; transform: translateY(0) !important; }';
    document.head.appendChild(style);


    // ─── TOUCH GESTURE SUPPORT (Hero Preview Panel) ───
    const heroPreview = document.querySelector('.hero-preview');
    if (heroPreview && 'ontouchstart' in window) {
        let touchStartX = 0;
        let touchStartY = 0;

        heroPreview.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
        }, { passive: true });

        heroPreview.addEventListener('touchend', (e) => {
            const touchEndX = e.changedTouches[0].clientX;
            const touchEndY = e.changedTouches[0].clientY;
            const dx = touchEndX - touchStartX;
            const dy = touchEndY - touchStartY;

            // Only detect horizontal swipes (not vertical scrolls)
            if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) {
                heroPreview.style.transform = dx > 0
                    ? 'translateX(8px)'
                    : 'translateX(-8px)';
                setTimeout(() => {
                    heroPreview.style.transition = 'transform 0.3s ease';
                    heroPreview.style.transform = '';
                    setTimeout(() => { heroPreview.style.transition = ''; }, 300);
                }, 100);
            }
        }, { passive: true });
    }

});

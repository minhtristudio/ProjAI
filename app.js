/* ============================================
   ProjAI — Dynamic Floating Squares + Interactions
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {

    // ==============================
    // Floating Squares Particle System
    // ==============================
    const canvas = document.getElementById('particleCanvas');
    const ctx = canvas.getContext('2d');
    let particles = [];
    let animationId;
    let mouseX = 0, mouseY = 0;

    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Track mouse for interactive effects
    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
    });

    // Color palette for squares
    const colors = [
        { r: 168, g: 85, b: 247 },   // purple
        { r: 99, g: 102, b: 241 },   // blue
        { r: 6, g: 182, b: 212 },    // cyan
        { r: 236, g: 72, b: 153 },   // pink
        { r: 245, g: 158, b: 11 },   // amber
        { r: 34, g: 197, b: 94 },    // green
    ];

    class Particle {
        constructor() {
            this.reset(true);
        }

        reset(initial = false) {
            this.x = Math.random() * canvas.width;
            this.y = initial ? Math.random() * canvas.height : canvas.height + 50;
            this.size = Math.random() * 30 + 5;
            this.baseSize = this.size;
            this.speedY = -(Math.random() * 0.4 + 0.1);
            this.speedX = (Math.random() - 0.5) * 0.3;
            this.rotation = Math.random() * Math.PI * 2;
            this.rotationSpeed = (Math.random() - 0.5) * 0.01;
            this.opacity = 0;
            this.maxOpacity = Math.random() * 0.12 + 0.03;
            this.fadeIn = true;
            this.fadeSpeed = Math.random() * 0.003 + 0.001;
            this.color = colors[Math.floor(Math.random() * colors.length)];
            this.borderOnly = Math.random() > 0.4;
            this.borderRadius = Math.random() * 6 + 2;
            this.life = 0;
            this.maxLife = Math.random() * 600 + 300;
            this.glowIntensity = Math.random() * 0.5 + 0.2;
            this.pulseSpeed = Math.random() * 0.02 + 0.01;
            this.pulseOffset = Math.random() * Math.PI * 2;
        }

        update() {
            this.life++;
            
            // Movement
            this.y += this.speedY;
            this.x += this.speedX;
            this.rotation += this.rotationSpeed;

            // Mouse interaction — gentle push away
            const dx = this.x - mouseX;
            const dy = this.y - mouseY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 200) {
                const force = (200 - dist) / 200 * 0.3;
                this.x += (dx / dist) * force;
                this.y += (dy / dist) * force;
            }

            // Fade in
            if (this.fadeIn && this.opacity < this.maxOpacity) {
                this.opacity += this.fadeSpeed;
                if (this.opacity >= this.maxOpacity) {
                    this.opacity = this.maxOpacity;
                    this.fadeIn = false;
                }
            }

            // Pulse effect
            const pulse = Math.sin(this.life * this.pulseSpeed + this.pulseOffset);
            this.size = this.baseSize * (1 + pulse * 0.15);

            // Fade out near end of life
            if (this.life > this.maxLife * 0.7) {
                this.opacity *= 0.995;
            }

            // Reset when dead or off-screen
            if (this.life > this.maxLife || this.opacity < 0.001 || this.y < -100) {
                this.reset();
            }
        }

        draw() {
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(this.rotation);
            ctx.globalAlpha = this.opacity;

            const halfSize = this.size / 2;
            const { r, g, b } = this.color;

            if (this.borderOnly) {
                // Outlined square with glow
                ctx.shadowColor = `rgba(${r}, ${g}, ${b}, ${this.glowIntensity})`;
                ctx.shadowBlur = 15;
                ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${this.opacity * 3})`;
                ctx.lineWidth = 1;
                this.drawRoundedRect(ctx, -halfSize, -halfSize, this.size, this.size, this.borderRadius);
                ctx.stroke();
            } else {
                // Filled square with subtle glow
                ctx.shadowColor = `rgba(${r}, ${g}, ${b}, ${this.glowIntensity})`;
                ctx.shadowBlur = 20;
                ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${this.opacity})`;
                this.drawRoundedRect(ctx, -halfSize, -halfSize, this.size, this.size, this.borderRadius);
                ctx.fill();
                
                // Inner highlight
                ctx.fillStyle = `rgba(255, 255, 255, ${this.opacity * 0.3})`;
                this.drawRoundedRect(ctx, -halfSize + 2, -halfSize + 2, this.size - 4, this.size / 2 - 2, this.borderRadius - 1);
                ctx.fill();
            }

            ctx.restore();
        }

        drawRoundedRect(ctx, x, y, w, h, r) {
            r = Math.min(r, w / 2, h / 2);
            ctx.beginPath();
            ctx.moveTo(x + r, y);
            ctx.lineTo(x + w - r, y);
            ctx.quadraticCurveTo(x + w, y, x + w, y + r);
            ctx.lineTo(x + w, y + h - r);
            ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
            ctx.lineTo(x + r, y + h);
            ctx.quadraticCurveTo(x, y + h, x, y + h - r);
            ctx.lineTo(x, y + r);
            ctx.quadraticCurveTo(x, y, x + r, y);
            ctx.closePath();
        }
    }

    // Initialize particles
    const PARTICLE_COUNT = Math.min(60, Math.floor(window.innerWidth / 25));
    for (let i = 0; i < PARTICLE_COUNT; i++) {
        particles.push(new Particle());
    }

    // Connection lines between close particles
    function drawConnections() {
        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const dx = particles[i].x - particles[j].x;
                const dy = particles[i].y - particles[j].y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                
                if (dist < 150) {
                    const alpha = (1 - dist / 150) * 0.04 * Math.min(particles[i].opacity, particles[j].opacity) * 10;
                    ctx.beginPath();
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.strokeStyle = `rgba(168, 85, 247, ${alpha})`;
                    ctx.lineWidth = 0.5;
                    ctx.stroke();
                }
            }
        }
    }

    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        drawConnections();

        particles.forEach(p => {
            p.update();
            p.draw();
        });

        animationId = requestAnimationFrame(animate);
    }

    animate();

    // Pause when tab not visible
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            cancelAnimationFrame(animationId);
        } else {
            animate();
        }
    });


    // ==============================
    // FAQ Accordion
    // ==============================
    document.querySelectorAll('[data-faq]').forEach(item => {
        item.addEventListener('click', () => {
            const isActive = item.classList.contains('active');
            
            // Close all
            document.querySelectorAll('[data-faq]').forEach(i => {
                i.classList.remove('active');
            });

            // Toggle clicked
            if (!isActive) {
                item.classList.add('active');
            }
        });
    });


    // ==============================
    // Mobile Menu
    // ==============================
    const mobileBtn = document.getElementById('mobileMenuBtn');
    const mobileMenu = document.getElementById('mobileMenu');

    if (mobileBtn && mobileMenu) {
        mobileBtn.addEventListener('click', () => {
            mobileMenu.classList.toggle('active');
            mobileBtn.classList.toggle('active');
        });

        // Close on link click
        mobileMenu.querySelectorAll('.mobile-link').forEach(link => {
            link.addEventListener('click', () => {
                mobileMenu.classList.remove('active');
                mobileBtn.classList.remove('active');
            });
        });

        // Close on outside click
        document.addEventListener('click', (e) => {
            if (!mobileBtn.contains(e.target) && !mobileMenu.contains(e.target)) {
                mobileMenu.classList.remove('active');
                mobileBtn.classList.remove('active');
            }
        });
    }


    // ==============================
    // Scroll Animations (Intersection Observer)
    // ==============================
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Observe elements with staggered animation
    document.querySelectorAll('.feature-card, .guide-step, .faq-item, .tech-item').forEach((el, i) => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = `opacity 0.6s ease ${i * 0.08}s, transform 0.6s ease ${i * 0.08}s, background 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease`;
        observer.observe(el);
    });

    // Observe section headers
    document.querySelectorAll('.section-header, .notice-card, .footer').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
        observer.observe(el);
    });


    // ==============================
    // Navbar scroll effect
    // ==============================
    let lastScroll = 0;
    const navbar = document.querySelector('.navbar');
    
    window.addEventListener('scroll', () => {
        const scroll = window.scrollY;
        
        if (scroll > 100) {
            navbar.style.background = 'rgba(10, 10, 26, 0.8)';
            navbar.style.borderColor = 'rgba(255, 255, 255, 0.08)';
        } else {
            navbar.style.background = 'rgba(10, 10, 26, 0.6)';
            navbar.style.borderColor = 'rgba(255, 255, 255, 0.06)';
        }
        
        lastScroll = scroll;
    });


    // ==============================
    // Smooth scroll for anchor links
    // ==============================
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });


    // ==============================
    // Dynamic grid lines (subtle)
    // ==============================
    function drawGrid() {
        // This adds a very subtle grid pattern to the canvas
        ctx.globalAlpha = 0.01;
        ctx.strokeStyle = '#a855f7';
        ctx.lineWidth = 0.5;
        
        const gridSize = 80;
        for (let x = 0; x < canvas.width; x += gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, canvas.height);
            ctx.stroke();
        }
        for (let y = 0; y < canvas.height; y += gridSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(canvas.width, y);
            ctx.stroke();
        }
        ctx.globalAlpha = 1;
    }

    // Integrate grid into main animation
    const originalAnimate = animate;
    cancelAnimationFrame(animationId);
    
    function animateWithGrid() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        drawGrid();
        drawConnections();
        
        particles.forEach(p => {
            p.update();
            p.draw();
        });
        
        animationId = requestAnimationFrame(animateWithGrid);
    }
    
    animateWithGrid();

    // Re-bind visibility change
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            cancelAnimationFrame(animationId);
        } else {
            animateWithGrid();
        }
    });

});

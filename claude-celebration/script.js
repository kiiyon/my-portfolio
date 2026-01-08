// 紙吹雪アニメーション
function createConfetti() {
    const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#f7b731', '#5f27cd', '#00d2d3'];
    const confettiContainer = document.querySelector('.celebration');

    for (let i = 0; i < 50; i++) {
        const confetti = document.createElement('div');
        confetti.style.position = 'absolute';
        confetti.style.width = Math.random() * 10 + 5 + 'px';
        confetti.style.height = Math.random() * 10 + 5 + 'px';
        confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.left = Math.random() * 100 + '%';
        confetti.style.top = '-20px';
        confetti.style.opacity = Math.random();
        confetti.style.borderRadius = Math.random() > 0.5 ? '50%' : '0%';
        confetti.style.animation = `fall ${Math.random() * 3 + 2}s linear infinite`;
        confetti.style.animationDelay = Math.random() * 5 + 's';
        confettiContainer.appendChild(confetti);
    }
}

// 紙吹雪の落下アニメーション
const style = document.createElement('style');
style.textContent = `
    @keyframes fall {
        to {
            transform: translateY(100vh) rotate(360deg);
        }
    }
`;
document.head.appendChild(style);

// スクロールアニメーション
function handleScrollAnimation() {
    const elements = document.querySelectorAll('.feature-card, .capability-item');

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, {
        threshold: 0.1
    });

    elements.forEach(element => {
        observer.observe(element);
    });
}

// カーソルエフェクト
function createCursorEffect() {
    const cursor = document.createElement('div');
    cursor.style.width = '20px';
    cursor.style.height = '20px';
    cursor.style.borderRadius = '50%';
    cursor.style.background = 'rgba(255, 255, 255, 0.5)';
    cursor.style.position = 'fixed';
    cursor.style.pointerEvents = 'none';
    cursor.style.zIndex = '9999';
    cursor.style.transition = 'transform 0.1s ease';
    document.body.appendChild(cursor);

    document.addEventListener('mousemove', (e) => {
        cursor.style.left = e.clientX - 10 + 'px';
        cursor.style.top = e.clientY - 10 + 'px';
    });

    document.addEventListener('mousedown', () => {
        cursor.style.transform = 'scale(1.5)';
    });

    document.addEventListener('mouseup', () => {
        cursor.style.transform = 'scale(1)';
    });
}

// 機能カードホバーエフェクト
function addCardEffects() {
    const cards = document.querySelectorAll('.feature-card');

    cards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transition = 'all 0.3s ease';
        });
    });
}

// Capability アイテムのインタラクション
function addCapabilityEffects() {
    const items = document.querySelectorAll('.capability-item');

    items.forEach(item => {
        item.addEventListener('click', function() {
            // クリック時のアニメーション
            this.style.transform = 'scale(1.2) rotate(10deg)';
            setTimeout(() => {
                this.style.transform = 'scale(1) rotate(0deg)';
            }, 300);
        });
    });
}

// CTAボタンのエフェクト
function addButtonEffect() {
    const button = document.querySelector('.cta-button');

    button.addEventListener('click', function() {
        // クリック時のエフェクト
        const ripple = document.createElement('span');
        ripple.style.position = 'absolute';
        ripple.style.width = '100%';
        ripple.style.height = '100%';
        ripple.style.borderRadius = '50%';
        ripple.style.background = 'rgba(102, 126, 234, 0.5)';
        ripple.style.transform = 'scale(0)';
        ripple.style.animation = 'ripple 0.6s ease-out';
        this.appendChild(ripple);

        setTimeout(() => {
            ripple.remove();
        }, 600);

        // メッセージ表示
        alert('🎉 Claude Desktop へようこそ! 素晴らしい体験をお楽しみください!');
    });
}

// リップルアニメーション
const rippleStyle = document.createElement('style');
rippleStyle.textContent = `
    @keyframes ripple {
        to {
            transform: scale(4);
            opacity: 0;
        }
    }
`;
document.head.appendChild(rippleStyle);

// パーティクルエフェクト（マウスクリック時）
function addParticleEffect() {
    document.addEventListener('click', (e) => {
        const particle = document.createElement('div');
        particle.style.position = 'fixed';
        particle.style.left = e.clientX + 'px';
        particle.style.top = e.clientY + 'px';
        particle.style.width = '10px';
        particle.style.height = '10px';
        particle.style.borderRadius = '50%';
        particle.style.background = '#fff';
        particle.style.pointerEvents = 'none';
        particle.style.animation = 'particle-burst 0.5s ease-out forwards';
        particle.style.zIndex = '9999';
        document.body.appendChild(particle);

        setTimeout(() => {
            particle.remove();
        }, 500);
    });
}

const particleStyle = document.createElement('style');
particleStyle.textContent = `
    @keyframes particle-burst {
        0% {
            transform: scale(0);
            opacity: 1;
        }
        100% {
            transform: scale(3);
            opacity: 0;
        }
    }
`;
document.head.appendChild(particleStyle);

// 初期化
document.addEventListener('DOMContentLoaded', () => {
    createConfetti();
    handleScrollAnimation();
    createCursorEffect();
    addCardEffects();
    addCapabilityEffects();
    addButtonEffect();
    addParticleEffect();

    // ウェルカムメッセージ
    console.log('%c🎉 Claude Desktop へようこそ! 🎉', 'font-size: 20px; color: #667eea; font-weight: bold;');
    console.log('%c素晴らしい体験をお楽しみください!', 'font-size: 14px; color: #764ba2;');
});

// スムーズスクロール
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

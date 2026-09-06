
document.addEventListener('DOMContentLoaded', function () {

    const slider   = document.getElementById('rwServicesSlider');
    const prevBtn  = document.getElementById('rwPrevBtn');
    const nextBtn  = document.getElementById('rwNextBtn');
    const dotsWrap = document.getElementById('rwServicesDots');

    if (!slider || !dotsWrap) return;

    const cards = Array.from(slider.children);

    // بناء النقاط
    cards.forEach((_, i) => {
        const dot = document.createElement('button');
        dot.className = 'rw-dot' + (i === 0 ? ' active' : '');
        dot.setAttribute('aria-label', 'انتقل للكارت ' + (i + 1));
        dot.addEventListener('click', () => scrollToCard(i));
        dotsWrap.appendChild(dot);
    });

    const dots = Array.from(dotsWrap.children);

    function scrollToCard(index) {
        const card = cards[index];
        if (!card) return;

        slider.scrollTo({
            left: card.offsetLeft - (slider.clientWidth - card.clientWidth) / 2,
            behavior: 'smooth'
        });
    }

    function getActiveIndex() {
        const center = slider.scrollLeft + slider.clientWidth / 2;
        let closest = 0;
        let min = Infinity;

        cards.forEach((card, i) => {
            const cardCenter = card.offsetLeft + card.clientWidth / 2;
            const dist = Math.abs(center - cardCenter);

            if (dist < min) {
                min = dist;
                closest = i;
            }
        });

        return closest;
    }

    function updateDots() {
        const active = getActiveIndex();
        dots.forEach((d, i) => d.classList.toggle('active', i === active));
    }

    prevBtn?.addEventListener('click', () => {
        scrollToCard(Math.max(0, getActiveIndex() - 1));
    });

    nextBtn?.addEventListener('click', () => {
        scrollToCard(Math.min(cards.length - 1, getActiveIndex() + 1));
    });

    let scrollTimer;
    slider.addEventListener('scroll', () => {
        clearTimeout(scrollTimer);
        scrollTimer = setTimeout(updateDots, 80);
    });

    window.addEventListener('resize', updateDots);

    updateDots();
});
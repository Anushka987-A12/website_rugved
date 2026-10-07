(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const all = (sel, root = document) => [...root.querySelectorAll(sel)];

  // Scroll progress bar + navbar state
  const bar = document.createElement('div');
  bar.className = 'scroll-progress';
  document.body.prepend(bar);
  const navbar = document.querySelector('.navbar');
  const onScroll = () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    bar.style.transform = `scaleX(${max > 0 ? scrollY / max : 0})`;
    navbar?.classList.toggle('scrolled', scrollY > 10);
  };
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Staggered reveal for cards, timeline items and focus areas
  const SELECTOR = '.project-card, .timeline-item, .focus-list li, .sponsor-logo, .join-card, .image-placeholder';
  const io = new IntersectionObserver(entries => entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add('in');
    io.unobserve(entry.target);
  }), { threshold: .12 });
  const reveal = root => all(SELECTOR, root).forEach(el => {
    if (reduce || el.classList.contains('reveal')) return;
    el.style.setProperty('--d', Math.min([...el.parentElement.children].indexOf(el), 5) * 90 + 'ms');
    el.classList.add('reveal');
    io.observe(el);
  });
  reveal(document);

  // Project filter re-renders the grid, so reveal the new cards too
  const grid = document.querySelector('#project-grid');
  if (grid) new MutationObserver(() => reveal(grid)).observe(grid, { childList: true });

  // Cursor spotlight on cards
  document.addEventListener('pointermove', event => {
    const card = event.target.closest?.('.project-card');
    if (!card) return;
    const rect = card.getBoundingClientRect();
    card.style.setProperty('--mx', `${event.clientX - rect.left}px`);
    card.style.setProperty('--my', `${event.clientY - rect.top}px`);
  });

  // Highlight the nav item for the section in view (home page)
  const links = all('.nav-links [data-scroll]');
  if (links.length) {
    const spy = new IntersectionObserver(entries => entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      links.forEach(link => link.classList.toggle('active', link.dataset.scroll === '#' + entry.target.id));
    }), { rootMargin: '-45% 0px -50% 0px' });
    links.forEach(link => {
      const target = document.querySelector(link.dataset.scroll);
      if (target) spy.observe(target);
    });
  }

  // Typewriter tagline under the hero logo
  const hero = document.querySelector('.hero-content');
  if (hero) {
    const phrases = [
      'Remote Unmanned Ground Vehicular Electronic Defence Systems',
      'Autonomy. Robotics. Electronics.',
      'Defence technology with a real-world edge'
    ];
    const line = document.createElement('p');
    line.className = 'typed';
    hero.append(line);
    if (reduce) {
      line.textContent = phrases[0];
    } else {
      let phrase = 0, count = 0, erasing = false;
      const tick = () => {
        const text = phrases[phrase];
        count += erasing ? -1 : 1;
        line.textContent = text.slice(0, count);
        let wait = erasing ? 22 : 50;
        if (!erasing && count === text.length) { erasing = true; wait = 1800; }
        else if (erasing && count === 0) { erasing = false; phrase = (phrase + 1) % phrases.length; wait = 350; }
        setTimeout(tick, wait);
      };
      tick();
    }
  }
})();

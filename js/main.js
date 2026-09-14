document.addEventListener('DOMContentLoaded', () => {
  const pageScrollStates = [
    {
      path: /(?:^|\/)biblioteca\.html$/i,
      key: 'arcadya-library-scroll',
      referrer: /\/(?:juegos|add-on)\//i
    },
    {
      path: /(?:^|\/)index\.html$/i,
      key: 'arcadya-home-scroll',
      referrer: /\/biblioteca\.html|\/(?:juegos|add-on)\//i
    }
  ];

  const currentPageState = pageScrollStates.find(page => page.path.test(window.location.pathname));

  if (currentPageState) {
    history.scrollRestoration = 'manual';
    const navigationEntry = performance.getEntriesByType('navigation')[0];
    const navigationType = navigationEntry?.type || 'navigate';
    const cameFromContent = currentPageState.referrer.test(document.referrer);
    const shouldRestore = navigationType === 'back_forward' || (navigationType === 'navigate' && cameFromContent);
    const savedScroll = shouldRestore ? Number(sessionStorage.getItem(currentPageState.key)) : 0;

    if (Number.isFinite(savedScroll) && savedScroll > 0) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => window.scrollTo(0, savedScroll));
      });
    } else {
      sessionStorage.removeItem(currentPageState.key);
      window.scrollTo(0, 0);
    }

    let scrollFrame = 0;
    window.addEventListener('scroll', () => {
      if (!scrollFrame) {
        scrollFrame = requestAnimationFrame(() => {
          sessionStorage.setItem(currentPageState.key, String(window.scrollY));
          scrollFrame = 0;
        });
      }
    }, { passive: true });
  }

  const revealItems = document.querySelectorAll(
    '.topbar-inner, .logo-area, .nav-links a, .hero-split > div, .category-banner, .section-title, .search-box, ' +
    '.game-card, .info-card, .info-box, .game-detail, .game-cover, .game-info, .actions .btn, .footer-col'
  );

  if (revealItems.length) {
    const quickReveal = /(?:biblioteca\.html|juegos\/|add-on\/)/i.test(window.location.pathname);
    const revealDirections = [{ y: '52px', rotateX: '9deg' }];

    if (quickReveal) document.body.classList.add('quick-reveal');

    revealItems.forEach((item, index) => {
      const direction = revealDirections[index % revealDirections.length];
      item.classList.add('reveal-item', 'reveal-hidden');
      item.style.setProperty('--reveal-y', direction.y);
      item.style.setProperty('--reveal-rotate-x', direction.rotateX);
      item.style.setProperty('--reveal-delay', `${(index % 5) * 16}ms`);
    });

    requestAnimationFrame(() => {
      const showItem = (item) => {
        item.classList.add('reveal-visible');
        item.addEventListener('animationend', () => item.classList.remove('reveal-hidden'), { once: true });
      };

      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        revealItems.forEach(item => item.classList.remove('reveal-hidden'));
      } else if (!('IntersectionObserver' in window)) {
        revealItems.forEach(showItem);
      } else {
        const revealObserver = new IntersectionObserver((entries, observer) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              showItem(entry.target);
              observer.unobserve(entry.target);
            }
          });
        }, { threshold: 0.05, rootMargin: '0px 0px -4% 0px' });

        revealItems.forEach(item => revealObserver.observe(item));
      }
    });
  }

  const toggle = document.querySelector('.nav-toggle');
  const links = document.querySelector('.nav-links');
  if (toggle && links) {
    toggle.addEventListener('click', () => links.classList.toggle('open'));
    links.querySelectorAll('a').forEach(a =>
      a.addEventListener('click', () => links.classList.remove('open'))
    );
  }

  const btnVer = document.getElementById('btn-ver-imagenes');
  const modal = document.getElementById('modal-imagenes');
  const closeBtn = document.getElementById('modal-close');

  if (btnVer && modal) {
    btnVer.addEventListener('click', () => {
      modal.classList.add('active');
      document.body.style.overflow = 'hidden';
    });

    const close = () => {
      modal.classList.remove('active');
      document.body.style.overflow = '';
    };

    if (closeBtn) closeBtn.addEventListener('click', close);

    modal.addEventListener('click', (e) => {
      if (e.target === modal) close();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.classList.contains('active')) close();
    });
  }

  const searchInput = document.getElementById('search-input');
  const gamesGrid = document.getElementById('games-grid');
  const noResults = document.getElementById('no-results');

  if (searchInput && gamesGrid) {
    searchInput.addEventListener('input', () => {
      const query = searchInput.value.toLowerCase().trim();
      const cards = gamesGrid.querySelectorAll('.game-card');
      let visible = 0;

      cards.forEach(card => {
        const title = card.querySelector('.game-card-title')?.textContent.toLowerCase() || '';
        if (title.includes(query)) {
          card.style.display = '';
          visible++;
        } else {
          card.style.display = 'none';
        }
      });

      if (noResults) {
        noResults.style.display = visible === 0 ? 'block' : 'none';
      }
    });
  }
});

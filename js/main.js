// Roger Loomis — Main JS

document.addEventListener('DOMContentLoaded', () => {

  // Mobile nav toggle
  const toggle = document.querySelector('.nav-toggle');
  const navLinks = document.querySelector('.nav-links');
  if (toggle && navLinks) {
    toggle.addEventListener('click', () => {
      navLinks.classList.toggle('open');
      toggle.setAttribute('aria-expanded', navLinks.classList.contains('open'));
    });
    // Close on link click
    navLinks.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => navLinks.classList.remove('open'));
    });
  }

  // Active nav link
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach(a => {
    if (a.getAttribute('href') === currentPage) a.classList.add('active');
  });

  // Contact form handler
  const form = document.getElementById('contact-form');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = form.querySelector('button[type="submit"]');
      const orig = btn.textContent;
      btn.textContent = 'Sending...';
      btn.disabled = true;

      const data = Object.fromEntries(new FormData(form));
      const body = `Name: ${data.name}\nEmail: ${data.email}\nSubject: ${data.subject || 'Website Contact'}\nMessage:\n${data.message}`;

      try {
        await fetch(`https://formsubmit.co/ajax/contact@adamloomis.online`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify({ name: data.name, email: data.email, subject: data.subject || 'Website Contact', message: data.message, _captcha: 'false' })
        });
        form.innerHTML = '<div class="form-success"><h3>Thank you!</h3><p>Your message has been sent. Roger will be in touch soon.</p></div>';
      } catch {
        btn.textContent = orig;
        btn.disabled = false;
        alert('Something went wrong. Please try again or email directly.');
      }
    });
  }

  // Scroll reveal
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

});

// public/app.js
(function(){
  const yEl = document.getElementById('year');
  if (yEl) yEl.textContent = new Date().getFullYear();

  const cfg = window.APP_CONFIG || {};
  const cardEls = {
    banner: document.getElementById('dc-banner'),
    avatar: document.getElementById('dc-avatar'),
    name: document.getElementById('dc-name'),
    sub: document.getElementById('dc-sub')
  };

  async function loadDiscord() {
    const uid = cfg.DISCORD_USER_ID;
    const url = `${cfg.DISCORD_ENDPOINT}?user_id=${encodeURIComponent(uid)}`;
    try {
      const r = await fetch(url, { method:'GET' });
      if (!r.ok) throw new Error('Discord fetch failed');
      const data = await r.json();

      if (cardEls.avatar) cardEls.avatar.src = data.avatar;
      if (cardEls.name)   cardEls.name.textContent = data.global_name || data.username || 'Uživatel';
      if (cardEls.sub)    cardEls.sub.textContent  = `@${data.username || 'discord'}`;

      if (cardEls.banner && data.banner) {
        cardEls.banner.style.backgroundImage = `url('${data.banner}')`;
        cardEls.banner.style.backgroundSize = 'cover';
        cardEls.banner.style.backgroundPosition = 'center';
      }
    } catch (e) {
      if (cardEls.name) cardEls.name.textContent = 'Discord načtení selhalo';
      if (cardEls.sub)  cardEls.sub.textContent = 'Zkus obnovit stránku';
    }
  }

  // Discord karta je na více stránkách – pokud elementy existují, stáhni data
  if (document.getElementById('discord-card')) loadDiscord();
})();

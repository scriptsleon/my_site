// netlify/functions/discord-user.js
// Classic handler syntax – funguje stabilně na Netlify Node 18+ (fetch je vestavěný).
// Env var: DISCORD_BOT_TOKEN  (Netlify Dashboard → Site settings → Environment variables)

const API = 'https://discord.com/api/v10';

exports.handler = async (event) => {
  try {
    // CORS pro browser fetch
    const cors = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };
    if (event.httpMethod === 'OPTIONS') {
      return { statusCode: 204, headers: cors };
    }

    const userId = (event.queryStringParameters && event.queryStringParameters.user_id) || '';
    if (!userId) {
      return { statusCode: 400, headers: cors, body: JSON.stringify({ error: 'Missing user_id' }) };
    }

    const token = process.env.DISCORD_BOT_TOKEN;
    if (!token) {
      return { statusCode: 500, headers: cors, body: JSON.stringify({ error: 'Missing DISCORD_BOT_TOKEN' }) };
    }

    const res = await fetch(`${API}/users/${encodeURIComponent(userId)}`, {
      headers: { Authorization: `Bot ${token}` }
    });

    if (!res.ok) {
      const txt = await res.text().catch(() => '');
      return { statusCode: res.status, headers: cors, body: JSON.stringify({ error: txt || 'Discord API error' }) };
    }

    const user = await res.json();

    // Slož avatar URL (gif pro animované avatary, png fallback)
    // https://discord.com/developers/docs/resources/user , https://discord.com/developers/docs/reference
    let avatarUrl;
    if (user.avatar) {
      const isAnimated = user.avatar.startsWith('a_');
      const ext = isAnimated ? 'gif' : 'png';
      avatarUrl = `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.${ext}?size=512`;
    } else {
      // Default avatar (fallback – jednoduchá varianta)
      avatarUrl = `https://cdn.discordapp.com/embed/avatars/0.png`;
    }

    // Banner (pokud má)
    let bannerUrl = null;
    if (user.banner) {
      const isAnimated = user.banner.startsWith('a_');
      const ext = isAnimated ? 'gif' : 'png';
      bannerUrl = `https://cdn.discordapp.com/banners/${user.id}/${user.banner}.${ext}?size=1024`;
    }

    const payload = {
      id: user.id,
      username: user.username || null,
      global_name: user.global_name || null,
      discriminator: user.discriminator || null,
      public_flags: user.public_flags || 0,
      avatar: avatarUrl,
      banner: bannerUrl
      // Pozn.: Presence a status vyžadují Gateway a privilegované intent – mimo čistý REST.
    };

    return { statusCode: 200, headers: { 'Content-Type': 'application/json', ...cors }, body: JSON.stringify(payload) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message || 'Server error' }) };
  }
};

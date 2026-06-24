// ================================================
// StillWorks – Engagement Layer
// Handles: views, likes, dislikes, star ratings,
//          comments, and seller subscriptions
// Requires: CONFIG.ENGAGEMENT_API_URL in config.js
// ================================================

const ENG = (() => {

  const API = () => CONFIG.ENGAGEMENT_API_URL;

  // ── Local identity (anonymous viewer id) ─────
  function getViewerId() {
    let id = localStorage.getItem('sw_viewer_id');
    if (!id) {
      id = 'v_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
      localStorage.setItem('sw_viewer_id', id);
    }
    return id;
  }

  // ── Logged-in user shorthand ──────────────────
  function currentUser() { return DB.getCurrentUser(); }
  function userId() {
    const u = currentUser();
    return u ? (u.phone || u.email || u.id) : getViewerId();
  }

  // ── Generic fetch helper ──────────────────────
  async function post(payload) {
    if (!API()) return null;
    try {
      const res = await fetch(API(), {
        method: 'POST',
        redirect: 'follow',
        headers: { 'Content-Type': 'text/plain' }, // text/plain avoids CORS preflight
        body: JSON.stringify(payload),
      });
      return await res.json();
    } catch (e) {
      console.warn('ENG fetch error', e);
      return null;
    }
  }

  // ── VIEW ──────────────────────────────────────
  // Call once per product page load. Deduped server-side by (productId + userId + date).
  async function logView(productId) {
    return post({ action: 'logView', productId, userId: getViewerId() });
  }

  // ── GET ENGAGEMENT (views, likes, dislikes, rating, commentCount) ──
  async function getEngagement(productId) {
    if (!API()) return null;
    try {
      const url = `${API()}?action=getEngagement&productId=${encodeURIComponent(productId)}`;
      const res = await fetch(url, { redirect: 'follow' });
      return await res.json();
    } catch (e) { return null; }
  }

  // ── LIKE / DISLIKE ────────────────────────────
  async function toggleLike(productId) {
    return post({ action: 'toggleLike', productId, userId: userId() });
  }
  async function toggleDislike(productId) {
    return post({ action: 'toggleDislike', productId, userId: userId() });
  }

  // ── STAR RATING ───────────────────────────────
  // rating: integer 1–5
  async function submitRating(productId, rating) {
    return post({ action: 'submitRating', productId, userId: userId(), rating });
  }

  // ── COMMENTS ──────────────────────────────────
  async function getComments(productId) {
    if (!API()) return [];
    try {
      const url = `${API()}?action=getComments&productId=${encodeURIComponent(productId)}`;
      const res = await fetch(url, { redirect: 'follow' });
      const data = await res.json();
      return data.comments || [];
    } catch (e) { return []; }
  }

  async function postComment(productId, text) {
    const u = currentUser();
    return post({
      action: 'postComment',
      productId,
      userId: userId(),
      userName: u ? u.name || u.sellerName || 'Anonymous' : 'Anonymous',
      text: text.trim().slice(0, 500),
    });
  }

  async function deleteComment(commentId) {
    return post({ action: 'deleteComment', commentId, userId: userId() });
  }

  // ── SUBSCRIPTIONS ─────────────────────────────
  async function getSellerEngagement(sellerPhone) {
    if (!API()) return null;
    try {
      const url = `${API()}?action=getSellerEngagement&sellerPhone=${encodeURIComponent(sellerPhone)}&userId=${encodeURIComponent(userId())}`;
      const res = await fetch(url, { redirect: 'follow' });
      return await res.json();
    } catch (e) { return null; }
  }

  async function toggleSubscribe(sellerPhone) {
    return post({ action: 'toggleSubscribe', sellerPhone, userId: userId() });
  }

  // ── GET NEW LISTINGS FROM SUBSCRIBED SELLERS ──
  async function getSubscriptionFeed() {
    return post({ action: 'getSubscriptionFeed', userId: userId() });
  }

  // ── BATCH engagement for product cards (used in shop/home) ───────────
  async function getBatchEngagement(productIds) {
    if (!API() || !productIds.length) return {};
    try {
      const url = `${API()}?action=getBatchEngagement&ids=${encodeURIComponent(productIds.join(','))}`;
      const res = await fetch(url, { redirect: 'follow' });
      const data = await res.json();
      return data.results || {};
    } catch (e) { return {}; }
  }

  // ── STAR DISPLAY HELPER ───────────────────────
  // Returns an HTML string of 5 star SVGs filled to avgRating
  function starsHtml(avgRating, size = 14) {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      const filled = i <= Math.round(avgRating);
      stars.push(`<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="${filled ? '#f59e0b' : 'none'}" stroke="${filled ? '#f59e0b' : '#d1d5db'}" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`);
    }
    return stars.join('');
  }

  // ── POPULARITY SCORE ──────────────────────────
  // Used for "Most Popular" sort
  function popularityScore(eng) {
    if (!eng) return 0;
    const views    = parseInt(eng.views)    || 0;
    const likes    = parseInt(eng.likes)    || 0;
    const dislikes = parseInt(eng.dislikes) || 0;
    const rating   = parseFloat(eng.avgRating) || 0;
    const comments = parseInt(eng.commentCount) || 0;
    return views + (likes * 3) - (dislikes * 2) + (rating * 10) + (comments * 2);
  }

  return {
    logView,
    getEngagement,
    toggleLike,
    toggleDislike,
    submitRating,
    getComments,
    postComment,
    deleteComment,
    getSellerEngagement,
    toggleSubscribe,
    getSubscriptionFeed,
    getBatchEngagement,
    starsHtml,
    popularityScore,
    userId,
  };
})();

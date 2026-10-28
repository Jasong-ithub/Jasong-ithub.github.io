// Fictional demo shop for the sample report: cart in localStorage, with the faults real shops have
window.cart = {
  get() { try { return JSON.parse(localStorage.getItem('excart') || '[]'); } catch { return []; } },
  add(item) { const c = this.get(); c.push(item); localStorage.setItem('excart', JSON.stringify(c)); },
};
document.addEventListener('DOMContentLoaded', () => {
  // Cookie banner with only an "Accept" option, made of a div the keyboard cannot reach
  if (!localStorage.getItem('exconsent')) {
    const b = document.createElement('div');
    b.id = 'cookie-bar';
    b.innerHTML = 'We use cookies to give you the best experience on our website. <div class="accept" style="display:inline-block;padding:8px 16px;background:#8faa8c;color:#fff;cursor:pointer;margin-left:10px">Accept all</div>';
    b.style.cssText = 'position:fixed;bottom:0;left:0;right:0;background:#2b2b2b;color:#fff;padding:14px 28px;z-index:50;font:14px Arial,sans-serif';
    b.querySelector('.accept').addEventListener('click', () => { localStorage.setItem('exconsent', '1'); b.remove(); });
    document.body.appendChild(b);
  }
  // Basket icon: a div with a click handler, so the keyboard cannot reach it
  const basket = document.getElementById('basket-icon');
  if (basket) basket.addEventListener('click', () => { location.href = '/example-shop/basket.html'; });
  const count = document.getElementById('basket-count');
  if (count) count.textContent = cart.get().length;
});

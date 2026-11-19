// QR des tables : générés par le serveur (la clé reste chez Netlify), affichés pour l'impression.
const planche = document.querySelector('#planche');
const r = await fetch('/api/cuisine/qr', { credentials: 'same-origin' });
if (r.status === 401) location.href = '/cuisine/';
else if (!r.ok) planche.textContent = 'Impossible de charger les QR. Réessayez.';
else {
  const { tables } = await r.json();
  planche.replaceChildren(...tables.map((t) => {
    const carte = document.createElement('article');
    carte.className = 'chevalet';
    const logo = Object.assign(document.createElement('img'), { src: '/assets/logo.svg', alt: 'Yäya Lounge', className: 'logo' });
    const num = document.createElement('div');
    num.className = 'num';
    num.append('Table', Object.assign(document.createElement('b'), { textContent: t.table }));
    const code = document.createElement('div');
    code.className = 'code';
    const svg = new DOMParser().parseFromString(t.svg, 'image/svg+xml').documentElement;
    if (svg.nodeName === 'svg') { svg.querySelectorAll('script, foreignObject').forEach((n) => n.remove()); code.append(document.importNode(svg, true)); }
    const p = Object.assign(document.createElement('p'), { textContent: 'Scannez pour commander' });
    carte.append(logo, num, code, p);
    return carte;
  }));
}
document.querySelector('#imprimer').onclick = () => print();

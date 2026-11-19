// Lecture, modification, écriture conditionnelle ; on recommence si un autre appareil a écrit entre-temps.
// Deux commandes envoyées à la même seconde ne s'écrasent jamais.
export async function modifier(stockage, cle, changer, initial) {
  for (let essai = 0; essai < 8; essai++) {
    const lu = await stockage.lire(cle);
    const avant = lu ? lu.valeur : initial();
    const { valeur, resultat } = await changer(structuredClone(avant));
    if (await stockage.ecrire(cle, valeur, lu ? lu.version : null)) return resultat;
    await new Promise((r) => setTimeout(r, 25 + Math.random() * 60 * (essai + 1)));
  }
  throw Object.assign(new Error('Trop d’écritures simultanées'), { statut: 503 });
}

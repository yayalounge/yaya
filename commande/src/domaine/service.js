// Horaires du salon (heure de Paris) : 17 h à 2 h, le service passe minuit.
// Le « jour de service » change à 6 h : une commande de 1 h du matin appartient à la soirée de la veille.

const minutes = (hhmm) => {
  const [h, m] = String(hhmm).split(':').map(Number);
  return h * 60 + (m || 0);
};

export function heureLocale(date, fuseau) {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', { timeZone: fuseau, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
      .formatToParts(date)
      .map((x) => [x.type, x.value]),
  );
  return { jour: `${p.year}-${p.month}-${p.day}`, minutes: Number(p.hour) * 60 + Number(p.minute) };
}

export function estOuvert(date, horaires) {
  const { minutes: m } = heureLocale(date, horaires.fuseau);
  const o = minutes(horaires.ouverture), f = minutes(horaires.fermeture);
  return o <= f ? m >= o && m < f : m >= o || m < f;
}

export function jourDeService(date, horaires) {
  const { jour, minutes: m } = heureLocale(date, horaires.fuseau);
  if (m >= minutes(horaires.changementDeJour)) return jour;
  const veille = new Date(`${jour}T12:00:00Z`);
  veille.setUTCDate(veille.getUTCDate() - 1);
  return veille.toISOString().slice(0, 10);
}

export const libelleHoraires = (h) => `de ${h.ouverture.replace(':00', ' h').replace(':', ' h ')} à ${h.fermeture.replace(':00', ' h').replace(':', ' h ')}`;

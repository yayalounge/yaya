// Refus prévu par les règles (panier, table, horaires, limites) : son message s'affiche tel quel.
export class ErreurMetier extends Error {
  constructor(code, message, statut = 400) {
    super(message);
    this.name = 'ErreurMetier';
    this.code = code;
    this.statut = statut;
  }
}

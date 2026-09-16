let override = null;

/** Orologio iniettabile: i test possono far scorrere il tempo senza attendere. */
export const now = () => (override === null ? Date.now() : override);
export const setClock = (ms) => { override = ms; };
export const advanceClock = (ms) => { override = (override ?? Date.now()) + ms; };
export const resetClock = () => { override = null; };

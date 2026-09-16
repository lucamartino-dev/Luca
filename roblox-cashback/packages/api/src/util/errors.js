export class HttpError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export const badRequest = (code, message, details) => new HttpError(400, code, message, details);
export const unauthorized = (code = 'unauthorized', message = 'Credenziali mancanti o non valide') =>
  new HttpError(401, code, message);
export const forbidden = (code, message) => new HttpError(403, code, message);
export const notFound = (code = 'not_found', message = 'Risorsa inesistente') => new HttpError(404, code, message);
export const conflict = (code, message) => new HttpError(409, code, message);
export const tooManyRequests = (code, message) => new HttpError(429, code, message);

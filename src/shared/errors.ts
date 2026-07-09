export class HttpError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

export const notFound = (resource: string): HttpError => new HttpError(404, `${resource} not found`);
export const conflict = (message: string): HttpError => new HttpError(409, message);
export const badRequest = (message: string): HttpError => new HttpError(400, message);

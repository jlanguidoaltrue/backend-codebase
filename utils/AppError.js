export default class AppError extends Error {
  constructor(message, status = 500, details) {
    super(message);
    this.status = status;
    if (details) this.details = details;
  }
}

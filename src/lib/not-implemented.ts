export class NotImplementedError extends Error {
  constructor(what: string) {
    super(`${what} is not implemented yet. Set USE_MOCKS=1 to use fixtures.`);
  }
}

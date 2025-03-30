type HeadersInit = {
  deck: string;
  notetype: string;
  html: boolean;
};

export class Headers {
  readonly #init: HeadersInit;

  constructor(init: HeadersInit) {
    this.#init = init;
  }

  toString(): string {
    return Object.entries(this.#init)
      .map(([key, value]) => `#${key}:${value}`)
      .join("\n");
  }
}

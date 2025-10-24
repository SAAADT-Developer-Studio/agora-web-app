export class Measurer {
  #measures = new Set<{
    name: string;
    duration: number;
    description?: string;
  }>();

  async time<Result>(name: string, fn: () => Promise<Result>): Promise<Result> {
    let start = Date.now();
    try {
      return await fn();
    } finally {
      let duration = Date.now() - start;
      this.#measures.add({ name, duration });
    }
  }

  addMeasure(name: string, duration: number, description?: string) {
    this.#measures.add({ name, duration, description });
  }

  toHeaders(headers = new Headers()) {
    for (let { name, duration, description } of this.#measures) {
      let value = `${name};dur=${duration}`;
      if (description) {
        value += `;desc="${description}"`;
      }
      headers.append("Server-Timing", value);
    }
    return headers;
  }
}

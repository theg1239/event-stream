declare global {
  const Bun: {
    JSON5: { parse: (text: string) => unknown };
    file: (path: string) => {
      exists: () => Promise<boolean>;
      text: () => Promise<string>;
    };
    serve: (options: {
      port: number;
      fetch: (req: Request) => Response | Promise<Response>;
    }) => { port: number };
    env: Record<string, string | undefined>;
  };
}

export {};

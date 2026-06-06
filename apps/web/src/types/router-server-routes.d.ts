// Surfaces the `server: { handlers, middleware }` block on file-based routes.
//
// The block is implemented by the @tanstack/start-plugin Vite transform, but
// the published `@tanstack/router-core` type defs don't expose it as of
// 1.169 — so without this augmentation `server: ...` triggers a "Object
// literal may only specify known properties" error on every server-route
// file.
//
// The handler context is typed enough for `({ request, params, context,
// pathname, next })` to type-check without implicit `any`.

declare module '@tanstack/router-core' {
  interface FilebaseRouteOptionsInterface<
    TRegister = any,
    TParentRoute = any,
    TId = any,
    TPath = any,
    TSearchValidator = any,
    TParams = any,
    TLoaderDeps = any,
    TLoaderFn = any,
    TRouterContext = any,
    TRouteContextFn = any,
    TBeforeLoadFn = any,
    TRemountDepsFn = any,
    TSSR = any,
    TServerMiddlewares = any,
    THandlers = any,
  > {
    server?: {
      middleware?: ReadonlyArray<unknown>;
      handlers?:
        | Partial<
            Record<
              'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'OPTIONS' | 'HEAD',
              (ctx: ServerHandlerCtx) => Response | Promise<Response>
            >
          >
        | ((helpers: { createHandlers: <T>(handlers: T) => T }) => unknown);
    };
  }
}

interface ServerHandlerCtx {
  request: Request;
  params: Record<string, string>;
  context: unknown;
  pathname: string;
  next: () => Promise<Response>;
}

export {};

import { HttpError, notFound } from '../util/errors.js';

const compile = (pattern) => {
  const names = [];
  const source = pattern
    .split('/')
    .map((segment) => {
      if (!segment.startsWith(':')) return segment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      names.push(segment.slice(1));
      return '([^/]+)';
    })
    .join('/');
  return { regex: new RegExp(`^${source}$`), names };
};

export const createRouter = () => {
  const routes = [];
  const add = (method, pattern, handler) => {
    const { regex, names } = compile(pattern);
    routes.push({ method, pattern, regex, names, handler });
  };

  return {
    get: (pattern, handler) => add('GET', pattern, handler),
    post: (pattern, handler) => add('POST', pattern, handler),
    patch: (pattern, handler) => add('PATCH', pattern, handler),
    delete: (pattern, handler) => add('DELETE', pattern, handler),
    match(method, pathname) {
      let pathExists = false;
      for (const route of routes) {
        const found = route.regex.exec(pathname);
        if (!found) continue;
        pathExists = true;
        if (route.method !== method) continue;
        const params = {};
        route.names.forEach((name, index) => {
          params[name] = decodeURIComponent(found[index + 1]);
        });
        return { handler: route.handler, params };
      }
      if (pathExists) throw new HttpError(405, 'method_not_allowed', 'Metodo non ammesso su questa rotta');
      throw notFound('route_not_found', `Nessuna rotta per ${method} ${pathname}`);
    }
  };
};

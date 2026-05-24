import { get, route } from 'remix/routes'

export const routes = route({
  assets: get('/assets/*path'),
  tocApi: get('/api/toc'),
  home: '/',
  edit: '/edit',
})

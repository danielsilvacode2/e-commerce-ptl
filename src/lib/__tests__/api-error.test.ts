import test from 'node:test'
import assert from 'node:assert/strict'
import { ApiError, classifyErrorVariant, createHttpApiError } from '../api-error.ts'
import { clientCache } from '../client-cache.ts'

test('classifica corretamente erros de servidor (5xx) e timeout como api-down', () => {
  const err500 = createHttpApiError(503, 'Test')
  assert.equal(err500.kind, 'server')
  assert.equal(classifyErrorVariant(err500), 'api-down')

  const timeoutErr = new ApiError('timeout', 'Timeout')
  assert.equal(classifyErrorVariant(timeoutErr), 'api-down')

  const networkErr = new TypeError('Failed to fetch')
  assert.equal(classifyErrorVariant(networkErr), 'api-down')
})

test('classifica erro 404 como not-found e 401 mantém mensagem 401 para redirecionamento', () => {
  const err404 = createHttpApiError(404, 'Order')
  assert.equal(classifyErrorVariant(err404), 'not-found')

  const err401 = createHttpApiError(401, 'Auth')
  assert.equal(err401.kind, 'unauthorized')
  assert.equal(err401.message, '401')
})

test('classifica erro desconhecido como generic', () => {
  assert.equal(classifyErrorVariant(new Error('erro inesperado')), 'generic')
  assert.equal(classifyErrorVariant('falha'), 'generic')
})

test('clientCache salva, recupera e remove valores com fallback em memória', () => {
  clientCache.set('test:products', [{ id: '1', name: 'Camiseta' }])
  const entry = clientCache.get<{ id: string; name: string }[]>('test:products')
  assert.ok(entry)
  assert.equal(entry.data.length, 1)
  assert.equal(entry.data[0].name, 'Camiseta')
  assert.equal(typeof entry.savedAt, 'number')

  clientCache.remove('test:products')
  assert.equal(clientCache.get('test:products'), null)
})

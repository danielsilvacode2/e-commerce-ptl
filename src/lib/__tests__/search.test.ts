/**
 * Testes unitarios das regras de busca
 * Executavel via Node.js: node --test src/lib/__tests__/search.test.ts
 */

import assert from 'node:assert'
import { test } from 'node:test'
import { SEARCH_MAX_LENGTH, isSearchTermValid, normalizeSearchTerm } from '../search.ts'

test('normaliza removendo espacos nas pontas', () => {
  assert.strictEqual(normalizeSearchTerm('  camisa  '), 'camisa')
})

test('limita ao tamanho maximo', () => {
  assert.strictEqual(normalizeSearchTerm('a'.repeat(150)).length, SEARCH_MAX_LENGTH)
})

test('termo vazio, espacos ou 1 caractere sao invalidos', () => {
  assert.strictEqual(isSearchTermValid(''), false)
  assert.strictEqual(isSearchTermValid('    '), false)
  assert.strictEqual(isSearchTermValid(' a '), false)
})

test('termo com 2 ou mais caracteres e valido', () => {
  assert.strictEqual(isSearchTermValid('ab'), true)
  assert.strictEqual(isSearchTermValid('100%'), true)
})

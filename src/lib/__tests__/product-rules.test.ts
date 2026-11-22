import assert from 'node:assert'
import { test } from 'node:test'
import { formatCurrencyBRL, shouldDisplayStock } from '../product-rules.ts'

test('Regra de exibição da quantidade de estoque', async (t) => {
  await t.test('aparece quando a quantidade for 49 (< 50)', () => {
    assert.strictEqual(shouldDisplayStock(49), true)
  })

  await t.test('não aparece quando a quantidade for 50 (= 50)', () => {
    assert.strictEqual(shouldDisplayStock(50), false)
  })

  await t.test('não aparece quando a quantidade for 51 (> 50)', () => {
    assert.strictEqual(shouldDisplayStock(51), false)
  })

  await t.test('aparece para valores menores como 0 ou 10', () => {
    assert.strictEqual(shouldDisplayStock(0), true)
    assert.strictEqual(shouldDisplayStock(10), true)
  })

  await t.test('não aparece para valores nulos, indefinidos ou NaN', () => {
    assert.strictEqual(shouldDisplayStock(null), false)
    assert.strictEqual(shouldDisplayStock(undefined), false)
    assert.strictEqual(shouldDisplayStock(NaN), false)
  })
})

test('Formatação de moeda BRL', async (t) => {
  await t.test('formata valores corretamente em Real brasileiro', () => {
    const formatted = formatCurrencyBRL(120.5)
    // Pode conter espaço regular ou non-breaking space dependendo do locale
    assert.match(formatted, /R\$\s?120,50/)
  })

  await t.test('formata zero e valores default', () => {
    const formatted = formatCurrencyBRL(0)
    assert.match(formatted, /R\$\s?0,00/)
  })
})

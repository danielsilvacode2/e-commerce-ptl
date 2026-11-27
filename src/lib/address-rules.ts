import type { Address, AddressFieldErrors } from '../types/address'

export const BRAZILIAN_UFS = [
  { code: 'AC', name: 'Acre' },
  { code: 'AL', name: 'Alagoas' },
  { code: 'AP', name: 'Amapá' },
  { code: 'AM', name: 'Amazonas' },
  { code: 'BA', name: 'Bahia' },
  { code: 'CE', name: 'Ceará' },
  { code: 'DF', name: 'Distrito Federal' },
  { code: 'ES', name: 'Espírito Santo' },
  { code: 'GO', name: 'Goiás' },
  { code: 'MA', name: 'Maranhão' },
  { code: 'MT', name: 'Mato Grosso' },
  { code: 'MS', name: 'Mato Grosso do Sul' },
  { code: 'MG', name: 'Minas Gerais' },
  { code: 'PA', name: 'Pará' },
  { code: 'PB', name: 'Paraíba' },
  { code: 'PR', name: 'Paraná' },
  { code: 'PE', name: 'Pernambuco' },
  { code: 'PI', name: 'Piauí' },
  { code: 'RJ', name: 'Rio de Janeiro' },
  { code: 'RN', name: 'Rio Grande do Norte' },
  { code: 'RS', name: 'Rio Grande do Sul' },
  { code: 'RO', name: 'Rondônia' },
  { code: 'RR', name: 'Roraima' },
  { code: 'SC', name: 'Santa Catarina' },
  { code: 'SP', name: 'São Paulo' },
  { code: 'SE', name: 'Sergipe' },
  { code: 'TO', name: 'Tocantins' },
] as const

const VALID_UF_SET = new Set<string>(BRAZILIAN_UFS.map((u) => u.code))

/**
 * Remove qualquer caractere nao numerico e limita o CEP a 8 digitos.
 */
export function stripCepDigits(value: string): string {
  return value.replace(/\D/g, '').slice(0, 8)
}

/**
 * Aplica a mascara padrao brasileira de CEP (00000-000).
 */
export function formatCepMask(value: string): string {
  const digits = stripCepDigits(value)
  if (digits.length > 5) {
    return `${digits.slice(0, 5)}-${digits.slice(5)}`
  }
  return digits
}

/**
 * Verifica se o CEP possui exatamente 8 digitos validos.
 */
export function isCompleteCep(value: string): boolean {
  return stripCepDigits(value).length === 8
}

/**
 * Valida se a sigla corresponde a uma das 27 UFs brasileiras.
 */
export function isValidBrazilianUF(uf: string): boolean {
  return VALID_UF_SET.has(uf.trim().toUpperCase())
}

/**
 * Sanitiza os campos do endereco antes de enviar a API.
 */
export function normalizeAddressInput(address: Address): Address {
  return {
    ...(address.id ? { id: address.id } : {}),
    cep: stripCepDigits(address.cep),
    street: address.street.trim(),
    number: address.number.trim(),
    complement: address.complement?.trim() || undefined,
    neighborhood: address.neighborhood?.trim() || undefined,
    city: address.city.trim(),
    state: address.state.trim().toUpperCase(),
  }
}

/**
 * Valida localmente os campos obrigatorios do formulario de endereco.
 */
export function validateAddressLocally(address: Address): AddressFieldErrors {
  const errors: AddressFieldErrors = {}
  const cepDigits = stripCepDigits(address.cep)

  if (cepDigits.length !== 8) {
    errors.cep = 'Informe um CEP válido com 8 dígitos (ex.: 00000-000).'
  }

  if (!address.street.trim()) {
    errors.street = 'A rua é obrigatória.'
  }

  if (!address.number.trim()) {
    errors.number = 'O número é obrigatório (informe S/N se não houver).'
  }

  if (!address.city.trim()) {
    errors.city = 'A cidade é obrigatória.'
  }

  const normalizedState = address.state.trim().toUpperCase()
  if (!normalizedState) {
    errors.state = 'O estado (UF) é obrigatório.'
  } else if (!VALID_UF_SET.has(normalizedState)) {
    errors.state = 'Informe uma sigla de estado (UF) brasileira válida.'
  }

  return errors
}

/**
 * Formata o endereco completo em uma linha legivel, com fallback para pedidos legados que possuem apenas CEP.
 */
export function formatAddressFull(address?: Address | null): string {
  if (!address) return 'Endereço não informado'

  const formattedCep = address.cep ? formatCepMask(address.cep) : ''
  const hasStreet = Boolean(address.street?.trim())
  const hasCityState = Boolean(address.city?.trim() || address.state?.trim())

  if (!hasStreet && !hasCityState) {
    return formattedCep ? `CEP ${formattedCep}` : 'Endereço não informado'
  }

  const parts: string[] = []

  if (hasStreet) {
    const numberPart = address.number?.trim() ? `, ${address.number.trim()}` : ''
    const complementPart = address.complement?.trim() ? ` - ${address.complement.trim()}` : ''
    parts.push(`${address.street.trim()}${numberPart}${complementPart}`)
  }

  if (address.neighborhood?.trim()) {
    parts.push(address.neighborhood.trim())
  }

  if (hasCityState) {
    const city = address.city?.trim() ?? ''
    const state = address.state?.trim().toUpperCase() ?? ''
    parts.push(city && state ? `${city}/${state}` : city || state)
  }

  if (formattedCep) {
    parts.push(`CEP ${formattedCep}`)
  }

  return parts.join(' • ')
}

/**
 * Formata o endereco de forma compacta para cards de listagem de pedidos.
 */
export function formatAddressCompact(address?: Address | null): string {
  if (!address) return 'Endereço não informado'

  const formattedCep = address.cep ? formatCepMask(address.cep) : ''
  const street = address.street?.trim()
  const number = address.number?.trim()
  const city = address.city?.trim()
  const state = address.state?.trim().toUpperCase()

  if (!street && !city) {
    return formattedCep ? `CEP: ${formattedCep}` : 'Endereço não informado'
  }

  const lineParts: string[] = []
  if (street) {
    lineParts.push(number ? `${street}, ${number}` : street)
  }
  if (city && state) {
    lineParts.push(`${city}/${state}`)
  } else if (city || state) {
    lineParts.push(city || state)
  }
  if (formattedCep) {
    lineParts.push(`CEP ${formattedCep}`)
  }

  return lineParts.join(' · ')
}

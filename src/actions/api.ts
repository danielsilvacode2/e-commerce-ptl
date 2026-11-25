export default function ApiUrlBase(): string {
  if (typeof window === 'undefined') {
    return (
      process.env.API_INTERNAL_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      'http://localhost:5000/api/v1'
    )
  }
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1'
}

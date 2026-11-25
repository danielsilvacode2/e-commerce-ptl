const API_KEY = process.env.NEXT_PUBLIC_IMGBB_API_KEY
const MAX_IMAGE_DIMENSION = 1200
const WEBP_QUALITY = 0.84

// Redimensiona e comprime imagens (JPG/PNG/WebP) no navegador antes do upload para reduzir drasticamente o peso na vitrine.
async function optimizeImageBeforeUpload(file: File): Promise<File> {
  if (
    typeof window === 'undefined' ||
    typeof document === 'undefined' ||
    file.type === 'image/gif' ||
    file.size <= 150 * 1024
  ) {
    return file
  }

  try {
    const objectUrl = URL.createObjectURL(file)
    try {
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const image = new Image()
        image.onload = () => resolve(image)
        image.onerror = reject
        image.src = objectUrl
      })

      let targetWidth = img.naturalWidth
      let targetHeight = img.naturalHeight

      if (targetWidth > MAX_IMAGE_DIMENSION || targetHeight > MAX_IMAGE_DIMENSION) {
        const ratio = Math.min(MAX_IMAGE_DIMENSION / targetWidth, MAX_IMAGE_DIMENSION / targetHeight)
        targetWidth = Math.round(targetWidth * ratio)
        targetHeight = Math.round(targetHeight * ratio)
      }

      const canvas = document.createElement('canvas')
      canvas.width = targetWidth
      canvas.height = targetHeight
      const ctx = canvas.getContext('2d')
      if (!ctx) return file

      ctx.drawImage(img, 0, 0, targetWidth, targetHeight)

      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, 'image/webp', WEBP_QUALITY)
      )

      if (!blob || blob.size >= file.size) {
        return file
      }

      const baseName = file.name.replace(/\.[^.]+$/, '') || 'product'
      return new File([blob], `${baseName}.webp`, { type: 'image/webp' })
    } finally {
      URL.revokeObjectURL(objectUrl)
    }
  } catch {
    return file
  }
}

export async function uploadToImgBB(file: File): Promise<string> {
  const optimizedFile = await optimizeImageBeforeUpload(file)
  const formData = new FormData()
  formData.append('image', optimizedFile)

  const response = await fetch(`https://api.imgbb.com/1/upload?key=${API_KEY}`, {
    method: 'POST',
    body: formData,
  })

  const data = await response.json()

  if (!data.success) {
    throw new Error('Error uploading the image.')
  }

  return data.data.url
}

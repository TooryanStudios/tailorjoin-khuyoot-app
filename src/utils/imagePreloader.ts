const imageCache = new Map<string, Promise<HTMLImageElement>>()

export const preloadImage = (src: string): Promise<HTMLImageElement> => {
  if (!src) return Promise.reject(new Error('Invalid image src'))
  if (imageCache.has(src)) {
    return imageCache.get(src) as Promise<HTMLImageElement>
  }

  const promise = new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })

  imageCache.set(src, promise)
  return promise
}

export const preloadImages = (srcs: string[]) => {
  srcs.filter(Boolean).forEach((src) => {
    preloadImage(src).catch(() => {})
  })
}

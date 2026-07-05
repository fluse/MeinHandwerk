/** Skaliert ein Bild per Canvas auf maxDim und liefert es als JPEG-Data-URL, bevor es hochgeladen wird. */
export function compressImage(file: File, maxDim = 1200, quality = 0.55): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (event) => {
      const img = new Image()
      img.onload = () => {
        let { width, height } = img
        if (width > height && width > maxDim) {
          height = (height * maxDim) / width
          width = maxDim
        } else if (height > maxDim) {
          width = (width * maxDim) / height
          height = maxDim
        }
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('Canvas 2D context not available'))
          return
        }
        ctx.drawImage(img, 0, 0, width, height)
        resolve(canvas.toDataURL('image/jpeg', quality))
      }
      img.onerror = () => reject(new Error('Bild konnte nicht geladen werden'))
      img.src = event.target?.result as string
    }
    reader.onerror = () => reject(new Error('Datei konnte nicht gelesen werden'))
    reader.readAsDataURL(file)
  })
}

/** Wandelt eine Data-URL (z. B. aus compressImage oder einem Canvas) in ein Blob für den Upload um. */
export async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  const res = await fetch(dataUrl)
  return res.blob()
}

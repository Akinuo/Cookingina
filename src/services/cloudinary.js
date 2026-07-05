/**
 * cloudinary.js
 * Direct unsigned uploads to Cloudinary from the React frontend.
 * No backend required — uses Cloudinary's unsigned upload preset.
 *
 * Setup: See SETUP.md → Cloudinary section
 */

const CLOUD_NAME   = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || ''
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || ''

if (!CLOUD_NAME || !UPLOAD_PRESET) {
  console.warn('[Cloudinary] VITE_CLOUDINARY_CLOUD_NAME or VITE_CLOUDINARY_UPLOAD_PRESET not set in .env')
}

const UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`

/**
 * Upload a File/Blob to Cloudinary.
 * Returns the secure HTTPS URL of the uploaded image.
 *
 * @param {File} file         - The image file from an <input type="file">
 * @param {object} options    - Optional overrides
 * @param {string} options.folder       - Cloudinary folder (default: 'cookingina')
 * @param {Function} options.onProgress - Progress callback (0–100)
 * @returns {Promise<string>} - Secure URL of the uploaded image
 */
export async function uploadImage(file, options = {}) {
  if (!CLOUD_NAME || !UPLOAD_PRESET) {
    throw new Error('Cloudinary not configured. Set VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET in .env')
  }

  const {
    folder = 'cookingina',
    onProgress = null,
  } = options

  // Validate file type
  if (!file.type.startsWith('image/')) {
    throw new Error('Only image files are allowed.')
  }

  // Validate file size (max 10MB)
  const MAX_SIZE = 10 * 1024 * 1024
  if (file.size > MAX_SIZE) {
    throw new Error('Image must be under 10MB.')
  }

  const formData = new FormData()
  formData.append('file', file)
  formData.append('upload_preset', UPLOAD_PRESET)
  formData.append('folder', folder)

  // Use XMLHttpRequest for progress tracking
  if (onProgress) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      xhr.open('POST', UPLOAD_URL)

      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          onProgress(Math.round((e.loaded / e.total) * 100))
        }
      })

      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          const data = JSON.parse(xhr.responseText)
          resolve(data.secure_url)
        } else {
          const err = JSON.parse(xhr.responseText)
          reject(new Error(err.error?.message || `Upload failed: ${xhr.status}`))
        }
      })

      xhr.addEventListener('error', () => reject(new Error('Network error during upload.')))
      xhr.addEventListener('abort', () => reject(new Error('Upload cancelled.')))
      xhr.send(formData)
    })
  }

  // Simple fetch without progress
  const res = await fetch(UPLOAD_URL, { method: 'POST', body: formData })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error?.message || `Upload failed: ${res.status}`)
  }
  const data = await res.json()
  return data.secure_url
}

/**
 * Upload a profile avatar — applies face-detection crop + circular transform.
 * Returns the transformed secure URL.
 *
 * @param {File} file - Image file
 * @returns {Promise<string>} - Secure URL of the optimized avatar
 */
export async function uploadAvatar(file, onProgress = null) {
  const rawUrl = await uploadImage(file, {
    folder: 'cookingina/avatars',
    onProgress,
  })

  // Apply Cloudinary transformations via URL manipulation:
  // c_fill: fill crop, g_face: face detection, w/h: 300px, q_auto: auto quality, f_auto: auto format
  return rawUrl.replace(
    '/upload/',
    '/upload/c_fill,g_face,h_300,w_300,q_auto,f_auto/'
  )
}

/**
 * Upload a recipe image — optimized for card thumbnails.
 *
 * @param {File} file - Image file
 * @returns {Promise<string>} - Secure URL of the optimized recipe image
 */
export async function uploadRecipeImage(file, onProgress = null) {
  const rawUrl = await uploadImage(file, {
    folder: 'cookingina/recipes',
    onProgress,
  })

  // 800x600 fill, auto quality and format
  return rawUrl.replace(
    '/upload/',
    '/upload/c_fill,h_600,w_800,q_auto,f_auto/'
  )
}

/**
 * Upload a community post image.
 *
 * @param {File} file - Image file
 * @returns {Promise<string>} - Secure URL
 */
export async function uploadPostImage(file, onProgress = null) {
  const rawUrl = await uploadImage(file, {
    folder: 'cookingina/posts',
    onProgress,
  })

  // 1200px wide, auto height, auto quality
  return rawUrl.replace(
    '/upload/',
    '/upload/c_limit,w_1200,q_auto,f_auto/'
  )
}

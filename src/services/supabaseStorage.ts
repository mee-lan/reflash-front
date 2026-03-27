const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY
const SUPABASE_STORAGE_BUCKET = import.meta.env.VITE_SUPABASE_STORAGE_BUCKET || 'images'
const SIGNED_URL_TTL_SECONDS = 60 * 60

type SignedUrlCacheEntry = {
  expiresAt: number
  url: string
}

const signedUrlCache = new Map<string, SignedUrlCacheEntry>()

function ensureSupabaseConfig() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error('Supabase storage is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.')
  }
}

function sanitizeFileNameSegment(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9.-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function getFileExtension(file: File) {
  const extensionFromName = file.name.split('.').pop()?.trim().toLowerCase()

  if (extensionFromName) {
    return extensionFromName
  }

  const mimeExtension = file.type.split('/').pop()?.trim().toLowerCase()
  return mimeExtension || 'bin'
}

export function createUniqueMarkdownImagePath(file: File, deckId?: number) {
  const baseName = file.name.replace(/\.[^.]+$/, '')
  const safeBaseName = sanitizeFileNameSegment(baseName) || 'image'
  const uniqueId = typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
  const extension = getFileExtension(file)
  const folder = deckId ? `deck-${deckId}` : 'shared'

  return `${folder}/${safeBaseName}-${uniqueId}.${extension}`
}

export function createPendingMarkdownImageToken(file: File) {
  const safeName = sanitizeFileNameSegment(file.name.replace(/\.[^.]+$/, '')) || 'image'
  const uniqueId = typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`

  return `pending-image://${safeName}-${uniqueId}`
}

export async function uploadMarkdownImage(file: File, deckId?: number) {
  ensureSupabaseConfig()

  const storagePath = createUniqueMarkdownImagePath(file, deckId)
  const uploadUrl = `${SUPABASE_URL}/storage/v1/object/${SUPABASE_STORAGE_BUCKET}/${storagePath}`

  const response = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      'x-upsert': 'false',
      'Content-Type': file.type || 'application/octet-stream',
    },
    body: file,
  })

  if (!response.ok) {
    let errorMessage = 'Failed to upload image to Supabase storage.'

    try {
      const errorData = await response.json()
      if (typeof errorData?.message === 'string' && errorData.message.trim()) {
        errorMessage = errorData.message
      }
    } catch {
      // Keep generic message when the error payload is not JSON.
    }

    throw new Error(errorMessage)
  }

  return storagePath
}

export function resolveMarkdownImageUrl(source: string) {
  if (!source) {
    return source
  }

  if (/^(https?:)?\/\//i.test(source) || source.startsWith('/') || source.startsWith('blob:') || source.startsWith('data:')) {
    return source
  }

  if (!SUPABASE_URL) {
    return source
  }

  const normalizedPath = source.replace(/^\/+/, '')
  return `${SUPABASE_URL}/storage/v1/object/public/${SUPABASE_STORAGE_BUCKET}/${normalizedPath}`
}

export async function getMarkdownImageUrl(source: string) {
  if (!source) {
    return source
  }

  if (/^(https?:)?\/\//i.test(source) || source.startsWith('/') || source.startsWith('blob:') || source.startsWith('data:')) {
    return source
  }

  ensureSupabaseConfig()

  const cachedEntry = signedUrlCache.get(source)
  if (cachedEntry && cachedEntry.expiresAt > Date.now()) {
    return cachedEntry.url
  }

  const normalizedPath = source.replace(/^\/+/, '')
  const signUrl = `${SUPABASE_URL}/storage/v1/object/sign/${SUPABASE_STORAGE_BUCKET}/${normalizedPath}`

  try {
    const response = await fetch(signUrl, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ expiresIn: SIGNED_URL_TTL_SECONDS }),
    })

    if (!response.ok) {
      throw new Error('Failed to create signed URL')
    }

    const data = await response.json()
    const signedUrl = typeof data?.signedURL === 'string' ? data.signedURL : ''

    if (!signedUrl) {
      throw new Error('Signed URL missing from response')
    }

    const resolvedUrl = signedUrl.startsWith('http')
      ? signedUrl
      : `${SUPABASE_URL}/storage/v1${signedUrl}`

    signedUrlCache.set(source, {
      url: resolvedUrl,
      expiresAt: Date.now() + (SIGNED_URL_TTL_SECONDS - 30) * 1000,
    })

    return resolvedUrl
  } catch {
    return resolveMarkdownImageUrl(source)
  }
}

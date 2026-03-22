export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:2940/api'
export const IMAGE_BASE_URL = import.meta.env.VITE_IMAGE_BASE_URL || 'http://localhost:2940'

export async function verifyToken(token: string): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token }),
    })
    return response.ok
  } catch {
    return false
  }
}
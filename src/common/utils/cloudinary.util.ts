/**
 * Kiểm tra URL có phải Cloudinary không
 */
export const isCloudinaryUrl = (url: string): boolean => {
  if (!url) return false
  return url.includes('cloudinary.com')
}

/**
 * Trích xuất public ID từ Cloudinary URL
 * URL format: https://res.cloudinary.com/{cloud_name}/image/upload/v{version}/{folder}/{publicId}.{extension}
 */
export const extractCloudinaryPublicId = (url: string): string => {
  const parts = url.split('/upload/')
  if (parts.length < 2) return ''

  const afterUpload = parts[1]
  // Bỏ version (v123456789/) nếu có
  const withoutVersion = afterUpload.replace(/^v\d+\//, '')
  // Bỏ extension
  const withoutExtension = withoutVersion.replace(/\.[^.]+$/, '')
  return withoutExtension
}

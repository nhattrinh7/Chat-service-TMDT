import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary'

@Injectable()
export class CloudinaryService {
  constructor(private configService: ConfigService) {
    cloudinary.config({
      cloud_name: this.configService.get('CLOUDINARY_CLOUD_NAME'),
      api_key: this.configService.get('CLOUDINARY_API_KEY'),
      api_secret: this.configService.get('CLOUDINARY_API_SECRET'),
    })
  }

  async uploadImageToCloudinary(
    file: Express.Multer.File,
    folder?: string,
  ): Promise<UploadApiResponse> {
    return new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            folder: folder || 'chat-image',
            resource_type: 'auto',
          },
          (error, result) => {
            if (error) return reject(new Error(error.message || 'Upload failed'))
            if (!result) return reject(new Error('Upload result is undefined'))
            resolve(result)
          },
        )
        .end(file.buffer) // Ghi dữ liệu vào stream và đóng stream
    })
  }

  async deleteImageFromCloudinary(publicId: string): Promise<{ result: string }> {
    try {
      const result = await cloudinary.uploader.destroy(publicId)
      return result
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Delete failed')
    }
  }
}

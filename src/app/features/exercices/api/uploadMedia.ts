import { randomUUID } from 'crypto';
import { v2 as cloudinary } from 'cloudinary';
import { getUserMediaPrefix } from '@/app/utils/cloudinary.utils';

const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB

function uploadToCloudinary(buffer: Buffer, publicId: string): Promise<{ secure_url: string; public_id: string }> {
  return new Promise((resolve, reject) => {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });

    const uploadOptions = {
      resource_type: 'image' as const,
      public_id: publicId,
      quality: 'auto' as const,
      fetch_format: 'auto' as const,
    };

    const uploadStream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error) {
          reject(error);
        } else if (result) {
          resolve({
            secure_url: result.secure_url,
            public_id: result.public_id,
          });
        } else {
          reject(new Error('Upload failed: no result'));
        }
      }
    );
    uploadStream.end(buffer);
  });
}

type UploadMediaParams = {
  file: File;
  userId: number;
};

export async function uploadMedia(params: UploadMediaParams) {
  const { file, userId } = params;

  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    throw new Error('Configuration Cloudinary manquante');
  }

  const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif'];
  
  if (!allowedImageTypes.includes(file.type)) {
    throw new Error(`Type de fichier non autorisé. Types acceptés: ${allowedImageTypes.join(', ')}`);
  }

  if (file.size > MAX_IMAGE_SIZE) {
    const maxSizeMB = MAX_IMAGE_SIZE / (1024 * 1024);
    throw new Error(`Le fichier est trop volumineux. Taille maximale: ${maxSizeMB}MB`);
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  
  const isJPEG = buffer[0] === 0xFF && buffer[1] === 0xD8;
  const isPNG = buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47;
  const isGIF = buffer.toString('ascii', 0, 3) === 'GIF';
  const isWebP = buffer.toString('ascii', 8, 12) === 'WEBP';
  const isHEIC = buffer.toString('ascii', 4, 8) === 'ftyp';

  if (!isJPEG && !isPNG && !isGIF && !isWebP && !isHEIC) {
    throw new Error('Le fichier n\'est pas une image valide');
  }

  // publicId explicite (et non `folder`) : le préfixe reste le même quel que
  // soit le mode de dossiers du compte Cloudinary
  const result = await uploadToCloudinary(buffer, `${getUserMediaPrefix(userId)}${randomUUID()}`);

  return {
    url: result.secure_url,
    publicId: result.public_id,
  };
}

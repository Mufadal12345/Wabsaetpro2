import imageCompression from 'browser-image-compression';

export const compressAvatar = async (imageFile: Blob | File): Promise<Blob> => {
  const options = {
    maxSizeMB: 0.2, // 200KB
    maxWidthOrHeight: 800,
    useWebWorker: true,
    fileType: 'image/webp',
    initialQuality: 0.85
  };
  
  try {
    const file = imageFile instanceof File ? imageFile : new File([imageFile], "image.png", { type: imageFile.type });
    const compressedFile = await imageCompression(file, options);
    return compressedFile;
  } catch (error) {
    console.error("Error compressing image:", error);
    throw error;
  }
};

import React, { useState, useRef, useCallback } from 'react';
import { Loader2, Camera as CameraIcon, Upload, Trash2 } from 'lucide-react';
import Cropper, { Area, Point } from 'react-easy-crop';
import { User } from '../types';
import { db, auth } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import { supabase } from '../supabase';
import { useToast } from '../contexts/ToastContext';
import { useUpdateProfileImage } from '../src/features/auth/hooks/useAuth';
import { useQueryClient } from '@tanstack/react-query';

// Helper to create an image element from an Object URL
const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.src = url;
  });

// Extract the cropped portion of the image
async function getCroppedImg(
  imageSrc: string,
  pixelCrop: Area,
): Promise<Blob | null> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    return null;
  }

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  return new Promise((resolve) => {
    canvas.toBlob((file) => {
      resolve(file);
    }, 'image/jpeg', 1);
  });
}

interface EditableAvatarProps {
  user: User;
  isEditable?: boolean;
  className?: string;
}

export const EditableAvatar: React.FC<EditableAvatarProps> = ({ user, isEditable = false, className }) => {
  const [showOptions, setShowOptions] = useState(false);
  const [imgSrc, setImgSrc] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { mutate: uploadImage, isPending: loading } = useUpdateProfileImage();

  // Avatar Upload Manager State
  const currentAvatarUrl = user.photoURL;
  
  // Crop states
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  const handleAvatarClick = () => {
    if (!isEditable || loading) return;
    setShowOptions(true);
  };

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const imageDataUrl = URL.createObjectURL(file);
      setImgSrc(imageDataUrl);
      setShowOptions(false); // Hide the options menu when switching to crop mode
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const onCropComplete = useCallback((_croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleSaveCrop = async () => {
    if (!croppedAreaPixels || !imgSrc) return;
    
    try {
      const croppedImageBlob = await getCroppedImg(imgSrc, croppedAreaPixels);
      if (!croppedImageBlob) throw new Error("Could not crop image");

      setImgSrc('');
      showToast("جاري تحديث الصورة...", "info");

      const file = new File([croppedImageBlob], "profile.jpg", { type: "image/jpeg" });
      
      uploadImage(file, {
        onSuccess: () => {
          showToast("تم تحديث الصورة بنجاح!", "success");
          queryClient.invalidateQueries({ queryKey: ['users'] });
        },
        onError: () => {
          showToast("تعذر تحديث الصورة، حاول مرة أخرى", "error");
        }
      });

    } catch (error) {
      console.error("Optimistic upload failed:", error);
      showToast("تعذر تحديث الصورة، حاول مرة أخرى", "error");
    }
  };

  const handleDeletePhoto = async () => {
    setShowOptions(false);
    try {
      if (auth.currentUser && auth.currentUser.uid === user.id) {
        await updateProfile(auth.currentUser, { photoURL: "" });
      }
      await updateDoc(doc(db, "users", user.id), { photoURL: "" });
      
      // Optimistic update for deletion
      queryClient.setQueriesData({ queryKey: ['users'] }, (oldData: any) => {
         if (!oldData || !oldData.pages) return oldData;
         return {
           ...oldData,
           pages: oldData.pages.map((page: any) => ({
             ...page,
             users: page.users.map((u: User) => u.id === user.id ? { ...u, photoURL: "" } : u)
           }))
         };
      });

      queryClient.setQueryData(['auth', 'profile'], (old: any) => ({
        ...old,
        photoURL: ""
      }));
      
      supabase.storage.from("avatars")
        .remove([`${user.id}/profile.webp`, `${user.id}/profile.png`])
        .catch(console.error);

      showToast("تم حذف الصورة بنجاح", "success");
      queryClient.invalidateQueries({ queryKey: ['users'] });
      
    } catch (error) {
      showToast("فشل في حذف الصورة", "error");
    }
  };

  return (
    <div className="flex flex-col items-center relative">
      <input
        type="file"
        accept="image/*"
        ref={fileInputRef}
        onChange={onFileChange}
        className="hidden"
      />

      <div onClick={handleAvatarClick} className={`relative group ${className || 'w-32 h-32'} rounded-full bg-zinc-900 border border-white/5 overflow-hidden flex items-center justify-center font-bold transition-all ${isEditable ? 'cursor-pointer hover:scale-105 active:scale-95' : ''}`}>
        {currentAvatarUrl ? (
          <img src={currentAvatarUrl} referrerPolicy="no-referrer" className={`w-full h-full object-cover transition-opacity duration-300 ${loading ? 'opacity-50 blur-[2px]' : 'opacity-100'}`} alt="Profile" />
        ) : (
          <span className="text-6xl text-white">{user.name[0]?.toUpperCase()}</span>
        )}
        
        {isEditable && !loading && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10">
            <CameraIcon className="text-white w-8 h-8" />
          </div>
        )}

        {loading && (
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-20">
            <Loader2 className="w-6 h-6 text-white animate-spin" />
          </div>
        )}
      </div>

      {showOptions && isEditable && (
        <>
          <div className="fixed inset-0 z-[6999]" onClick={(e) => { e.stopPropagation(); setShowOptions(false); }} />
          <div className="absolute top-[110%] z-[7000] w-48 bg-[#1a1a1a] rounded-2xl overflow-hidden shadow-2xl flex flex-col border border-white/10 animate-fade-in-up p-2" onClick={e => e.stopPropagation()}>
            <div className="flex flex-col gap-1">
              <button 
                onClick={() => { setShowOptions(false); fileInputRef.current?.click(); }} 
                className="w-full text-right px-4 py-3 hover:bg-white/10 transition-all text-white rounded-xl text-sm font-bold flex items-center justify-start gap-3"
              >
                <Upload className="w-4 h-4" />
                <span>رفع صورة جديدة</span>
              </button>
              {user.photoURL && (
                <button 
                  onClick={handleDeletePhoto} 
                  className="w-full text-right px-4 py-3 hover:bg-red-500/10 transition-all font-bold text-red-500 rounded-xl flex items-center justify-start gap-3 text-sm"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>حذف الصورة</span>
                </button>
              )}
            </div>
          </div>
        </>
      )}

      {/* Crop Modal Window */}
      {!!imgSrc && (
        <div className="fixed inset-0 z-[7000] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" onClick={() => setImgSrc('')} />
          
          {/* Floating Window */}
          <div className="relative w-full max-w-[360px] bg-[#111111] rounded-[2rem] overflow-hidden shadow-2xl flex flex-col border border-white/10 animate-fade-in-up">
            
            {/* Header */}
            <div className="px-5 py-4 flex justify-between items-center bg-[#1a1a1a]/80 backdrop-blur-md border-b border-white/5 z-20">
              <button 
                onClick={() => setImgSrc('')} 
                className="text-zinc-400 text-sm font-bold hover:text-white transition-colors"
                disabled={loading}
              >
                إلغاء
              </button>
              <span className="text-white font-bold text-xs uppercase tracking-widest">تعديل الصورة</span>
              <button 
                onClick={handleSaveCrop}
                disabled={loading}
                className="px-5 py-1.5 bg-pink-600 hover:bg-pink-500 text-white rounded-full text-xs font-bold shadow-lg shadow-pink-600/20 disabled:opacity-50 transition-all flex items-center gap-2"
              >
                {loading && <Loader2 className="w-3 h-3 animate-spin" />}
                حفظ
              </button>
            </div>

            {/* Crop Area */}
            <div className="relative w-full aspect-square bg-[#0a0a0a]">
              <Cropper
                image={imgSrc}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                showGrid={false}
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
                style={{
                  containerStyle: { background: '#0a0a0a' },
                  cropAreaStyle: { border: '2px solid rgba(255,255,255,0.1)' }
                }}
              />
            </div>

            {/* Zoom Control */}
            <div className="px-6 py-5 bg-[#1a1a1a]/80 backdrop-blur-md border-t border-white/5 z-20">
              <div className="flex items-center gap-4 text-white">
                <span className="text-xs font-bold text-zinc-500">تصغير</span>
                <input
                  type="range"
                  value={zoom}
                  min={1}
                  max={3}
                  step={0.1}
                  aria-labelledby="Zoom"
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="flex-1 h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-pink-600"
                />
                <span className="text-xs font-bold text-zinc-500">تكبير</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};



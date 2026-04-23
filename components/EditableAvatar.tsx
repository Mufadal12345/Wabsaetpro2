import React, { useState, useRef, useCallback } from "react";
import Cropper from "react-easy-crop";
import { Camera, CameraResultType, CameraSource } from "@capacitor/camera";
import { ActionSheet, ActionSheetButtonStyle } from "@capacitor/action-sheet";
import { Capacitor } from "@capacitor/core";
import { supabase } from "../supabase";
import { doc, updateDoc } from "firebase/firestore";
import { updateProfile } from "firebase/auth";
import { auth, db } from "../firebase";
import { User } from "../types";
import { useToast } from "../contexts/ToastContext";
import { Icons } from "./Icons";

// Helper to create an HTML element from URL
const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (error) => reject(error));
    image.setAttribute("crossOrigin", "anonymous"); // needed to avoid CORS if using external src
    image.src = url;
  });

function getRadianAngle(degreeValue: number) {
  return (degreeValue * Math.PI) / 180;
}

async function getCroppedImg(
  imageSrc: string,
  pixelCrop: any,
  rotation = 0
): Promise<Blob | null> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) return null;

  const rotRad = getRadianAngle(rotation);

  // calculate bounding box of the rotated image
  const { width: bBoxWidth, height: bBoxHeight } = {
    width: Math.abs(Math.cos(rotRad) * image.width) + Math.abs(Math.sin(rotRad) * image.height),
    height: Math.abs(Math.sin(rotRad) * image.width) + Math.abs(Math.cos(rotRad) * image.height),
  };

  canvas.width = bBoxWidth;
  canvas.height = bBoxHeight;

  ctx.translate(bBoxWidth / 2, bBoxHeight / 2);
  ctx.rotate(rotRad);
  ctx.translate(-image.width / 2, -image.height / 2);

  ctx.drawImage(image, 0, 0);

  const croppedCanvas = document.createElement("canvas");
  const croppedCtx = croppedCanvas.getContext("2d");

  if (!croppedCtx) return null;

  // maximum dimensions for the final avatar (makes the upload super fast + avoids massive unoptimized files)
  const MAX_AVATAR_SIZE = 800;

  let finalWidth = pixelCrop.width;
  let finalHeight = pixelCrop.height;

  // scale down if it exceeds max size while preserving aspect ratio
  if (finalWidth > MAX_AVATAR_SIZE) {
    const ratio = MAX_AVATAR_SIZE / finalWidth;
    finalWidth = MAX_AVATAR_SIZE;
    finalHeight = Math.floor(finalHeight * ratio);
  }

  croppedCanvas.width = finalWidth;
  croppedCanvas.height = finalHeight;

  // Draw with high-quality smoothing for resize
  croppedCtx.imageSmoothingEnabled = true;
  croppedCtx.imageSmoothingQuality = "high";

  croppedCtx.drawImage(
    canvas,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    finalWidth,
    finalHeight
  );

  return new Promise((resolve) => {
    // Quality 0.85 is visually lossless for profile pictures but incredibly fast
    croppedCanvas.toBlob((blob) => resolve(blob), "image/jpeg", 0.85); 
  });
}

// Minimal internal modal for cropping
const ImageCropperModal: React.FC<{
  imageSrc: string;
  onClose: () => void;
  onConfirm: (blob: Blob) => void;
}> = ({ imageSrc, onClose, onConfirm }) => {
  const { showToast } = useToast();
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const onCropComplete = useCallback((_croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleConfirm = async () => {
    if (!croppedAreaPixels) return;
    
    // Check pixel cropped width instead of full image since user might crop too small manually
    if (croppedAreaPixels.width < 400 || croppedAreaPixels.height < 400) {
      showToast("حجم القص الفعلي صغير جدًا (أقل من 400x400). الرجاء تقليل التكبير (Zoom) لضمان جودة الصورة.", "error");
      return;
    }

    try {
      setIsProcessing(true);
      const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels, rotation);
      if (croppedBlob) {
        onConfirm(croppedBlob);
      } else {
        showToast("فشل معالجة الصورة، يرجى المحاولة مرة أخرى.", "error");
      }
    } catch (e) {
      console.error(e);
      showToast("حدث خطأ أثناء قص الصورة.", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-black">
      <div className="relative flex-1">
        <Cropper
          image={imageSrc}
          crop={crop}
          zoom={zoom}
          rotation={rotation}
          aspect={1} // Force 1:1 Aspect Ratio constraints
          cropShape="round" // Circular overlay
          showGrid={false}
          onCropChange={setCrop}
          onCropComplete={onCropComplete}
          onZoomChange={setZoom}
          onRotationChange={setRotation}
        />
      </div>

      <div className="p-6 bg-[#0a0f1f] text-white flex flex-col gap-6 border-t border-white/10">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <div className="flex justify-between text-xs text-gray-400">
              <span>تصغير</span>
              <span>التقريب / التكبير (Zoom)</span>
              <span>تكبير</span>
            </div>
            <input
              type="range"
              value={zoom}
              min={1}
              max={3}
              step={0.1}
              aria-labelledby="Zoom"
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-full accent-accent h-1 bg-white/20 rounded-full appearance-none"
            />
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex justify-between text-xs text-gray-400">
              <span>-180°</span>
              <span>الدوران (Rotation)</span>
              <span>+180°</span>
            </div>
            <input
              type="range"
              value={rotation}
              min={-180}
              max={180}
              step={1}
              aria-labelledby="Rotation"
              onChange={(e) => setRotation(Number(e.target.value))}
              className="w-full accent-accent h-1 bg-white/20 rounded-full appearance-none"
            />
          </div>
        </div>

        <div className="flex gap-4">
          <button
            onClick={onClose}
            className="flex-1 py-3 bg-white/5 border border-white/10 text-white rounded-xl hover:bg-white/10 transition"
            disabled={isProcessing}
          >
            إلغاء
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 py-3 bg-accent text-white font-bold rounded-xl hover:opacity-90 transition flex justify-center items-center gap-2"
            disabled={isProcessing}
          >
            {isProcessing ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              "حفظ الصورة"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

interface EditableAvatarProps {
  user: User;
  isEditable?: boolean;
}

export const EditableAvatar: React.FC<EditableAvatarProps> = ({ user, isEditable = false }) => {
  const { showToast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [cropExtension, setCropExtension] = useState<string>("jpeg");
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const renderAvatarSrc = user.photoURL;

  const handleAvatarClick = async () => {
    if (!isEditable || isUploading) return;
    
    if (Capacitor.isNativePlatform()) {
      try {
        const result = await ActionSheet.showActions({
          title: "صورة الملف الشخصي",
          message: "اختر الإجراء الذي تود القيام به",
          options: [
            { title: "التقاط صورة" },
            { title: "اختيار من المعرض" },
            ...(user.photoURL ? [{ title: "حذف الصورة", style: ActionSheetButtonStyle.Destructive }] : []),
            { title: "إلغاء", style: ActionSheetButtonStyle.Cancel },
          ],
        });
        
        if (result.index === 0) takePhoto();
        else if (result.index === 1) chooseFromGallery();
        else if (result.index === 2 && user.photoURL) deletePhoto();
      } catch (e) {
        console.error("ActionSheet error:", e);
      }
    } else {
      setShowMenu(true);
    }
  };

  const uploadToSupabase = async (file: File | Blob, ext: string) => {
    setIsUploading(true);
    setShowMenu(false);
    try {
      // Force png extension as requested or fallback
      const extToUse = ext === 'jpeg' || ext === 'jpg' ? 'jpeg' : 'png';
      const filePath = `${user.id}/profile.${extToUse}`;
      const { error } = await supabase.storage
        .from("avatars") // Ensure you have a storage bucket named "avatars" on Supabase
        .upload(filePath, file, { upsert: true, contentType: `image/${extToUse}` });

      if (error) throw error;

      const { data: publicUrlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      // Append a timestamp to the public URL so Cache is busted globably on all posts/comments 
      const publicURL = `${publicUrlData.publicUrl}?v=${Date.now()}`;

      // Update Firebase Auth and Firestore simultaneously for instant reflection
      const updatePromises = [];
      if (auth.currentUser && auth.currentUser.uid === user.id) {
        updatePromises.push(updateProfile(auth.currentUser, { photoURL: publicURL }));
      }
      if (user.id) {
        updatePromises.push(updateDoc(doc(db, "users", user.id), { photoURL: publicURL }));
      } else {
        console.error("EditableAvatar: User ID missing");
        throw new Error("User ID missing");
      }
      
      await Promise.all(updatePromises);
      
      showToast("تم تحديث صورة الملف الشخصي بنجاح", "success");
    } catch (e: any) {
      console.error("Upload error:", e);
      // Determine if bucket doesn't exist or RLS is blocking it
      if (e.message?.toLowerCase().includes("not found") || e.statusCode === '404' || e.error === 'Bucket not found') {
        showToast("خطأ: يرجى إنشاء مجلد (Bucket) باسم 'avatars' في لوحة تحكم Supabase وتعيينه كـ Public", "error");
      } else if (e.message === 'Failed to fetch' || e.statusCode === '403') {
        showToast("خطأ (CORS/RLS): سياسة الأمان RLS في Supabase تمنع الرفع. الرجاء السماح برفع الملفات لدور 'anon'", "error");
      } else {
        showToast("فشل رفع الصورة: " + (e.message || ""), "error");
      }
    } finally {
      setIsUploading(false);
    }
  };

  const takePhoto = async () => {
    setShowMenu(false);
    try {
      if (Capacitor.isNativePlatform()) {
        const image = await Camera.getPhoto({
          quality: 80,
          allowEditing: false, 
          resultType: CameraResultType.Uri,
          source: CameraSource.Camera,
        });
        
        if (image.webPath) {
          const response = await fetch(image.webPath);
          const blob = await response.blob();
          const objUrl = URL.createObjectURL(blob);

          const ext = image.format || "jpeg";
          setCropExtension(ext);
          setCropImageSrc(objUrl);
        }
      } else {
        fileInputRef.current?.click();
      }
    } catch (e) {
      console.log("User cancelled camera or error:", e);
    }
  };

  const chooseFromGallery = async () => {
    setShowMenu(false);
    try {
      if (Capacitor.isNativePlatform()) {
        const image = await Camera.getPhoto({
          quality: 80, 
          allowEditing: false, 
          resultType: CameraResultType.Uri,
          source: CameraSource.Photos,
        });
        
        if (image.webPath) {
          const response = await fetch(image.webPath);
          const blob = await response.blob();
          const objUrl = URL.createObjectURL(blob);

          const ext = image.format || "jpeg";
          setCropExtension(ext);
          setCropImageSrc(objUrl);
        }
      } else {
        // Web fallback
        fileInputRef.current?.click();
      }
    } catch (e) {
      console.log("User cancelled gallery or error:", e);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setShowMenu(false);
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Check original image resolution before attempting crop
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.src = url;
    img.onload = () => {
      if (img.width < 400 || img.height < 400) {
        showToast("الصورة الأصلية دقتها أقل من 400x400 بجودة ضعيفة، يرجى اختيار صورة أخرى.", "error");
        return;
      }
      
      const ext = file.name.split(".").pop() || "jpeg";
      setCropExtension(ext);
      setCropImageSrc(url);
    };

    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const deletePhoto = async () => {
    setIsUploading(true);
    setShowMenu(false);
    try {
      // 1. Immediately delete from Firebase to update UI instantly everywhere
      const updatePromises = [];
      if (auth.currentUser && auth.currentUser.uid === user.id) {
        updatePromises.push(updateProfile(auth.currentUser, { photoURL: "" }));
      }
      if (user.id) {
        updatePromises.push(updateDoc(doc(db, "users", user.id), { photoURL: "" }));
      }
      
      await Promise.all(updatePromises);
      showToast("تم حذف صورة الملف الشخصي", "success");

      // 2. Clean up Supabase specifically without making the user wait for listing APIs
      supabase.storage.from("avatars")
        .remove([`${user.id}/profile.png`, `${user.id}/profile.jpeg`, `${user.id}/profile.jpg`])
        .catch(e => console.warn("Background cleanup error:", e));
        
    } catch (e: any) {
      console.error("Delete error:", e);
      showToast("فشل حذف الصورة: " + (e.message || ""), "error");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="relative group flex justify-center items-center">
      {/* Cropper Modal */}
      {cropImageSrc && (
        <ImageCropperModal
          imageSrc={cropImageSrc}
          onClose={() => setCropImageSrc(null)}
          onConfirm={(blob) => {
            setCropImageSrc(null); // Close modal
            uploadToSupabase(blob, cropExtension); // Proceed to supabase
          }}
        />
      )}

      {/* Hidden file input for web */}
      <input
        type="file"
        accept="image/*"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
      />

      <div 
        onClick={handleAvatarClick}
        className={`relative w-[150px] h-[150px] rounded-full shadow-2xl border-4 border-[#0a0f1f] bg-gradient-to-tr from-gray-700 to-gray-600 flex items-center justify-center font-bold overflow-hidden ${isEditable ? "cursor-pointer" : ""}`}
      >
        {renderAvatarSrc ? (
          <img 
            src={renderAvatarSrc} 
            alt={user.name} 
            referrerPolicy="no-referrer"
            className={`w-full h-full object-cover transition-opacity duration-300 ${isUploading ? "opacity-50" : "opacity-100"}`} 
          />
        ) : (
          <span className="text-6xl text-white">{user.name[0]?.toUpperCase()}</span>
        )}

        {isUploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
            <div className="w-10 h-10 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}

        {/* Camera icon overlay removed based on request */}
      </div>

      {/* Context Menu / Action Sheet Bottom Popover */}
      {showMenu && isEditable && (
        <div className="absolute top-[160px] z-50 animate-slide-up">
          {/* Backdrop for mobile */}
          <div 
            className="fixed inset-0 z-40 bg-black/20 md:hidden" 
            onClick={() => setShowMenu(false)}
          ></div>
          
          <div className="relative z-50 glass-card bg-[#111] border border-white/10 rounded-2xl p-2 w-56 shadow-2xl flex flex-col gap-1">
            <button 
              onClick={takePhoto} 
              className="flex items-center gap-3 w-full text-right px-4 py-3 rounded-xl hover:bg-white/10 text-white transition font-medium text-sm"
            >
              <Icons.Camera className="w-4 h-4 text-accent" />
              التقاط صورة
            </button>
            <button 
              onClick={chooseFromGallery} 
              className="flex items-center gap-3 w-full text-right px-4 py-3 rounded-xl hover:bg-white/10 text-white transition font-medium text-sm"
            >
              <Icons.Image className="w-4 h-4 text-accent" />
              اختيار من المعرض
            </button>
            {user.photoURL && (
              <button 
                onClick={deletePhoto} 
                className="flex items-center gap-3 w-full text-right px-4 py-3 rounded-xl hover:bg-red-500/20 text-red-500 transition font-medium text-sm mt-1 border-t border-white/5 pt-3"
              >
                <Icons.Trash className="w-4 h-4" />
                حذف الصورة
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

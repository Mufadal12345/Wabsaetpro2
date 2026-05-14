import { compressAvatar } from './image-processor';
import { uploadAndSyncAvatar } from './storage';

type UploadState = 'idle' | 'uploading' | 'success' | 'error';

class AvatarUploadManager {
  private state: UploadState = 'idle';
  private localUrl: string | null = null;
  private progress: number = 0;
  private userId: string | null = null;
  private listeners: Set<() => void> = new Set();
  
  public subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => { this.listeners.delete(listener); };
  }

  private notify() {
    this.listeners.forEach(l => l());
  }

  public getState() {
    return {
      state: this.state,
      localUrl: this.localUrl,
      progress: this.progress,
      userId: this.userId
    };
  }

  public async startUpload(userId: string, blob: Blob) {
    // 1. Set local optimistic state
    this.userId = userId;
    this.state = 'uploading';
    this.progress = 0;
    this.localUrl = URL.createObjectURL(blob);
    this.notify();

    // Setup an interval to simulate progress (since supabase storage upload doesn't give clean progress in standard method easily without custom xhr, we simulate part of it)
    const progressInterval = setInterval(() => {
        if (this.progress < 90) {
            this.progress += 10;
            this.notify();
        }
    }, 300);

    try {
        const compressedBlob = await compressAvatar(blob);
        const url = await uploadAndSyncAvatar(userId, compressedBlob);
        
        // Success
        this.progress = 100;
        this.state = 'success';
        clearInterval(progressInterval);
        this.notify();
        
        // Reset after a moment
        setTimeout(() => {
            this.state = 'idle';
            this.localUrl = null;
            this.progress = 0;
            this.userId = null;
            this.notify();
        }, 3000);
        
        return url;
    } catch (e) {
        clearInterval(progressInterval);
        this.state = 'error';
        this.notify();
        setTimeout(() => {
            this.state = 'idle';
            this.localUrl = null;
            this.progress = 0;
            this.notify();
        }, 5000);
        throw e;
    }
  }
}

export const avatarUploadManager = new AvatarUploadManager();

import firebase from 'firebase/compat/app';
import 'firebase/compat/database';
import 'firebase/compat/storage';

interface ImageReference {
  url: string;
  deviceId: string;
  themeName: 'local' | 'cloud';
  lastUsed: number;
}

interface ImageMetadata {
  uploadedAt: number;
  uploadedBy: string;
  references: Record<string, ImageReference>;
}

export class BackgroundImageManager {
  private static instance: BackgroundImageManager;
  private userId: string | null = null;
  private deviceId: string;

  private constructor() {
    // Generate or retrieve unique device ID
    let deviceId = localStorage.getItem('deviceId');
    if (!deviceId) {
      deviceId = `device_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      localStorage.setItem('deviceId', deviceId);
    }
    this.deviceId = deviceId;
  }

  static getInstance(): BackgroundImageManager {
    if (!BackgroundImageManager.instance) {
      BackgroundImageManager.instance = new BackgroundImageManager();
    }
    return BackgroundImageManager.instance;
  }

  setUserId(userId: string | null) {
    this.userId = userId;
  }

  /**
   * Extract storage path from Firebase Storage URL
   */
  private extractStoragePath(url: string): string | null {
    const baseUrl = 'https://firebasestorage.googleapis.com/v0/b/';
    if (!url.includes(baseUrl)) return null;
    
    try {
      const pathStart = url.indexOf('/o/') + 3;
      const pathEnd = url.indexOf('?');
      const encodedPath = url.substring(pathStart, pathEnd);
      return decodeURIComponent(encodedPath);
    } catch (error) {
      console.error('Error extracting storage path:', error);
      return null;
    }
  }

  /**
   * Generate metadata path from storage path
   */
  private getMetadataPath(storagePath: string): string {
    // Convert storage path to safe database key
    return `imageMetadata/${storagePath.replace(/[.#$/[\]]/g, '_')}`;
  }

  /**
   * Register a new image reference
   */
  async registerImageReference(imageUrl: string, themeName: 'local' | 'cloud'): Promise<void> {
    if (!this.userId || !imageUrl) return;
    
    const storagePath = this.extractStoragePath(imageUrl);
    if (!storagePath) return;
    
    const metadataPath = this.getMetadataPath(storagePath);
    const metadataRef = firebase.database().ref(metadataPath);
    
    try {
      // Create or update reference
      const referenceKey = `${this.deviceId}_${themeName}`;
      const reference: ImageReference = {
        url: imageUrl,
        deviceId: this.deviceId,
        themeName,
        lastUsed: Date.now()
      };
      
      await metadataRef.child('references').child(referenceKey).set(reference);
      
      // Update metadata if new image
      const snapshot = await metadataRef.once('value');
      if (!snapshot.exists() || !snapshot.val().uploadedAt) {
        await metadataRef.update({
          uploadedAt: Date.now(),
          uploadedBy: this.userId,
          storagePath
        });
      }
      
      console.log(`Registered reference for ${storagePath} from ${this.deviceId} (${themeName})`);
    } catch (error) {
      console.error('Error registering image reference:', error);
    }
  }

  /**
   * Remove an image reference
   */
  async removeImageReference(imageUrl: string, themeName: 'local' | 'cloud'): Promise<void> {
    if (!imageUrl) return;
    
    const storagePath = this.extractStoragePath(imageUrl);
    if (!storagePath) return;
    
    const metadataPath = this.getMetadataPath(storagePath);
    const referenceKey = `${this.deviceId}_${themeName}`;
    const metadataRef = firebase.database().ref(metadataPath);
    
    try {
      // Remove this device's reference
      await metadataRef.child('references').child(referenceKey).remove();
      
      // Check if there are any remaining references
      const snapshot = await metadataRef.once('value');
      const metadata = snapshot.val();
      
      if (metadata && (!metadata.references || Object.keys(metadata.references).length === 0)) {
        // No more references, delete the image
        console.log(`No more references for ${storagePath}, deleting image...`);
        
        try {
          const storageRef = firebase.storage().ref().child(storagePath);
          await storageRef.delete();
          console.log(`Deleted image: ${storagePath}`);
        } catch (storageError) {
          console.error('Error deleting image from storage:', storageError);
        }
        
        // Remove metadata
        await metadataRef.remove();
      } else {
        console.log(`Image ${storagePath} still has ${Object.keys(metadata.references || {}).length} references`);
      }
    } catch (error) {
      console.error('Error removing image reference:', error);
    }
  }

  /**
   * Update reference when theme changes
   */
  async updateImageReference(
    oldImageUrl: string | undefined,
    newImageUrl: string | undefined,
    themeName: 'local' | 'cloud'
  ): Promise<void> {
    // Remove old reference if exists
    if (oldImageUrl && oldImageUrl !== newImageUrl) {
      await this.removeImageReference(oldImageUrl, themeName);
    }
    
    // Add new reference if exists
    if (newImageUrl) {
      await this.registerImageReference(newImageUrl, themeName);
    }
  }

  /**
   * Clean up stale references (older than 30 days without use)
   */
  async cleanupStaleReferences(): Promise<void> {
    if (!this.userId) return;
    
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    const metadataRef = firebase.database().ref('imageMetadata');
    
    try {
      const snapshot = await metadataRef.once('value');
      const allMetadata = snapshot.val() || {};
      
      for (const [key, metadata] of Object.entries(allMetadata)) {
        const meta = metadata as ImageMetadata & { storagePath?: string };
        if (!meta.references) continue;
        
        // Check each reference
        const staleReferences: string[] = [];
        for (const [refKey, ref] of Object.entries(meta.references)) {
          const reference = ref as ImageReference;
          if (reference.lastUsed < thirtyDaysAgo) {
            staleReferences.push(refKey);
          }
        }
        
        // Remove stale references
        for (const refKey of staleReferences) {
          await metadataRef.child(key).child('references').child(refKey).remove();
          console.log(`Removed stale reference: ${refKey}`);
        }
        
        // Check if image should be deleted
        const remainingRefs = await metadataRef.child(key).child('references').once('value');
        if (!remainingRefs.exists() || Object.keys(remainingRefs.val() || {}).length === 0) {
          // Delete image and metadata
          if (meta.storagePath) {
            try {
              const storageRef = firebase.storage().ref().child(meta.storagePath);
              await storageRef.delete();
              console.log(`Deleted stale image: ${meta.storagePath}`);
            } catch (error) {
              console.error('Error deleting stale image:', error);
            }
          }
          await metadataRef.child(key).remove();
        }
      }
    } catch (error) {
      console.error('Error cleaning up stale references:', error);
    }
  }

  /**
   * Get all images for current user with their reference counts
   */
  async getUserImages(): Promise<Array<{
    url: string;
    storagePath: string;
    uploadedAt: number;
    referenceCount: number;
    references: ImageReference[];
  }>> {
    if (!this.userId) return [];
    
    const metadataRef = firebase.database().ref('imageMetadata');
    
    try {
      const snapshot = await metadataRef.once('value');
      const allMetadata = snapshot.val() || {};
      
      const userImages = [];
      
      for (const metadata of Object.values(allMetadata)) {
        const meta = metadata as ImageMetadata & { storagePath?: string };
        
        // Check if this image belongs to current user
        if (meta.uploadedBy === this.userId && meta.storagePath) {
          const references = Object.values(meta.references || {});
          
          // Reconstruct URL from first reference or generate it
          let url = '';
          if (references.length > 0) {
            url = (references[0] as ImageReference).url;
          } else {
            // Generate URL from storage path
            const storageRef = firebase.storage().ref().child(meta.storagePath);
            try {
              url = await storageRef.getDownloadURL();
            } catch (error) {
              console.error(`Could not get URL for ${meta.storagePath}`);
              continue;
            }
          }
          
          userImages.push({
            url,
            storagePath: meta.storagePath,
            uploadedAt: meta.uploadedAt,
            referenceCount: references.length,
            references: references as ImageReference[]
          });
        }
      }
      
      return userImages.sort((a, b) => b.uploadedAt - a.uploadedAt);
    } catch (error) {
      console.error('Error getting user images:', error);
      return [];
    }
  }

  /**
   * Migrate existing theme to use reference counting
   */
  async migrateExistingTheme(theme: any, themeName: 'local' | 'cloud'): Promise<void> {
    if (theme?.backgroundImage) {
      await this.registerImageReference(theme.backgroundImage, themeName);
    }
  }
}

// Export singleton instance
export const backgroundImageManager = BackgroundImageManager.getInstance();
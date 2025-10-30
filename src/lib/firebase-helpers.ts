'use client';
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
} from 'firebase/storage';
import { useFirebaseApp } from '@/firebase';

export function useFirebaseStorage() {
  const app = useFirebaseApp();
  const storage = getStorage(app);

  const uploadFile = async (path: string, file: File) => {
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(storageRef);
    return downloadURL;
  };

  return { uploadFile };
}

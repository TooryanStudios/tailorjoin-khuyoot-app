// src/features/tailor-join/hooks/useImageUpload.js

import { useState } from 'react';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '../../../firebase/config';
import { compressImage } from '../utils/imageProcessor';

/**
 * Hook for uploading images to Firebase Storage with compression and progress tracking
 */
export function useImageUpload() {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);

  /**
   * Upload a single image
   * @param {File} file - Image file to upload
   * @param {string} path - Storage path (e.g., "users/{uid}/board_123456.jpg")
   * @returns {Promise<string>} Download URL
   */
  const uploadImage = async (file, path) => {
    setUploading(true);
    setProgress(0);
    setError(null);

    try {
      // Compress image first
      const compressedFile = await compressImage(file);
      
      // Create storage reference
      const storageRef = ref(storage, path);
      
      // Upload with progress tracking
      const uploadTask = uploadBytesResumable(storageRef, compressedFile);
      
      return new Promise((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          (snapshot) => {
            // Track progress
            const progressPercent = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            setProgress(progressPercent);
          },
          (error) => {
            // Handle error
            setError(error.message);
            setUploading(false);
            reject(error);
          },
          async () => {
            // Upload complete - get download URL
            try {
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
              setUploading(false);
              setProgress(100);
              resolve(downloadURL);
            } catch (err) {
              setError(err.message);
              setUploading(false);
              reject(err);
            }
          }
        );
      });
    } catch (err) {
      setError(err.message);
      setUploading(false);
      throw err;
    }
  };

  /**
   * Upload multiple images
   * @param {File[]} files - Array of image files
   * @param {Function} pathGenerator - Function that takes (file, index) and returns storage path
   * @returns {Promise<string[]>} Array of download URLs
   */
  const uploadMultipleImages = async (files, pathGenerator) => {
    setUploading(true);
    setProgress(0);
    setError(null);

    try {
      const uploadPromises = files.map(async (file, index) => {
        const path = pathGenerator(file, index);
        const compressedFile = await compressImage(file);
        const storageRef = ref(storage, path);
        
        await uploadBytesResumable(storageRef, compressedFile);
        return await getDownloadURL(storageRef);
      });

      // Track overall progress
      let completed = 0;
      const urls = await Promise.all(
        uploadPromises.map(async (promise) => {
          const url = await promise;
          completed++;
          setProgress((completed / files.length) * 100);
          return url;
        })
      );

      setUploading(false);
      setProgress(100);
      return urls;
    } catch (err) {
      setError(err.message);
      setUploading(false);
      throw err;
    }
  };

  /**
   * Reset upload state
   */
  const reset = () => {
    setUploading(false);
    setProgress(0);
    setError(null);
  };

  return {
    uploadImage,
    uploadMultipleImages,
    uploading,
    progress,
    error,
    reset
  };
}

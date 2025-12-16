import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

// Initialize Firebase Storage
const storage = getStorage();

// Function to upload a file to Firebase Storage
export const uploadFile = async (file, path) => {
    const storageRef = ref(storage, path);
    try {
        await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(storageRef);
        return downloadURL;
    } catch (error) {
        throw new Error(`File upload failed: ${error.message}`);
    }
};

// Function to delete a file from Firebase Storage
export const deleteFile = async (path) => {
    const fileRef = ref(storage, path);
    try {
        await deleteObject(fileRef);
    } catch (error) {
        throw new Error(`File deletion failed: ${error.message}`);
    }
};
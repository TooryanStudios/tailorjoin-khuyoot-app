import { db } from '../../app'; // Adjust the import based on your app's Firestore setup
import { collection, addDoc, getDocs, query, where } from 'firebase/firestore';

// Function to add a new user document to Firestore
export const addUser = async (userData) => {
    try {
        const docRef = await addDoc(collection(db, 'users'), userData);
        return docRef.id;
    } catch (error) {
        console.error('Error adding user: ', error);
        throw new Error('Could not add user to Firestore');
    }
};

// Function to get user data by phone number
export const getUserByPhone = async (phone) => {
    try {
        const q = query(collection(db, 'users'), where('phone', '==', phone));
        const querySnapshot = await getDocs(q);
        const users = [];
        querySnapshot.forEach((doc) => {
            users.push({ id: doc.id, ...doc.data() });
        });
        return users.length > 0 ? users[0] : null;
    } catch (error) {
        console.error('Error getting user by phone: ', error);
        throw new Error('Could not retrieve user data');
    }
};

// Function to update user data
export const updateUser = async (userId, updatedData) => {
    try {
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, updatedData);
    } catch (error) {
        console.error('Error updating user: ', error);
        throw new Error('Could not update user data');
    }
};
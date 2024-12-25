import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  projectId: 'keeprates-770e5',
  // Add other config values as needed
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

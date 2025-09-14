
'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User as FirebaseUser, 
  onAuthStateChanged, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db, googleProvider, facebookProvider, githubProvider } from '@/lib/firebase';
import { User } from '@/lib/types';

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, username: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithFacebook: () => Promise<void>;
  signInWithGithub: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setFirebaseUser(firebaseUser);
      
      if (firebaseUser) {
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        
        if (userDoc.exists()) {
          setUser(userDoc.data() as User);
          await updateDoc(doc(db, 'users', firebaseUser.uid), {
            lastLoginAt: new Date()
          });
        } else {
          const newUser: User = {
            id: firebaseUser.uid,
            username: (firebaseUser.displayName?.replace(/@/g, '') || firebaseUser.email?.split('@')[0] || 'User'),
            email: firebaseUser.email || '',
            displayName: firebaseUser.displayName || '',
            photoURL: firebaseUser.photoURL || '',
            createdAt: new Date(),
            lastLoginAt: new Date(),
            playlists: [],
            likedSongs: []
          };
          
          await setDoc(doc(db, 'users', firebaseUser.uid), newUser);
          setUser(newUser);
        }
      } else {
        setUser(null);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signIn = async (email: string, password: string) => {
    let userEmail = email;
    if (!email.includes('@')) {
      const { getDocs, collection, query, where } = await import('firebase/firestore');
      const q = query(collection(db, 'users'), where('username', '==', email));
      const querySnapshot = await getDocs(q);
      let foundEmail = null;
      querySnapshot.forEach((doc) => {
        foundEmail = doc.data().email;
      });
      if (!foundEmail) throw new Error('No user found with that username');
      userEmail = foundEmail;
    }
    await signInWithEmailAndPassword(auth, userEmail, password);
  };

  const signUp = async (email: string, password: string, username: string) => {
    const { user: firebaseUser } = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(firebaseUser, { displayName: username });
    const newUser: User = {
      id: firebaseUser.uid,
      username,
      email: firebaseUser.email || '',
      displayName: username,
      photoURL: firebaseUser.photoURL || '',
      createdAt: new Date(),
      lastLoginAt: new Date(),
      playlists: [],
      likedSongs: []
    };
    await setDoc(doc(db, 'users', firebaseUser.uid), newUser);
  };

  const signInWithProvider = async (provider: import('firebase/auth').AuthProvider) => {
    await signInWithPopup(auth, provider);
  };

  const signInWithGoogle = () => signInWithProvider(googleProvider);
  const signInWithFacebook = () => signInWithProvider(facebookProvider);
  const signInWithGithub = () => signInWithProvider(githubProvider);

  const signOut = async () => {
    await firebaseSignOut(auth);
  };

  const value = {
    user,
    firebaseUser,
    loading,
    signIn,
    signUp,
    signInWithGoogle,
    signInWithFacebook,
    signInWithGithub,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
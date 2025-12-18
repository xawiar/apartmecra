// Admin kullanıcısını oluşturmak için script
import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, collection, addDoc, serverTimestamp, doc, setDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDMe5MyBF1zvE4sznBLRXAeteu0L0AYpMY",
  authDomain: "apartmecraelazig.firebaseapp.com",
  projectId: "apartmecraelazig",
  storageBucket: "apartmecraelazig.firebasestorage.app",
  messagingSenderId: "21282078673",
  appId: "1:21282078673:web:86a736f4910c50392aeaf0"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function createAdminUser() {
  try {
    console.log('Creating admin user...');
    
    const userCredential = await createUserWithEmailAndPassword(
      auth, 
      'admin@example.com', 
      'SecureAdmin2025!'
    );
    
    console.log('✅ Admin user created successfully:', userCredential.user.uid);
    console.log('📧 Email:', userCredential.user.email);
    
    // Firestore'a da kaydet
    const userData = {
      uid: userCredential.user.uid,
      email: 'admin@example.com',
      username: 'admin',
      role: 'admin',
      status: 'active',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    // Users koleksiyonuna kaydet
    await setDoc(doc(db, 'users', userCredential.user.uid), userData);
    
    console.log('✅ Admin user document created in Firestore');
    console.log('🎉 Admin user setup completed successfully!');
    
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    
    if (error.code === 'auth/email-already-in-use') {
      console.log('ℹ️ Admin user already exists, checking Firestore...');
      
      // Kullanıcı zaten varsa, Firestore'da da var mı kontrol et
      try {
        const userCredential = await signInWithEmailAndPassword(
          auth, 
          'admin@example.com', 
          'SecureAdmin2025!'
        );
        
        console.log('✅ Admin user login successful:', userCredential.user.uid);
        
        // Firestore'da kullanıcı var mı kontrol et
        const userDoc = doc(db, 'users', userCredential.user.uid);
        await setDoc(userDoc, {
          uid: userCredential.user.uid,
          email: 'admin@example.com',
          username: 'admin',
          role: 'admin',
          status: 'active',
          updatedAt: serverTimestamp()
        }, { merge: true });
        
        console.log('✅ Admin user document updated in Firestore');
        console.log('🎉 Admin user is ready to use!');
        
      } catch (loginError) {
        console.error('❌ Login error:', loginError);
      }
    }
  }
}

createAdminUser();

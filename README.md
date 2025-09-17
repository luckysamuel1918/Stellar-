# Westcoast Trust Bank - React Application

This project is a modern digital banking and investment platform built with React, Vite, and Firebase.

## Setup Firebase Environment Variables

To run this project locally, you need to configure your Firebase credentials.

1.  **Copy the example file:**
    In the root directory, make a copy of `.env.example` and rename it to `.env`.

    ```bash
    cp .env.example .env
    ```

2.  **Add your Firebase credentials:**
    Open the newly created `.env` file and replace the placeholder values with your actual Firebase project credentials. You can find these in your Firebase project console:
    *Project Settings* > *General* > *Your apps* > *SDK setup and configuration*.

    ```ini
    VITE_FIREBASE_API_KEY=your_api_key_here
    VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
    VITE_FIREBASE_PROJECT_ID=your_project_id
    VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
    VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
    VITE_FIREBASE_APP_ID=your_app_id
    VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
    VITE_GEMINI_API_KEY=your_gemini_api_key_here
    ```

3.  **Production Setup (Vercel):**
    For deployment, you must add the same environment variables to your Vercel project settings.
    - Go to your project on Vercel.
    - Navigate to *Settings* > *Environment Variables*.
    - Add each key-value pair from your `.env` file.You are helping me debug my Vite + Firebase website deployed on Vercel. 

Problem:  
- Users can register and their data is correctly stored in Firestore under `users/{uid}`.  
- But when logging in, the website fails to fetch and display the user data.  
- Firestore rules are open (`allow read, write: if true`), so it’s not a rules issue.  
- I suspect either the Firebase config (env vars), the Firestore query, or the auth UID handling is wrong.

Tasks for you:  
1. Check if my Firebase config is using `import.meta.env.VITE_...` for all keys (because Vite only exposes env vars that start with `VITE_`).  
2. Make sure I’m querying Firestore with the correct path:  
   ```js
   const userRef = doc(db, "users", user.uid);
   const snap = await getDoc(userRef);You are helping me debug my Vite + Firebase website deployed on Vercel. 

Problem:  
- Users can register and their data is correctly stored in Firestore under `users/{uid}`.  
- But when logging in, the website fails to fetch and display the user data.  
- Firestore rules are open (`allow read, write: if true`), so it’s not a rules issue.  
- I suspect either the Firebase config (env vars), the Firestore query, or the auth UID handling is wrong.

Tasks for you:  
1. Check if my Firebase config is using `import.meta.env.VITE_...` for all keys (because Vite only exposes env vars that start with `VITE_`).  
2. Make sure I’m querying Firestore with the correct path:  
   ```js
   const userRef = doc(db, "users", user.uid);
   const snap = await getDoc(userRef);
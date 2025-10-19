# Westcoast Trust Bank - React Application

This project is a modern digital banking and investment platform built with React, Vite, and Firebase.

## Setup & Running

This project uses Vite for development and building.

1.  **Install dependencies:**
    ```bash
    npm install
    ```
2.  **Run the development server:**
    ```bash
    npm run dev
    ```

## ⚠️ Important Security Notice

**All API keys and sensitive credentials (Firebase, EmailJS, Gemini) have been hardcoded directly into the source code.**

-   `services/firebase.ts`: Contains Firebase and EmailJS credentials.
-   `vite.config.ts`: Contains the Google Gemini API Key.

This was done per a specific request to remove reliance on environment variables. However, this is a **major security risk** and is **not recommended for any production application**.

Exposing these keys on the client-side allows anyone to potentially misuse your accounts, leading to data breaches and high costs. It is strongly advised to revert these changes and use environment variables for all sensitive data before deploying this application.

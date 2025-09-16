// FIX: Removed the triple-slash directive for "vite/client" which was causing a type resolution error.
// It's likely these types are included globally in the project's tsconfig.json.
import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';

// For environment variable verification as requested.
// Create a .env file and add VITE_TEST_MESSAGE="Hello World" to see it in the console.
console.log("Test message from .env:", process.env.VITE_TEST_MESSAGE);

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <HashRouter>
        <App />
      </HashRouter>
    </ErrorBoundary>
  </React.StrictMode>
);
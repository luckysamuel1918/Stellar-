import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(_: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // You can also log the error to an error reporting service
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <div style={{ textAlign: 'center', padding: '40px', fontFamily: 'Inter, sans-serif', backgroundColor: '#F6F9FC', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <div>
                <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#0A2540' }}>Oops! Something went wrong.</h1>
                <p style={{ marginTop: '1rem', color: '#6B7280' }}>A runtime error occurred. Please try refreshing the page.</p>
                <button onClick={() => window.location.reload()} style={{ marginTop: '1.5rem', padding: '0.75rem 1.5rem', backgroundColor: '#0077FF', color: 'white', border: 'none', borderRadius: '9999px', fontWeight: 'bold', cursor: 'pointer' }}>
                    Refresh Page
                </button>
            </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

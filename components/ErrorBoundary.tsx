import React, { ErrorInfo, ReactNode } from 'react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
}

// A simple fallback component that doesn't rely on context
const ErrorFallbackUI = () => {
    // Cannot use hooks here as it's a class component's render path
    // We'll use hardcoded, widely understood text or rely on browser translation.
    const text = {
        title: "Oops! Something went wrong.",
        subtitle: "A runtime error occurred. Please try refreshing the page.",
        button: "Refresh Page"
    };

    return (
        <div style={{ textAlign: 'center', padding: '40px', fontFamily: 'Inter, sans-serif', backgroundColor: '#F6F9FC', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <div>
                <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#0A2540' }}>{text.title}</h1>
                <p style={{ marginTop: '1rem', color: '#6B7280' }}>{text.subtitle}</p>
                <button onClick={() => window.location.reload()} style={{ marginTop: '1.5rem', padding: '0.75rem 1.5rem', backgroundColor: '#0077FF', color: 'white', border: 'none', borderRadius: '9999px', fontWeight: 'bold', cursor: 'pointer' }}>
                    {text.button}
                </button>
            </div>
        </div>
    );
};


class ErrorBoundary extends React.Component<Props, State> {
  // FIX: Replaced class property state initialization with a constructor. This standard approach ensures `this.props` is correctly initialized via `super(props)`, resolving a TypeScript error where 'props' was not found on the component instance.
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // You can also log the error to an error reporting service
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // Render the fallback UI
      return <ErrorFallbackUI />;
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
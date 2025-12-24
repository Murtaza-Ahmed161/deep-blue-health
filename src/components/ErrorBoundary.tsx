import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ 
          padding: 20, 
          color: 'red', 
          backgroundColor: '#fff',
          minHeight: '100vh',
          fontFamily: 'monospace'
        }}>
          <h1 style={{ fontSize: 24, marginBottom: 16 }}>🚨 Error Caught by ErrorBoundary</h1>
          <pre style={{ 
            backgroundColor: '#f5f5f5', 
            padding: 16, 
            borderRadius: 4,
            overflow: 'auto',
            fontSize: 12
          }}>
            <strong>Error:</strong> {this.state.error?.toString()}
            {'\n\n'}
            <strong>Stack:</strong>
            {'\n'}
            {this.state.error?.stack}
            {'\n\n'}
            {this.state.errorInfo && (
              <>
                <strong>Component Stack:</strong>
                {'\n'}
                {this.state.errorInfo.componentStack}
              </>
            )}
          </pre>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;




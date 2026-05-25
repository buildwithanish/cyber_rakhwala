/**
 * Error Boundary Component
 * Catches and handles React errors gracefully
 */

import React from 'react';
import { ErrorPage } from './ErrorDisplay';
import { recordFrontendError } from '../../utils/debugStore';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error Boundary caught:', error, errorInfo);
    this.setState({
      error,
      errorInfo
    });
    recordFrontendError(error, {
      componentStack: errorInfo?.componentStack || null,
      source: 'ErrorBoundary'
    });
    
    // Log to error tracking service (e.g., Sentry)
    if (window.logError) {
      window.logError(error, errorInfo);
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      const isDev = import.meta.env.DEV;
      
      return (
        <ErrorPage
          title="Application Error"
          message={
            isDev && this.state.error 
              ? this.state.error.toString()
              : 'Something went wrong. Please refresh the page or try again later.'
          }
          onRetry={this.handleRetry}
        />
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

import React from 'react';
import logger from '../utils/logger';

/**
 * Error Boundary Component
 * Catches JavaScript errors anywhere in the child component tree,
 * logs those errors, and displays a fallback UI instead of crashing
 */
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
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log error to console and error tracking service
    logger.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo
    });

    // Send to error tracking service if available
    if (window.Sentry) {
      window.Sentry.captureException(error, {
        contexts: {
          react: {
            componentStack: errorInfo.componentStack
          }
        }
      });
    }
  }

  handleReset = () => {
    this.setState({ 
      hasError: false, 
      error: null,
      errorInfo: null 
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.handleReset);
      }

      // Default fallback UI
      return (
        <div className="container-fluid d-flex align-items-center justify-content-center" style={{ minHeight: '100vh' }}>
          <div className="card border-danger shadow-lg" style={{ maxWidth: '600px', width: '100%' }}>
            <div className="card-header bg-danger text-white">
              <h5 className="mb-0">
                <i className="bi bi-exclamation-triangle-fill me-2"></i>
                Bir Hata Oluştu
              </h5>
            </div>
            <div className="card-body">
              <div className="alert alert-danger">
                <h6 className="alert-heading">Uygulamada beklenmeyen bir hata oluştu</h6>
                <p className="mb-0">
                  Lütfen sayfayı yenileyin veya daha sonra tekrar deneyin.
                </p>
              </div>
              
              {this.props.showDetails && this.state.error && (
                <details className="mt-3">
                  <summary className="text-muted small">Hata Detayları (Geliştiriciler için)</summary>
                  <pre className="bg-light p-3 mt-2 small" style={{ fontSize: '0.75rem', maxHeight: '200px', overflow: 'auto' }}>
                    <strong>Error:</strong> {this.state.error.toString()}
                    {this.state.errorInfo && (
                      <>
                        <br />
                        <strong>Component Stack:</strong>
                        <br />
                        {this.state.errorInfo.componentStack}
                      </>
                    )}
                  </pre>
                </details>
              )}
              
              <div className="d-flex gap-2 mt-4">
                <button 
                  className="btn btn-primary flex-fill"
                  onClick={this.handleReload}
                >
                  <i className="bi bi-arrow-clockwise me-2"></i>
                  Sayfayı Yenile
                </button>
                <button 
                  className="btn btn-outline-secondary flex-fill"
                  onClick={this.handleReset}
                >
                  <i className="bi bi-x-circle me-2"></i>
                  Tekrar Dene
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;


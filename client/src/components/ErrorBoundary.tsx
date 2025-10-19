import React from "react";
import { AlertTriangle, RefreshCw, Wifi, CreditCard, ShieldX, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
  errorType?: 'network' | 'payment' | 'auth' | 'api' | 'general';
  retryCount: number;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error?: Error; resetError: () => void }>;
  maxRetries?: number;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, retryCount: 0 };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Classify error type based on message/name  
    let errorType: ErrorBoundaryState['errorType'] = 'general';
    
    if (error.message.includes('Network Error') || error.message.includes('fetch')) {
      errorType = 'network';
    } else if (error.message.includes('stripe') || error.message.includes('payment')) {
      errorType = 'payment';
    } else if (error.message.includes('auth') || error.message.includes('unauthorized')) {
      errorType = 'auth';
    } else if (error.message.includes('api') || error.message.includes('server')) {
      errorType = 'api';
    }
    
    // Preserve existing retryCount when error occurs
    this.setState((prevState) => ({ 
      error, 
      errorInfo, 
      errorType,
      retryCount: prevState.retryCount || 0
    }));
  }

  resetError = () => {
    const maxRetries = this.props.maxRetries || 3;
    const newRetryCount = this.state.retryCount + 1;
    
    if (newRetryCount <= maxRetries) {
      this.setState({ 
        hasError: false, 
        error: undefined, 
        errorInfo: undefined, 
        retryCount: newRetryCount 
      });
    } else {
      // Max retries reached, show permanent error state
      this.setState({ retryCount: newRetryCount });
    }
  };

  getErrorIcon = (errorType?: string) => {
    switch (errorType) {
      case 'network': return <Wifi className="w-8 h-8 text-red-400" />;
      case 'payment': return <CreditCard className="w-8 h-8 text-red-400" />;
      case 'auth': return <ShieldX className="w-8 h-8 text-red-400" />;
      case 'api': return <AlertCircle className="w-8 h-8 text-red-400" />;
      default: return <AlertTriangle className="w-8 h-8 text-red-400" />;
    }
  };

  getErrorMessage = (errorType?: string) => {
    switch (errorType) {
      case 'network': 
        return "Connection lost. Please check your internet connection and try again.";
      case 'payment': 
        return "Payment processing error. Your transaction is safe. Please try again.";
      case 'auth': 
        return "Authentication failed. Please log in again to continue.";
      case 'api': 
        return "Server temporarily unavailable. Our team has been notified.";
      default: 
        return "ActionLadder encountered an unexpected error. Don't worry, your data is safe.";
    }
  };

  getErrorTitle = (errorType?: string) => {
    switch (errorType) {
      case 'network': return "Connection Problem";
      case 'payment': return "Payment Issue";
      case 'auth': return "Session Expired";
      case 'api': return "Server Error";
      default: return "Something went wrong";
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return <FallbackComponent error={this.state.error} resetError={this.resetError} />;
      }

      const maxRetries = this.props.maxRetries || 3;
      const isMaxRetriesReached = this.state.retryCount > maxRetries;
      
      return (
        <div className="min-h-screen bg-black flex items-center justify-center p-4">
          <Card className="max-w-md w-full bg-gray-900 border-red-500/30">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-4">
                {this.getErrorIcon(this.state.errorType)}
              </div>
              <CardTitle className="text-white text-xl">
                {this.getErrorTitle(this.state.errorType)}
              </CardTitle>
              
              {this.state.retryCount > 0 && (
                <Badge variant="outline" className="mt-2 border-orange-500/30 text-orange-400">
                  Attempt {this.state.retryCount}/{maxRetries}
                </Badge>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-400 text-center">
                {this.getErrorMessage(this.state.errorType)}
              </p>
              
              <div className="space-y-2">
                {!isMaxRetriesReached ? (
                  <Button 
                    onClick={this.resetError}
                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                    data-testid="button-retry"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Try Again ({maxRetries - this.state.retryCount} left)
                  </Button>
                ) : (
                  <div className="text-center">
                    <p className="text-orange-400 text-sm mb-3">
                      Maximum retry attempts reached. Please reload the page.
                    </p>
                  </div>
                )}
                
                <Button 
                  onClick={() => window.location.reload()}
                  variant="outline"
                  className="w-full border-gray-600 text-gray-300 hover:bg-gray-800"
                  data-testid="button-reload"
                >
                  Reload Page
                </Button>
                
                {this.state.errorType === 'auth' && (
                  <Button 
                    onClick={() => window.location.href = '/login'}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                    data-testid="button-login"
                  >
                    <ShieldX className="w-4 h-4 mr-2" />
                    Log In Again
                  </Button>
                )}
              </div>

              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="mt-4 p-3 bg-gray-800 rounded border border-gray-700">
                  <summary className="text-red-400 cursor-pointer text-sm font-medium">
                    Debug Info (Development Only)
                  </summary>
                  <div className="mt-2 text-xs text-gray-300 font-mono whitespace-pre-wrap overflow-auto max-h-40">
                    {this.state.error.stack}
                  </div>
                </details>
              )}
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
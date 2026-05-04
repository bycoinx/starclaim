import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="p-4 border border-red-500/30 bg-red-500/10 rounded-lg text-red-400 text-sm">
          Something went wrong in this component.
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

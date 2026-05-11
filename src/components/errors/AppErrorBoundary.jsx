import { Component } from 'react';
import ServerError from '../../pages/Errors/components/ServerError';

class AppErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error de render capturado por AppErrorBoundary:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return <ServerError onRetry={this.handleRetry} detail={this.state.error?.message || ''} />;
    }

    return this.props.children;
  }
}

export default AppErrorBoundary;
import * as React from 'react';
import { IRilog } from '../types';

interface RilogErrorBoundaryProps {
    rilog: IRilog;
    children: React.ReactNode;
    fallback?: React.ReactNode;
}

interface RilogErrorBoundaryState {
    hasError: boolean;
}

class RilogErrorBoundary extends React.Component<RilogErrorBoundaryProps, RilogErrorBoundaryState> {
    state: RilogErrorBoundaryState = { hasError: false };

    static getDerivedStateFromError(): RilogErrorBoundaryState {
        return { hasError: true };
    }

    componentDidCatch(error: Error, info: React.ErrorInfo): void {
        this.props.rilog.logData(
            { message: error.message, stack: error.stack, componentStack: info.componentStack },
            { label: 'FATAL_REACT_ERROR' },
        );
    }

    render(): React.ReactNode {
        if (this.state.hasError) {
            return this.props.fallback ?? null;
        }
        return this.props.children;
    }
}

export { RilogErrorBoundary };

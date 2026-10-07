import { Component, type ReactNode } from 'react';
import { Link } from 'react-router-dom';

export default class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
    state = { failed: false };
    static getDerivedStateFromError() { return { failed: true }; }
    render() {
        if (this.state.failed) return <main className="state-screen" role="alert">
            <span className="state-icon" aria-hidden="true">!</span>
            <h1>Something went wrong</h1><p>Your work may still be saved. Reload the page to reconnect.</p>
            <button className="primary-button" onClick={() => window.location.reload()}>Reload page</button>
        </main>;
        return this.props.children;
    }
}

export function NotFoundPage() {
    return <main className="state-screen"><span className="eyebrow">404 · Page not found</span>
        <h1>Let’s get you back on track.</h1><p>This page may have moved, or the address may be incomplete.</p>
        <Link className="primary-button" to="/dashboard">Go to workspaces</Link></main>;
}

import { useEffect, type ReactNode } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useTheme, type ThemePreference } from '../theme/ThemeContext';
import Icon from '../ui/Icon';

export default function AppShell({ children }: { children: ReactNode }) {
    const { theme, setTheme } = useTheme();
    const { pathname } = useLocation();
    const segments = pathname.split('/').filter(Boolean);
    const inWorkspace = segments[0] === 'workspaces' && /^\d+$/.test(segments[1] ?? '');
    const inProject = inWorkspace && segments[2] === 'projects' && /^\d+$/.test(segments[3] ?? '');
    const isPublic = ['/', '/login', '/register'].includes(pathname);
    const names: Record<string, string> = { '/': 'Plan your work', '/login': 'Sign in', '/register': 'Create account', '/dashboard': 'Dashboard' };
    const pageTitle = names[pathname] ?? (segments.includes('boards') ? 'Board' : inProject ? 'Project' : inWorkspace ? 'Workspace' : 'Page');
    useEffect(() => { document.title = `${pageTitle} · KanbanFlow`; }, [pageTitle]);
    return (
        <div className={`app-shell ${isPublic ? 'public-shell' : 'workspace-shell'}`}>
            <a className="skip-link" href="#main-content">Skip to content</a>
            <header className="app-bar">
                <div className="app-bar-inner">
                    <Link className="brand" to={isPublic ? '/' : '/dashboard'} aria-label="KanbanFlow home">
                        <span className="brand-mark" aria-hidden="true"><i /><i /><i /></span>
                        <span>Kanban<span className="brand-accent">Flow</span></span>
                    </Link>
                    <nav className="app-nav" aria-label="Main navigation">
                        {isPublic ? <>
                            <NavLink to="/login">Sign in</NavLink>
                            <NavLink to="/register" className="nav-primary">Get started</NavLink>
                        </> : <NavLink to="/dashboard"><Icon name="grid" size={16} /> Workspaces</NavLink>}
                    </nav>
                    <label className="theme-control">
                        <Icon name={theme === 'light' ? 'sun' : 'moon'} size={16} />
                        <span className="sr-only">Color theme</span>
                        <select value={theme} onChange={event => setTheme(event.target.value as ThemePreference)}>
                            <option value="light">Light</option><option value="dark">Dark</option><option value="system">System</option>
                        </select>
                    </label>
                </div>
            </header>
            {inWorkspace && <nav className="breadcrumbs" aria-label="Breadcrumb">
                <Link to="/dashboard">Workspaces</Link><span aria-hidden="true">/</span>
                {inProject ? <Link to={`/workspaces/${segments[1]}`}>Workspace</Link> : <span aria-current="page">Workspace</span>}
                {inProject && <><span aria-hidden="true">/</span>{segments.includes('boards') ? <Link to={`/workspaces/${segments[1]}/projects/${segments[3]}`}>Project</Link> : <span aria-current="page">Project</span>}</>}
                {segments.includes('boards') && <><span aria-hidden="true">/</span><span aria-current="page">Board</span></>}
            </nav>}
            <div id="main-content" key={pathname} className="page-frame" tabIndex={-1}>{children}</div>
            <footer className="app-footer"><span className="footer-brand">KanbanFlow</span><span>Make room for focused work.</span><span className="footer-detail">Projects. People. Progress.</span></footer>
        </div>
    );
}

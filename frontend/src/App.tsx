import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import ProtectedRoute from './components/auth/ProtectedRoute';
import GuestRoute from './components/auth/GuestRoute';
import AppShell from './components/layout/AppShell';
import ErrorBoundary, { NotFoundPage } from './components/ui/ErrorBoundary';

const BoardPage = lazy(() => import('./pages/BoardPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const HomePage = lazy(() => import('./pages/HomePage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const ProjectPage = lazy(() => import('./pages/ProjectPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const WorkspacePage = lazy(() => import('./pages/WorkspacePage'));

function App() {
    return (
        <AppShell><ErrorBoundary><Suspense
            fallback={
                <div className="flex min-h-screen items-center justify-center">
                    <p className="loading-state" role="status">Opening your workspace…</p>
                </div>
            }
        >
            <Routes>
                <Route path="*" element={<NotFoundPage />} />
                <Route path="/" element={<HomePage />} />
                <Route element={<GuestRoute />}>
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />
                </Route>

                <Route element={<ProtectedRoute />}>
                    <Route
                        path="/dashboard"
                        element={<DashboardPage />}
                    />

                    <Route
                        path="/workspaces/:workspaceId"
                        element={<WorkspacePage />}
                    />

                    <Route
                        path="/workspaces/:workspaceId/projects/:projectId"
                        element={<ProjectPage />}
                    />

                    <Route
                        path="/workspaces/:workspaceId/projects/:projectId/boards/:boardId"
                        element={<BoardPage />}
                    />
                </Route>
            </Routes>
        </Suspense></ErrorBoundary></AppShell>
    );
}

export default App;

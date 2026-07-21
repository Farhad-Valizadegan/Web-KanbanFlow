import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import ProtectedRoute from './components/auth/ProtectedRoute';

const BoardPage = lazy(() => import('./pages/BoardPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const HomePage = lazy(() => import('./pages/HomePage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const ProjectPage = lazy(() => import('./pages/ProjectPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const WorkspacePage = lazy(() => import('./pages/WorkspacePage'));

function App() {
    return (
        <Suspense
            fallback={
                <div className="flex min-h-screen items-center justify-center">
                    <p className="text-sm text-gray-600">Loading...</p>
                </div>
            }
        >
            <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />

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
        </Suspense>
    );
}

export default App;
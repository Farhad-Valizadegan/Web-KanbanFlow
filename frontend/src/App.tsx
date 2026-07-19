import { Route, Routes } from 'react-router-dom';
import ProtectedRoute from './components/auth/ProtectedRoute';
import BoardPage from './pages/BoardPage';
import DashboardPage from './pages/DashboardPage';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import ProjectPage from './pages/ProjectPage';
import RegisterPage from './pages/RegisterPage';
import WorkspacePage from './pages/WorkspacePage';

function App() {
    return (
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
    );
}

export default App;
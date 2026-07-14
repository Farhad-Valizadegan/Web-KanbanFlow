import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api/client';

interface HealthResponse {
    status: string;
    application: string;
}

async function getHealth(): Promise<HealthResponse> {
    const response = await apiClient.get<HealthResponse>('/api/health');

    return response.data;
}

function HomePage() {
    const healthQuery = useQuery({
        queryKey: ['health'],
        queryFn: getHealth,
    });

    return (
        <main className="min-h-screen bg-slate-950 px-6 py-16 text-slate-100">
            <section className="mx-auto max-w-5xl border border-slate-800 bg-slate-900 p-10">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-400">
                    KanbanFlow
                </p>

                <h1 className="mt-3 text-4xl font-bold">
                    Collaborative Project Management Platform
                </h1>

                <div className="mt-8 border border-slate-700 bg-slate-950 p-5">
                    <h2 className="font-semibold">Backend connection</h2>

                    {healthQuery.isPending && (
                        <p className="mt-2 text-slate-400">
                            Checking backend connection...
                        </p>
                    )}

                    {healthQuery.isError && (
                        <p className="mt-2 text-red-400">
                            Backend connection failed.
                        </p>
                    )}

                    {healthQuery.data && (
                        <p className="mt-2 text-green-400">
                            Connected to {healthQuery.data.application}
                        </p>
                    )}
                </div>
            </section>
        </main>
    );
}

export default HomePage;
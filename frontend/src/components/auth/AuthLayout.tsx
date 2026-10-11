import type { ReactNode } from 'react';
import BoardPreview from '../ui/BoardPreview';
import Icon from '../ui/Icon';

export default function AuthLayout({ children }: { children: ReactNode }) {
    return <main className="auth-layout">
        <aside className="auth-story" aria-label="About KanbanFlow">
            <div className="auth-story-heading"><span className="auth-story-mark"><Icon name="flow" size={30} /></span><h2>Find your focus.<br /><span>Keep your flow.</span></h2><p>A shared space for your projects, your people, and the next thing that matters.</p></div>
            <BoardPreview compact />
            <div className="auth-story-note"><Icon name="shield" size={18} /><span>Workspace roles keep access in the right hands.</span></div>
        </aside>
        <section className="auth-card">{children}</section>
    </main>;
}

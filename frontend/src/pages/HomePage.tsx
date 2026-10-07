import { Link } from 'react-router-dom';

export default function HomePage() {
 return <main className="hero">
  <div className="hero-grid">
   <section><p className="eyebrow">A clearer way to work together</p><h1>Less juggling.<br /><span>More progress.</span></h1>
    <p className="hero-description">Bring your projects, people, and priorities into one place. See what’s moving, what needs attention, and what’s next.</p>
    <div className="hero-actions"><Link className="primary-button" to="/register">Create your workspace <span aria-hidden="true">&nbsp;→</span></Link><Link className="secondary-button" to="/login">Sign in</Link></div><p className="hero-note">Your team’s work. One shared view.</p>
   </section>
   <section className="board-preview" aria-label="Example project board"><div className="preview-header">Website launch <span>Team workspace</span></div>
    <div className="preview-columns"><div className="preview-column"><h3>To do · 2</h3><div className="preview-card"><small>PLANNING</small>Map the customer journey</div><div className="preview-card">Write launch checklist</div></div><div className="preview-column"><h3>In progress · 1</h3><div className="preview-card"><small>DESIGN</small>Polish the homepage</div></div><div className="preview-column"><h3>Done · 1</h3><div className="preview-card done"><small>COMPLETE</small>Gather team feedback</div></div></div>
   </section>
  </div>
  <section className="feature-grid" aria-label="What you can do with KanbanFlow">
   <article><span className="feature-icon" aria-hidden="true">▦</span><h2>See the whole picture</h2><p>Organize work into projects and boards. Keep priorities visible as plans change.</p></article>
   <article><span className="feature-icon" aria-hidden="true">↔</span><h2>Keep work moving</h2><p>Move tasks through your workflow, limit work in progress, and focus on finishing.</p></article>
   <article><span className="feature-icon" aria-hidden="true">◎</span><h2>Stay connected</h2><p>Share updates, discuss tasks, and follow your team’s progress from one workspace.</p></article>
  </section>
 </main>;
}

import { Link } from 'react-router-dom';
import BoardPreview from '../components/ui/BoardPreview';
import Icon from '../components/ui/Icon';

export default function HomePage() {
 return <main className="hero">
  <div className="hero-grid">
   <section className="hero-copy"><h1>Less juggling.<br /><span>More progress.</span></h1>
    <p className="hero-description">Bring your projects, people, and priorities into one place. See what’s moving, what needs attention, and what’s next.</p>
    <div className="hero-actions"><Link className="primary-button" to="/register">Create your workspace <Icon name="arrow" size={18} /></Link><Link className="secondary-button" to="/login">Sign in</Link></div><p className="hero-note"><span className="status-dot" />Your team’s work. One shared view.</p>
   </section>
   <div className="hero-board"><BoardPreview /><div className="preview-float"><span className="preview-float-icon"><Icon name="check" size={18} /></span><div><strong>From planning to done</strong><span>One clear workflow.</span></div></div></div>
  </div>
  <section className="feature-strip" aria-label="What you can do with KanbanFlow">
   <div><span className="feature-icon"><Icon name="grid" size={24} /></span><h2>See the whole picture</h2><p>Organize work into projects and boards. Keep priorities visible as plans change.</p></div>
   <div><span className="feature-icon"><Icon name="flow" size={24} /></span><h2>Keep work moving</h2><p>Move tasks through your workflow, limit work in progress, and focus on finishing.</p></div>
   <div><span className="feature-icon"><Icon name="people" size={24} /></span><h2>Stay connected</h2><p>Share updates, discuss tasks, and follow your team’s progress from one workspace.</p></div>
  </section>
 </main>;
}

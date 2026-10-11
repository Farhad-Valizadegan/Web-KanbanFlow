import Icon from './Icon';

export default function BoardPreview({ compact = false }: { compact?: boolean }) {
    return <section className={`board-preview${compact ? ' board-preview-compact' : ''}`} aria-label="Illustrative project board">
        <div className="preview-header">
            <div className="preview-project"><span className="preview-project-icon"><Icon name="layers" /></span><div><strong>Website launch</strong><span>Example board · Team workspace</span></div></div>
            <div className="preview-avatars" aria-hidden="true"><span>JD</span><span>AK</span><span>ML</span></div>
        </div>
        <div className="preview-columns">
            <div className="preview-column" data-tone="blue"><h3><span className="status-dot" />To do <span className="preview-count">2</span></h3>
                <div className="preview-card"><small className="preview-tag">Planning</small><strong>Map the customer journey</strong><div className="preview-card-foot"><span>Medium priority</span><span className="mini-avatar">JD</span></div></div>
                <div className="preview-card"><strong>Write launch checklist</strong><div className="preview-card-foot"><span>Low priority</span><Icon name="check" size={14} /></div></div>
            </div>
            <div className="preview-column" data-tone="violet"><h3><span className="status-dot" />In progress <span className="preview-count">1</span></h3>
                <div className="preview-card"><small className="preview-tag">Design</small><strong>Polish the homepage</strong><p>Bring the final details together.</p><div className="preview-card-foot"><span>High priority</span><span className="mini-avatar">AK</span></div></div>
            </div>
            <div className="preview-column" data-tone="mint"><h3><span className="status-dot" />Done <span className="preview-count">1</span></h3>
                <div className="preview-card done"><small className="preview-tag"><Icon name="check" size={12} /> Complete</small><strong>Gather team feedback</strong><div className="preview-card-foot"><span>Completed</span><span className="mini-avatar">ML</span></div></div>
            </div>
        </div>
        <div className="preview-footer"><span><Icon name="flow" size={15} /> Every task has a place.</span><span>Illustrative content</span></div>
    </section>;
}

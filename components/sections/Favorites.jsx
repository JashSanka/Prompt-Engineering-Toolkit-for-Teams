'use client';
import { useApp } from '@/lib/store';

export default function Favorites() {
  const { prompts, toggleFavorite, setActiveSection, setCurrentPromptId } = useApp();
  const favorites = prompts.filter(p => p.isFavorite);

  const handleOpenPrompt = (id) => {
    setCurrentPromptId(id);
    setActiveSection('prompts');
  };

  return (
    <div className="animate-fade-in flex flex-col gap-6">
      <div className="section-header">
        <div>
          <h2 className="section-title">Starred Favorites</h2>
          <p className="section-subtitle">Quick access to your most important prompts.</p>
        </div>
      </div>

      {favorites.length === 0 ? (
        <div className="empty-state card mt-6">
          <div className="empty-state-icon text-accent-orange">⭐</div>
          <div className="empty-state-title">No favorites yet</div>
          <div className="empty-state-desc">Star your most used prompts from the dashboard or editor to access them quickly here.</div>
          <button className="btn btn-secondary mt-2" onClick={() => setActiveSection('dashboard')}>Back to Dashboard</button>
        </div>
      ) : (
        <div className="grid-3">
          {favorites.map(prompt => (
            <div key={prompt.prompt_id} className="card card-hover flex flex-col">
              <div className="flex justify-between items-start mb-4">
                <h3 className="font-bold text-primary truncate" style={{ maxWidth: '85%' }}>{prompt.title}</h3>
                <button 
                  className="btn-icon" 
                  onClick={() => toggleFavorite(prompt.prompt_id)}
                  title="Remove from favorites"
                >
                  ⭐
                </button>
              </div>
              
              <div className="flex gap-2 flex-wrap mb-6">
                {prompt.tags.map(t => (
                  <span key={t} className="badge badge-gray">{t}</span>
                ))}
              </div>
              
              <div className="mt-auto border-t border-border pt-4 flex justify-between items-center">
                <span className="text-xs font-semibold text-secondary">
                  v{prompt.versions.length} • {prompt.versions.length > 0 ? new Date(prompt.versions[prompt.versions.length-1].created_at).toLocaleDateString() : 'N/A'}
                </span>
                <button 
                  className="btn btn-primary btn-sm"
                  onClick={() => handleOpenPrompt(prompt.prompt_id)}
                >
                  Open Editor →
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

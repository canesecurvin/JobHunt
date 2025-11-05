
import React, { useState } from 'react';
import { Spinner } from './Spinner';
import { UnprocessedCompanyJobs } from '../types';

interface RefineSearchModalProps {
    companyName: string;
    onClose: () => void;
    onSubmit: (companyName: string, feedback: string, sources: string[]) => Promise<UnprocessedCompanyJobs | null>;
}

const PREPOPULATED_SOURCES = [
    'Company careers page',
    'LinkedIn',
    'Greenhouse',
    'Lever',
];

export const RefineSearchModal: React.FC<RefineSearchModalProps> = ({ companyName, onClose, onSubmit }) => {
    const [feedback, setFeedback] = useState('');
    const [sources, setSources] = useState<string[]>(['Company careers page']);
    const [customSource, setCustomSource] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSourceToggle = (source: string) => {
        setSources(prev => 
            prev.includes(source) ? prev.filter(s => s !== source) : [...prev, source]
        );
    };

    const handleAddCustomSource = () => {
        if (customSource.trim() && !sources.includes(customSource.trim())) {
            setSources(prev => [...prev, customSource.trim()]);
            setCustomSource('');
        }
    };

    const handleSubmit = async () => {
        if (!feedback.trim()) {
            setError('Please provide some feedback on the previous results.');
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            await onSubmit(companyName, feedback, sources);
            onClose();
        } catch (err: any) {
            setError(err.message || 'An unexpected error occurred.');
        } finally {
            setIsLoading(false);
        }
    };


    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-surface rounded-2xl shadow-xl w-full max-w-2xl" onClick={(e) => e.stopPropagation()}>
                <header className="p-4 border-b border-muted flex justify-between items-center">
                    <h2 className="text-xl font-bold text-text">Refine Search for: <span className="text-primary">{companyName}</span></h2>
                    <button onClick={onClose} className="text-text-muted hover:text-text text-3xl leading-none">&times;</button>
                </header>
                <div className="p-6 space-y-6">
                    <div>
                        <label htmlFor="feedback" className="block text-sm font-medium text-text-muted mb-2">
                            What didn't you like about the previous job results?
                        </label>
                        <textarea
                            id="feedback"
                            rows={4}
                            value={feedback}
                            onChange={(e) => setFeedback(e.target.value)}
                            className="block w-full px-3 py-2 bg-background border border-muted rounded-md shadow-sm placeholder-gray-500 focus:outline-none focus:ring-primary focus:border-primary"
                            placeholder="e.g., The roles were too junior, not focused on backend, etc."
                        />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-text-muted mb-2">
                           Prioritize search on these sites (optional)
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {PREPOPULATED_SOURCES.map(source => (
                                <button
                                    key={source}
                                    onClick={() => handleSourceToggle(source)}
                                    className={`px-3 py-1.5 text-sm rounded-full transition-colors ${sources.includes(source) ? 'bg-primary text-white' : 'bg-muted text-text-muted hover:bg-opacity-70'}`}
                                >
                                    {source}
                                </button>
                            ))}
                        </div>
                        <div className="mt-3 flex gap-2">
                            <input
                                type="text"
                                value={customSource}
                                onChange={(e) => setCustomSource(e.target.value)}
                                placeholder="Add another website (e.g., Workday)"
                                className="flex-grow px-3 py-2 bg-background border border-muted rounded-md shadow-sm placeholder-gray-500 focus:outline-none focus:ring-primary focus:border-primary text-sm"
                            />
                            <button onClick={handleAddCustomSource} className="px-4 py-2 bg-muted text-text rounded-md hover:bg-opacity-80 text-sm">Add</button>
                        </div>
                    </div>
                    {error && <p className="text-sm text-red-500">{error}</p>}
                </div>
                 <footer className="p-4 border-t border-muted flex justify-end gap-4">
                    <button onClick={onClose} className="px-4 py-2 bg-muted text-text rounded-md hover:bg-opacity-80 text-sm">Cancel</button>
                    <button 
                        onClick={handleSubmit}
                        disabled={isLoading}
                        className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark disabled:bg-opacity-50 flex items-center gap-2"
                    >
                        {isLoading && <Spinner />}
                        {isLoading ? 'Refining...' : 'Refine Search'}
                    </button>
                </footer>
            </div>
        </div>
    );
};

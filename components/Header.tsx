
import React from 'react';

type Page = 'finder' | 'board';

interface HeaderProps {
    onLogout: () => void;
    page: Page;
    setPage: (page: Page) => void;
}

export const Header: React.FC<HeaderProps> = ({ onLogout, page, setPage }) => {
    
    const navLinkClasses = (pageName: Page) => 
        `px-3 py-2 rounded-md text-sm font-medium cursor-pointer transition-colors ${
            page === pageName 
            ? 'bg-primary text-white' 
            : 'text-text-muted hover:bg-muted hover:text-text'
        }`;

    return (
        <header className="bg-surface shadow-md">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <div className="flex items-center gap-8">
                        <h1 className="text-2xl font-bold text-text">AI Job Hunter</h1>
                        <nav className="flex items-baseline space-x-4">
                           <button onClick={() => setPage('finder')} className={navLinkClasses('finder')}>
                                Job Finder
                           </button>
                           <button onClick={() => setPage('board')} className={navLinkClasses('board')}>
                                Job Board
                           </button>
                        </nav>
                    </div>
                    <div>
                        <button
                            onClick={onLogout}
                            className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark transition-colors text-sm font-medium"
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </div>
        </header>
    );
}
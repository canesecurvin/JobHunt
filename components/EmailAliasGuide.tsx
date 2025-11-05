
import React from 'react';

interface EmailAliasGuideProps {
    userEmail: string;
    onDismiss: () => void;
}

export const EmailAliasGuide: React.FC<EmailAliasGuideProps> = ({ userEmail, onDismiss }) => {
    const exampleAlias = `${userEmail.split('@')[0]}+companyname@${userEmail.split('@')[1]}`;
    return (
        <div className="bg-surface p-4 rounded-lg border border-primary mb-8 relative">
            <button 
                onClick={onDismiss} 
                className="absolute top-2 right-3 text-text-muted hover:text-text text-2xl leading-none"
                aria-label="Dismiss"
            >
                &times;
            </button>
            <h3 className="text-lg font-bold text-primary">Pro Tip: Organize Your Job Search</h3>
            <p className="text-sm text-text-muted mt-2">
                Use the unique email alias provided for each company when you apply. All emails for that application will go to your main inbox, but will be tagged with this alias, making them easy to find.
            </p>
            <p className="text-sm text-text-muted mt-2">
                For example, to find all emails for one company, search your inbox for: 
                <code className="bg-background text-primary p-1 rounded-md text-xs ml-1 font-mono">to:{exampleAlias}</code>
            </p>
        </div>
    );
};

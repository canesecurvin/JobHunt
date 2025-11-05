import React from 'react';

interface FormattedResumeProps {
    text: string;
}

export const FormattedResume: React.FC<FormattedResumeProps> = ({ text }) => {
    // We use a div with pre-wrap to respect newlines and spaces from the original text,
    // making it look very similar to how it would in a plain text editor or textarea.
    return (
        <div className="whitespace-pre-wrap">
            {text}
        </div>
    );
};
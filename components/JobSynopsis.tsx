
import React from 'react';
import { CompanyJobs } from '../types';

interface JobSynopsisProps {
    jobsData: CompanyJobs[];
    onNavigateToBoard: () => void;
}

export const JobSynopsis: React.FC<JobSynopsisProps> = ({ jobsData, onNavigateToBoard }) => {
    const totalJobs = jobsData.reduce((acc, company) => acc + company.jobs.length, 0);
    const totalCompanies = jobsData.length;

    return (
        <div className="flex flex-col h-full p-6 bg-surface rounded-2xl shadow-lg">
            {totalJobs > 0 ? (
                <div className="text-center flex-grow flex flex-col justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-green-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h3 className="text-2xl font-bold text-text">Success!</h3>
                    <p className="mt-2 text-lg text-text-muted">
                        We found <span className="font-bold text-primary">{totalJobs}</span> potential job matches across <span className="font-bold text-primary">{totalCompanies}</span> companies.
                    </p>
                    <div className="mt-6">
                        <h4 className="font-semibold text-text mb-2">Companies with Matches:</h4>
                        <ul className="text-text-muted list-inside">
                            {jobsData.map(company => (
                                <li key={company.companyName}>
                                    {company.companyName} ({company.jobs.length} {company.jobs.length > 1 ? 'jobs' : 'job'})
                                </li>
                            ))}
                        </ul>
                    </div>
                    <button
                        onClick={onNavigateToBoard}
                        className="mt-8 w-full max-w-xs mx-auto flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary focus:ring-offset-background transition-colors"
                    >
                        View Full Job Board
                    </button>
                </div>
            ) : (
                <div className="text-center flex-grow flex flex-col justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-muted mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h3 className="text-2xl font-bold text-text">No Matches Found</h3>
                    <p className="mt-2 text-text-muted">
                        We couldn't find any suitable jobs based on your criteria. Try adjusting the companies or using a different resume.
                    </p>
                </div>
            )}
        </div>
    );
};
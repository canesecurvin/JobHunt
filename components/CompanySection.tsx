
import React, { useState } from 'react';
import { JobPosting, ApplicationStatus } from '../types';
import { JobCard } from './JobCard';
import { RefreshIcon } from './icons/RefreshIcon';
import { InfoIcon } from './icons/InfoIcon';
import { CopyIcon } from './icons/CopyIcon';
import { CheckIcon } from './icons/CheckIcon';

interface CompanySectionProps {
  companyName: string;
  jobs: JobPosting[];
  analysisSummary?: string;
  aliasIdentifier: string;
  userEmail: string;
  onStatusChange: (jobId: string, newStatus: ApplicationStatus) => void;
  onTailorRequest: (job: JobPosting) => void;
  onRefineRequest: (companyName: string) => void;
}

export const CompanySection: React.FC<CompanySectionProps> = ({
  companyName,
  jobs,
  analysisSummary,
  aliasIdentifier,
  userEmail,
  onStatusChange,
  onTailorRequest,
  onRefineRequest
}) => {
  const [isRationaleVisible, setIsRationaleVisible] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const aliasEmail = `${userEmail.split('@')[0]}+${aliasIdentifier}@${userEmail.split('@')[1]}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(aliasEmail).then(() => {
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    }).catch(err => {
        console.error('Failed to copy text: ', err);
    });
  };

  return (
    <div className="p-6 bg-surface rounded-2xl shadow-lg">
      <div className="border-b border-muted pb-4">
        <div className="flex justify-between items-center ">
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold text-text">
              {companyName}
            </h2>
            {analysisSummary && (
              <div className="relative">
                <button
                  onClick={() => setIsRationaleVisible(!isRationaleVisible)}
                  onBlur={() => setIsRationaleVisible(false)}
                  className="text-text-muted hover:text-primary"
                  title="Show AI Matching Rationale"
                >
                  <InfoIcon className="w-5 h-5" />
                </button>
                {isRationaleVisible && (
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 p-3 bg-background border border-muted rounded-lg shadow-xl z-10">
                    <h4 className="font-semibold text-sm text-text mb-1">AI Matching Rationale</h4>
                    <p className="text-xs text-text-muted">{analysisSummary}</p>
                  </div>
                )}
              </div>
            )}
          </div>
          <button 
            onClick={() => onRefineRequest(companyName)}
            className="flex items-center gap-2 px-3 py-1.5 bg-muted text-text rounded-md hover:bg-primary-dark transition-colors text-sm font-medium"
            title={`Refine job search for ${companyName}`}
          >
            <RefreshIcon className="w-4 h-4" />
            <span>Refine Search</span>
          </button>
        </div>
        <div className="mt-3 p-3 bg-background rounded-lg border border-muted flex items-center justify-between flex-wrap gap-2">
            <div>
                <span className="text-xs text-text-muted font-medium">Application Email Alias</span>
                <p className="font-mono text-sm text-primary break-all">{aliasEmail}</p>
            </div>
            <button 
              onClick={handleCopy}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${isCopied ? 'bg-green-500 text-white' : 'bg-muted text-text hover:bg-opacity-70'}`}
            >
              {isCopied ? <CheckIcon className="w-4 h-4" /> : <CopyIcon className="w-4 h-4" />}
              <span>{isCopied ? 'Copied!' : 'Copy'}</span>
            </button>
        </div>
      </div>
      <div className="space-y-4 pt-4">
        {jobs.length > 0 ? jobs.map((job) => (
          <JobCard key={job.id} job={job} onStatusChange={onStatusChange} onTailorRequest={onTailorRequest} />
        )) : (
          <p className="text-text-muted text-sm text-center py-4">No matching jobs found after refinement.</p>
        )}
      </div>
    </div>
  );
};
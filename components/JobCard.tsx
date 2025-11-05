
import React, { useState } from 'react';
import { JobPosting, ApplicationStatus } from '../types';
import { ChevronDownIcon } from './icons/ChevronDownIcon';
import { ExternalLinkIcon } from './icons/ExternalLinkIcon';
import { ClockIcon } from './icons/ClockIcon';
import { WandIcon } from './icons/WandIcon';
import { BriefcaseIcon } from './icons/BriefcaseIcon';
import { InfoIcon } from './icons/InfoIcon';
import { MapPinIcon } from './icons/MapPinIcon';
import { GlobeIcon } from './icons/GlobeIcon';


interface JobCardProps {
  job: JobPosting;
  onStatusChange: (jobId: string, newStatus: ApplicationStatus) => void;
  onTailorRequest: (job: JobPosting) => void;
}

const statusColors: Record<ApplicationStatus, string> = {
  [ApplicationStatus.NotApplied]: 'bg-gray-500',
  [ApplicationStatus.Applied]: 'bg-blue-500',
  [ApplicationStatus.Interviewing]: 'bg-yellow-500',
  [ApplicationStatus.Offer]: 'bg-green-500',
  [ApplicationStatus.Rejected]: 'bg-red-500',
};

const RequirementItem: React.FC<{req: {requirement: string, justificationSnippet: string}}> = ({ req }) => {
    const [isJustificationVisible, setIsJustificationVisible] = useState(false);

    return (
        <li className="relative list-none flex items-center gap-2 px-2.5 py-1 bg-muted text-xs font-medium text-text-muted rounded-full">
            <span>{req.requirement}</span>
            <button
                onMouseEnter={() => setIsJustificationVisible(true)}
                onMouseLeave={() => setIsJustificationVisible(false)}
                className="text-text-muted hover:text-primary focus:outline-none"
                title="Show justification"
            >
                <InfoIcon className="w-3.5 h-3.5" />
            </button>
            {isJustificationVisible && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-background border border-muted rounded-lg shadow-xl z-10">
                    <h4 className="font-semibold text-xs text-text mb-1">Source Snippet:</h4>
                    <p className="text-xs text-text-muted italic">"{req.justificationSnippet}"</p>
                </div>
            )}
        </li>
    );
};


export const JobCard: React.FC<JobCardProps> = ({ job, onStatusChange, onTailorRequest }) => {
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onStatusChange(job.id, e.target.value as ApplicationStatus);
  };

  return (
    <div className="p-4 bg-background rounded-lg shadow-md transition-all duration-300">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex-grow">
          <h3 className="text-lg font-semibold text-text">{job.jobTitle}</h3>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-sm text-text-muted">
            {job.postedDate && (
                <div className="flex items-center gap-1.5" title="Posted Date">
                    <ClockIcon className="w-4 h-4" />
                    <span>{job.postedDate}</span>
                </div>
            )}
            {job.requiredYearsOfExperience && (
                <div className="flex items-center gap-1.5" title="Required Experience">
                    <BriefcaseIcon className="w-4 h-4" />
                    <span>{job.requiredYearsOfExperience}</span>
                </div>
            )}
             {job.location && (
                <div className="flex items-center gap-1.5" title="Location">
                    <MapPinIcon className="w-4 h-4" />
                    <span>{job.location}</span>
                </div>
            )}
             {job.sponsorshipOffered && job.sponsorshipOffered !== 'Not Mentioned' && (
                <div className="flex items-center gap-1.5" title="Sponsorship">
                    <GlobeIcon className="w-4 h-4" />
                    <span>Sponsorship: {job.sponsorshipOffered}</span>
                </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto flex-shrink-0">
          <div className="relative w-full sm:w-40">
            <select
              value={job.status}
              onChange={handleStatusChange}
              className={`w-full appearance-none pl-3 pr-8 py-1.5 text-sm text-white rounded-md focus:outline-none focus:ring-2 focus:ring-primary ${statusColors[job.status]}`}
            >
              {Object.values(ApplicationStatus).map(status => (
                <option key={status} value={status} className="bg-surface text-text">
                  {status}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-white">
                <ChevronDownIcon className="w-4 h-4" />
            </div>
          </div>
          <a
            href={job.applicationLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 px-3 py-2 bg-primary text-white rounded-md hover:bg-primary-dark transition-colors text-sm font-medium"
            title="Apply Now"
          >
            <ExternalLinkIcon className="w-4 h-4" />
          </a>
        </div>
      </div>
      <div className="mt-4">
        <div className="flex items-center justify-between">
            <button
              onClick={() => setIsDetailsOpen(!isDetailsOpen)}
              className="text-sm text-primary hover:underline flex items-center gap-1"
            >
              {isDetailsOpen ? 'Hide Details' : 'Show Details'}
              <ChevronDownIcon className={`w-4 h-4 transition-transform ${isDetailsOpen ? 'rotate-180' : ''}`} />
            </button>
            <button
              onClick={() => onTailorRequest(job)}
              className="flex items-center gap-1.5 px-3 py-2 bg-muted text-text rounded-md hover:bg-primary-dark transition-colors text-sm font-medium"
              >
              <WandIcon className="w-4 h-4" />
              <span>Tailor Resume</span>
            </button>
        </div>
        {isDetailsOpen && (
          <div className="mt-3 pt-3 border-t border-muted space-y-4">
            <div>
                <h4 className="text-sm font-semibold text-text mb-1">Job Details</h4>
                <p className="text-sm text-text-muted whitespace-pre-wrap">{job.jobDetails}</p>
            </div>
            {job.keyRequirements && job.keyRequirements.length > 0 && (
                <div>
                    <h4 className="text-sm font-semibold text-text mb-2">Key Requirements Matched</h4>
                    <ul className="flex flex-wrap gap-2">
                        {job.keyRequirements.map((req, index) => (
                           <RequirementItem key={index} req={req} />
                        ))}
                    </ul>
                </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
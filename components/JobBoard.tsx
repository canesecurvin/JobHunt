
import React, { useState } from 'react';
import { CompanyJobs, ApplicationStatus, JobPosting, UnprocessedCompanyJobs } from '../types';
import { CompanySection } from './CompanySection';
import { RefineSearchModal } from './RefineSearchModal';
import { EmailAliasGuide } from './EmailAliasGuide';

interface JobBoardProps {
  jobsData: CompanyJobs[];
  onStatusChange: (jobId: string, newStatus: ApplicationStatus) => void;
  onTailorRequest: (job: JobPosting) => void;
  onRefineSearch: (companyName: string, feedback: string, sources: string[]) => Promise<UnprocessedCompanyJobs | null>;
}

export const JobBoard: React.FC<JobBoardProps> = ({ jobsData, onStatusChange, onTailorRequest, onRefineSearch }) => {
  const [isRefineModalOpen, setIsRefineModalOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null);
  const [showEmailGuide, setShowEmailGuide] = useState(true);

  const userEmail = "canesecurvin@gmail.com";

  const handleOpenRefineModal = (companyName: string) => {
    setSelectedCompany(companyName);
    setIsRefineModalOpen(true);
  };

  const handleCloseRefineModal = () => {
    setSelectedCompany(null);
    setIsRefineModalOpen(false);
  };

  if (jobsData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 bg-surface rounded-2xl shadow-lg text-center min-h-[60vh]">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-muted mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <h3 className="text-xl font-semibold text-text">Your Curated Job Board is Empty</h3>
        <p className="mt-2 text-text-muted">
          Go to the "Job Finder" page to upload your resume and discover personalized job matches.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-8">
        <h2 className="text-3xl font-bold text-text mb-6">Curated Job Board</h2>
        {showEmailGuide && <EmailAliasGuide userEmail={userEmail} onDismiss={() => setShowEmailGuide(false)} />}
        {jobsData.map((companyData) => (
          <CompanySection
            key={companyData.companyName}
            companyName={companyData.companyName}
            jobs={companyData.jobs}
            analysisSummary={companyData.analysisSummary}
            aliasIdentifier={companyData.aliasIdentifier}
            userEmail={userEmail}
            onStatusChange={onStatusChange}
            onTailorRequest={onTailorRequest}
            onRefineRequest={handleOpenRefineModal}
          />
        ))}
      </div>
      {isRefineModalOpen && selectedCompany && (
        <RefineSearchModal 
          companyName={selectedCompany}
          onClose={handleCloseRefineModal}
          onSubmit={onRefineSearch}
        />
      )}
    </>
  );
};
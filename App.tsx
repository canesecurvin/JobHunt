
import React, { useState, useCallback } from 'react';
import { LoginScreen } from './components/LoginScreen';
import { JobFinder } from './components/JobFinder';
import { JobBoard } from './components/JobBoard';
import { CompanyJobs, ApplicationStatus, JobPosting, UnprocessedCompanyJobs } from './types';
import { Header } from './components/Header';
import { TailorResumeModal } from './components/TailorResumeModal';
import { findJobs, rerunCompanySearch } from './services/geminiService';

type Page = 'finder' | 'board';

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [jobsData, setJobsData] = useState<CompanyJobs[]>([]);
  const [page, setPage] = useState<Page>('finder');
  
  const [showTailorModal, setShowTailorModal] = useState(false);
  const [selectedJob, setSelectedJob] = useState<JobPosting | null>(null);
  const [resumeFiles, setResumeFiles] = useState<File[]>([]);
  
  // State for search logic, lifted up from JobFinder
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchCompleted, setSearchCompleted] = useState(false);
  const [searchCache, setSearchCache] = useState<Record<string, { data: UnprocessedCompanyJobs[]; timestamp: number }>>({});

  const handleLoginSuccess = useCallback(() => {
    setIsLoggedIn(true);
  }, []);
  
  const handleLogout = useCallback(() => {
    setIsLoggedIn(false);
    setJobsData([]);
    setPage('finder');
    setResumeFiles([]);
    setSearchCompleted(false);
    setSearchError(null);
  }, []);

  const processJobs = (foundJobs: UnprocessedCompanyJobs[]): CompanyJobs[] => {
    return foundJobs.map(company => ({
      ...company,
      analysisSummary: company.analysisSummary || 'No analysis provided.',
      aliasIdentifier: company.aliasIdentifier || company.companyName.toLowerCase().replace(/[^a-z0-9]/gi, ''),
      jobs: company.jobs.map(job => ({
        ...job,
        id: job.applicationLink,
        status: ApplicationStatus.NotApplied,
        requiredYearsOfExperience: job.requiredYearsOfExperience || 'Not specified',
        keyRequirements: job.keyRequirements || [],
        location: job.location || 'Not specified',
        sponsorshipOffered: job.sponsorshipOffered || 'Not Mentioned',
      })),
    }));
  }

  const handleSearch = useCallback(async (
    resumes: File[], 
    companies: string[], 
    sources: string[],
    location: string,
    willingToRelocate: boolean,
    needsSponsorship: boolean
  ) => {
    setIsSearching(true);
    setSearchError(null);
    setSearchCompleted(false);
    setResumeFiles(resumes);
    
    const keyParts = [
        ...resumes.map(f => `${f.name}-${f.size}-${f.lastModified}`),
        ...companies.map(c => c.toLowerCase().trim()),
        ...sources.map(s => s.toLowerCase().trim()),
        location.toLowerCase().trim(),
        `relocate-${willingToRelocate}`,
        `sponsorship-${needsSponsorship}`,
    ];
    const cacheKey = keyParts.sort().join('|');
    const cached = searchCache[cacheKey];
    const now = Date.now();
    const twelveHours = 12 * 60 * 60 * 1000;

    try {
        let foundJobs: UnprocessedCompanyJobs[];
        if (cached && (now - cached.timestamp < twelveHours)) {
            console.log("Returning cached search results.");
            foundJobs = cached.data;
        } else {
            console.log("Fetching new search results from API.");
            foundJobs = await findJobs(resumes, companies, sources, location, willingToRelocate, needsSponsorship);
            setSearchCache(prev => ({ ...prev, [cacheKey]: { data: foundJobs, timestamp: now } }));
        }
        setJobsData(processJobs(foundJobs));
        setSearchCompleted(true);
    } catch (err: any) {
        setSearchError(err.message || 'An unexpected error occurred during the search.');
        setJobsData([]);
    } finally {
        setIsSearching(false);
    }
  }, [searchCache]);


  const handleRefineSearch = useCallback(async (
    companyName: string, 
    feedback: string, 
    sources: string[]
  ): Promise<UnprocessedCompanyJobs | null> => {
      if(resumeFiles.length === 0) {
        throw new Error("No resume available to refine the search.");
      }
      const refinedResult = await rerunCompanySearch(companyName, resumeFiles, feedback, sources);
      
      if(refinedResult) {
        const processedNewJobs = processJobs([refinedResult]);
        
        setJobsData(currentJobs => {
          const companyExists = currentJobs.some(c => c.companyName === companyName);
          if (companyExists) {
            return currentJobs.map(company => 
              company.companyName === companyName 
              ? processedNewJobs[0]
              : company
            );
          } else {
             return [...currentJobs, processedNewJobs[0]];
          }
        });
        return refinedResult;
      }
      return null;

  }, [resumeFiles]);


  const handleStatusChange = useCallback((jobId: string, newStatus: ApplicationStatus) => {
    setJobsData(prevData =>
      prevData.map(company => ({
        ...company,
        jobs: company.jobs.map(job =>
          job.id === jobId ? { ...job, status: newStatus } : job
        ),
      }))
    );
  }, []);

  const handleTailorRequest = useCallback((job: JobPosting) => {
    setSelectedJob(job);
    setShowTailorModal(true);
  }, []);

  if (!isLoggedIn) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-background font-sans">
      <Header onLogout={handleLogout} page={page} setPage={setPage} />
      <main className="p-4 md:p-8 max-w-7xl mx-auto">
        {page === 'finder' && (
           <JobFinder 
             onSearch={handleSearch}
             isSearching={isSearching}
             searchError={searchError}
             searchCompleted={searchCompleted}
             jobsData={jobsData}
             onNavigateToBoard={() => setPage('board')}
           />
        )}
        {page === 'board' && (
           <JobBoard 
             jobsData={jobsData} 
             onStatusChange={handleStatusChange} 
             onTailorRequest={handleTailorRequest}
             onRefineSearch={handleRefineSearch}
           />
        )}
      </main>
      {showTailorModal && selectedJob && (
        <TailorResumeModal 
          job={selectedJob}
          resumes={resumeFiles}
          onClose={() => setShowTailorModal(false)}
        />
      )}
    </div>
  );
};

export default App;
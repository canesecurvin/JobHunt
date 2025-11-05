
import React, { useState, ChangeEvent, FormEvent } from 'react';
import { CompanyJobs } from '../types';
import { Spinner } from './Spinner';
import { UploadIcon } from './icons/UploadIcon';
import { BuildingIcon } from './icons/BuildingIcon';
import { JobSynopsis } from './JobSynopsis';
import { MapPinIcon } from './icons/MapPinIcon';

interface JobFinderProps {
  onSearch: (
    resumes: File[], 
    companies: string[], 
    sources: string[],
    location: string,
    willingToRelocate: boolean,
    needsSponsorship: boolean
  ) => void;
  isSearching: boolean;
  searchError: string | null;
  searchCompleted: boolean;
  jobsData: CompanyJobs[];
  onNavigateToBoard: () => void;
}

const ToggleSwitch: React.FC<{
  label: string;
  enabled: boolean;
  onChange: (enabled: boolean) => void;
}> = ({ label, enabled, onChange }) => (
  <label className="flex items-center justify-between cursor-pointer">
    <span className="text-sm font-medium text-text-muted">{label}</span>
    <div className="relative">
      <input type="checkbox" className="sr-only" checked={enabled} onChange={(e) => onChange(e.target.checked)} />
      <div className={`block w-14 h-8 rounded-full transition ${enabled ? 'bg-primary' : 'bg-muted'}`}></div>
      <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${enabled ? 'translate-x-6' : ''}`}></div>
    </div>
  </label>
);


export const JobFinder: React.FC<JobFinderProps> = ({ 
  onSearch, 
  isSearching, 
  searchError, 
  searchCompleted,
  jobsData, 
  onNavigateToBoard 
}) => {
  const [resumes, setResumes] = useState<File[]>([]);
  const [companies, setCompanies] = useState('');
  const [sources, setSources] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  
  const [location, setLocation] = useState('');
  const [willingToRelocate, setWillingToRelocate] = useState(false);
  const [needsSponsorship, setNeedsSponsorship] = useState(false);
  const [locationStatus, setLocationStatus] = useState('');

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setResumes(Array.from(e.target.files));
    }
  };

  const handleUseLocation = () => {
    if (navigator.geolocation) {
      setLocationStatus('Fetching location...');
      setFormError(null);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          // Note: This gives coordinates. The AI is prompted to handle this.
          // For a better UX with city/country name, a reverse geocoding API would be needed.
          setLocation(`${latitude}, ${longitude}`);
          setLocationStatus('Location coordinates captured successfully.');
        },
        (error) => {
          setFormError(`Geolocation failed: ${error.message}. Please enter manually.`);
          setLocationStatus('');
        }
      );
    } else {
      setFormError("Geolocation is not supported by this browser.");
      setLocationStatus('');
    }
  };


  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (resumes.length === 0 || companies.trim() === '') {
      setFormError('Please upload at least one resume and enter company names.');
      return;
    }
    setFormError(null);
    const companyList = companies.split('\n').map(c => c.trim()).filter(Boolean);
    const sourceList = sources.split('\n').map(s => s.trim()).filter(Boolean);
    onSearch(resumes, companyList, sourceList, location, willingToRelocate, needsSponsorship);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      <div className="lg:col-span-5">
        <div className="p-6 bg-surface rounded-2xl shadow-lg sticky top-8">
          <h2 className="text-2xl font-bold mb-4 text-text">Find Jobs</h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Resume Upload */}
            <div>
              <label className="block text-sm font-medium text-text-muted mb-2">
                Upload Resume(s)
              </label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-muted border-dashed rounded-md">
                <div className="space-y-1 text-center">
                  <UploadIcon className="mx-auto h-12 w-12 text-text-muted" />
                  <div className="flex text-sm text-gray-400">
                    <label
                      htmlFor="file-upload"
                      className="relative cursor-pointer bg-surface rounded-md font-medium text-primary hover:text-primary-light focus-within:outline-none"
                    >
                      <span>Upload files</span>
                      <input
                        id="file-upload"
                        name="file-upload"
                        type="file"
                        multiple
                        onChange={handleFileChange}
                        className="sr-only"
                        accept=".pdf,.doc,.docx,.txt"
                      />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-gray-500">PDF, DOC, DOCX, TXT</p>
                </div>
              </div>
              {resumes.length > 0 && (
                <div className="mt-3 text-sm text-text-muted">
                  {resumes.map(file => (
                    <p key={file.name}>Selected: {file.name}</p>
                  ))}
                </div>
              )}
            </div>
            
            {/* Preferences Section */}
            <div className="space-y-4 p-4 bg-background rounded-lg border border-muted">
              <h3 className="font-semibold text-text">Your Preferences</h3>
              <div>
                <label htmlFor="location" className="block text-sm font-medium text-text-muted mb-2">Current Location (City, State, Country)</label>
                <div className="flex gap-2">
                  <input
                    id="location"
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="flex-grow px-3 py-2 bg-muted border border-muted rounded-md shadow-sm placeholder-gray-500 focus:outline-none focus:ring-primary focus:border-primary text-sm"
                    placeholder="e.g., Baton Rouge, Louisiana, USA"
                  />
                  <button type="button" onClick={handleUseLocation} className="p-2 bg-primary text-white rounded-md hover:bg-primary-dark" title="Use my current location">
                    <MapPinIcon className="w-5 h-5"/>
                  </button>
                </div>
                {locationStatus && <p className="text-xs text-primary mt-1">{locationStatus}</p>}
              </div>
              <ToggleSwitch label="Open to Relocation" enabled={willingToRelocate} onChange={setWillingToRelocate} />
              <ToggleSwitch label="Requires Visa Sponsorship" enabled={needsSponsorship} onChange={setNeedsSponsorship} />
            </div>

            {/* Companies */}
            <div>
              <label htmlFor="companies" className="block text-sm font-medium text-text-muted mb-2">
                Target Companies
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <BuildingIcon className="h-5 w-5 text-gray-400" />
                </div>
                <textarea
                  id="companies"
                  rows={4}
                  value={companies}
                  onChange={(e) => setCompanies(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 bg-background border border-muted rounded-md shadow-sm placeholder-gray-500 focus:outline-none focus:ring-primary focus:border-primary"
                  placeholder="Google&#10;Microsoft&#10;Netflix..."
                />
              </div>
            </div>

            {/* Sources */}
             <div>
              <label htmlFor="sources" className="block text-sm font-medium text-text-muted mb-2">
                Prioritized Search Sources (Optional)
              </label>
              <textarea
                id="sources"
                rows={3}
                value={sources}
                onChange={(e) => setSources(e.target.value)}
                className="block w-full px-3 py-2 bg-background border border-muted rounded-md shadow-sm placeholder-gray-500 focus:outline-none focus:ring-primary focus:border-primary"
                placeholder="careers.google.com&#10;LinkedIn&#10;Greenhouse..."
              />
            </div>

            {formError && <p className="text-sm text-red-500">{formError}</p>}
            {searchError && <p className="text-sm text-red-500">{searchError}</p>}

            <button
              type="submit"
              disabled={isSearching}
              className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary focus:ring-offset-background disabled:bg-muted disabled:cursor-not-allowed transition-colors"
            >
              {isSearching ? (
                <>
                  <Spinner />
                  Searching...
                </>
              ) : (
                'Find Matching Jobs'
              )}
            </button>
          </form>
        </div>
      </div>
      <div className="lg:col-span-7">
        {isSearching ? (
           <div className="flex flex-col items-center justify-center h-full p-6 bg-surface rounded-2xl shadow-lg text-center">
             <Spinner />
             <p className="mt-4 text-text-muted">Searching for the best opportunities...</p>
           </div>
        ) : searchCompleted ? (
          <JobSynopsis jobsData={jobsData} onNavigateToBoard={onNavigateToBoard} />
        ) : (
          <div className="flex flex-col items-center justify-center h-full p-6 bg-surface rounded-2xl shadow-lg text-center">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-muted mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
             </svg>
             <h3 className="text-xl font-semibold text-text">Job Search Results</h3>
             <p className="mt-2 text-text-muted">
               Your personalized job matches will appear here once you start a search.
             </p>
           </div>
        )}
      </div>
    </div>
  );
};
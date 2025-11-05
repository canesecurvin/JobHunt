
export enum ApplicationStatus {
  NotApplied = 'Not Applied',
  Applied = 'Applied',
  Interviewing = 'Interviewing',
  Offer = 'Offer',
  Rejected = 'Rejected',
}

export interface KeyRequirement {
  requirement: string;
  justificationSnippet: string;
}

export interface JobPosting {
  id: string;
  jobTitle: string;
  applicationLink: string;
  jobDetails: string;
  status: ApplicationStatus;
  postedDate?: string;
  requiredYearsOfExperience: string;
  keyRequirements: KeyRequirement[];
  location: string;
  sponsorshipOffered: string;
}

export interface UnprocessedJobPosting {
  jobTitle: string;
  applicationLink: string;
  jobDetails: string;
  postedDate?: string;
  requiredYearsOfExperience: string;
  keyRequirements: KeyRequirement[];
  location: string;
  sponsorshipOffered: string;
}

export interface CompanyJobs {
  companyName: string;
  jobs: JobPosting[];
  analysisSummary?: string;
  aliasIdentifier: string;
}

export interface UnprocessedCompanyJobs {
  companyName: string;
  jobs: UnprocessedJobPosting[];
  analysisSummary?: string;
  aliasIdentifier: string;
}

export interface ScoringBreakdown {
  category: string;
  score: number;
  maxScore: number;
  weight: number;
}

export interface TailorResult {
  tailoredResume: string;
  matchScore: number;
  explanation: string;
  atsScore: number;
  atsExplanation:string;
  scoringBreakdown: ScoringBreakdown[];
}

export interface AnalyzeResult {
  matchScore: number;
  explanation: string;
  atsScore: number;
  atsExplanation: string;
  scoringBreakdown: ScoringBreakdown[];
}
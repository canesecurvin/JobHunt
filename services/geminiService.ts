

import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { UnprocessedCompanyJobs, TailorResult, AnalyzeResult, UnprocessedJobPosting } from '../types';
import { SCORING_RUBRIC } from '../scoringRubric';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

export const fileToText = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsText(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};

const cleanJsonString = (str: string): string => {
  const firstBracket = str.indexOf('[');
  const firstBrace = str.indexOf('{');
  
  let startIndex = -1;

  if (firstBracket === -1 && firstBrace === -1) return '';

  if (firstBracket !== -1 && firstBrace !== -1) {
    startIndex = Math.min(firstBracket, firstBrace);
  } else if (firstBracket !== -1) {
    startIndex = firstBracket;
  } else {
    startIndex = firstBrace;
  }

  const lastBracket = str.lastIndexOf(']');
  const lastBrace = str.lastIndexOf('}');

  let endIndex = Math.max(lastBracket, lastBrace);

  if (endIndex === -1 || endIndex < startIndex) return '';

  const jsonStr = str.substring(startIndex, endIndex + 1);

  return jsonStr.trim();
}

export const findJobs = async (
  resumeFiles: File[],
  companies: string[],
  sources: string[],
  location: string,
  willingToRelocate: boolean,
  needsSponsorship: boolean
): Promise<UnprocessedCompanyJobs[]> => {
  const resumeTexts = await Promise.all(resumeFiles.map(fileToText));
  const combinedResumes = resumeTexts.join('\n\n---\n\n');

  const prompt = `
    Based on the following resume(s) and user preferences, find job postings using a highly accurate, multi-step search protocol.

    **Resume(s):**
    ${combinedResumes}

    **User Preferences:**
    - Current Location: ${location || 'Not specified'} (This should be City, State, Country. Use this for filtering.)
    - Willing to Relocate: ${willingToRelocate ? 'Yes' : 'No'}
    - Needs Sponsorship: ${needsSponsorship ? 'Yes' : 'No'}

    **Target Companies:**
    ${companies.join(', ')}

    **Prioritized Search Sources (if provided):**
    ${sources.join(', ')}

    **Instructions & "Hybrid Scraper" Protocol:**
    1.  For each company, find DIRECT URLs to specific, relevant job postings.
    2.  For each URL, perform a SECOND, targeted search using the "site:" operator on that EXACT URL. This is your SINGLE SOURCE OF TRUTH.
    3.  **"Deal-Breaker" Filtering Protocol (Apply to each SOURCE OF TRUTH page):**
        - **GATE 1 (NON-NEGOTIABLE): Years of Experience.** If the resume doesn't meet the minimum, DISCARD.
        - **GATE 2: Core Skills Match.** If the resume doesn't demonstrate the top 3-5 non-negotiable skills, DISCARD.
        - **GATE 3 (SPONSORSHIP):** If 'Needs Sponsorship' is 'Yes', the job description must NOT explicitly deny sponsorship (e.g., "sponsorship not available", "must be authorized to work in the US without sponsorship"). If it does, DISCARD. Note if sponsorship is offered.
        - **GATE 4 (LOCATION):** Based on 'Willing to Relocate':
            - If 'No', the job location MUST be in the same city/state as the 'Current Location' OR be explicitly "Remote". Otherwise, DISCARD.
            - If 'Yes', the job location MUST be in the same country as the 'Current Location'. Otherwise, DISCARD.
    4.  **"Show Your Work" Requirement:** For each key requirement listed, provide a 'justificationSnippet' - the exact text from the job description.
    5.  **QUALITY OVER QUANTITY:** It is better to return 1-2 perfectly matched jobs than 3 mediocre ones.
    6.  **STRUCTURED JSON OUTPUT:** Return a single JSON array. Your response MUST ONLY BE THE JSON.
        [
          {
            "companyName": "Company Name",
            "aliasIdentifier": "google",
            "analysisSummary": "Matched based on 5+ years of full-stack experience and specific expertise in Azure and microservices, which were core requirements.",
            "jobs": [
              {
                "jobTitle": "Senior Cloud Engineer",
                "applicationLink": "https://careers.company.com/jobs/123",
                "jobDetails": "A brief summary of key responsibilities.",
                "postedDate": "2 days ago",
                "requiredYearsOfExperience": "5+ years",
                "location": "Redmond, WA, USA",
                "sponsorshipOffered": "Yes",
                "keyRequirements": [
                  { "requirement": "Azure", "justificationSnippet": "5+ years of experience with Microsoft Azure services (App Service, Functions, etc.)." },
                  { "requirement": "Microservices", "justificationSnippet": "Proven experience in designing and deploying microservices architectures." }
                ]
              }
            ]
          }
        ]
    7. The 'aliasIdentifier' MUST be a single, lowercase word representing the parent company (e.g., for 'YouTube' or 'Google Cloud', use 'google').
    8. If no jobs are found, return an empty array.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const jsonText = cleanJsonString(response.text);
    if (!jsonText) {
        console.warn("Gemini response did not contain valid JSON for findJobs, returning empty array. Response:", response.text);
        return [];
    }
    try {
      const parsedResult = JSON.parse(jsonText) as UnprocessedCompanyJobs[];
      return parsedResult;
    } catch (parseError) {
      console.error("Failed to parse JSON from Gemini (findJobs):", jsonText);
      throw new Error(`The AI returned an invalid response that could not be understood. Details: ${response.text.substring(0, 150)}`);
    }

  } catch (error) {
    console.error("Error calling Gemini API (findJobs):", error);
    if (error instanceof Error) throw error;
    throw new Error("An unexpected error occurred while fetching job postings.");
  }
};


const analyzeScores = async (
  resumeText: string,
  jobTitle: string,
  jobDetails: string
): Promise<AnalyzeResult> => {
   const prompt = `
    You are an expert ATS and recruitment analyst. Your task is to analyze the provided resume against the job description. You MUST follow the provided scoring rubric exactly. Your analysis and scoring MUST be deterministic.

    **Job Title:**
    ${jobTitle}

    **Job Details/Description:**
    ${jobDetails}

    **Resume to Analyze:**
    ${resumeText}
    
    **Scoring Rubric (MUST FOLLOW):**
    ${SCORING_RUBRIC}

    **Instructions:**
    1.  **Score Deterministically:** Score the resume against the job description using ONLY the provided rubric. The process must be deterministic.
    2.  **ATS Score:** The ATS score is also derived from the rubric, considering both structural elements AND keyword alignment from the job description.
    3.  **Return JSON:** Your response MUST be only the following JSON structure. Do not include any other text or markdown fences.
        {
          "matchScore": 85,
          "explanation": "A brief, numbered list explaining the score, strengths, and weaknesses based on the rubric.",
          "atsScore": 92,
          "atsExplanation": "Briefly explain the ATS score based on both structural parseability and keyword alignment from the rubric.",
          "scoringBreakdown": [
            { "category": "Core Technical & Experience Alignment", "score": 55, "maxScore": 60, "weight": 60 },
            { "category": "Education & Secondary Skills", "score": 10, "maxScore": 15, "weight": 15 },
            { "category": "Content Quality & Impact", "score": 12, "maxScore": 15, "weight": 15 },
            { "category": "Structural Adherence & Parseability", "score": 8, "maxScore": 10, "weight": 10 }
          ]
        }
  `;
  
  try {
     const response = await ai.models.generateContent({
      model: "gemini-2.5-flash", // Use fast model for consistent, deterministic scoring
      contents: prompt,
      config: {
        temperature: 0,
        responseMimeType: "application/json",
      },
    });

    const jsonText = cleanJsonString(response.text);
    try {
      return JSON.parse(jsonText) as AnalyzeResult;
    } catch (parseError) {
      console.error("Failed to parse JSON from Gemini (analyzeScores):", jsonText);
      throw new Error(`The AI returned an invalid score analysis. Details: ${jsonText.substring(0, 150)}`);
    }

  } catch (error) {
     console.error("Error calling Gemini API (analyzeScores):", error);
     if (error instanceof Error) throw error;
     throw new Error("An unexpected error occurred while analyzing the resume score.");
  }
}


export const tailorResume = async (
  resumeText: string,
  resumeImageBase64: string | null,
  jobTitle: string,
  jobDetails: string
): Promise<TailorResult> => {
   // Step 1: Creative Tailoring using the powerful Pro model
   const tailoringPrompt = `
    You are an expert resume writer. Your task is to creatively tailor the provided resume for a specific job application. 
    Focus ONLY on modifying the Professional Summary, Skills, and Experience bullet points to align with the job description.
    If a resume screenshot is provided, use it to understand the visual layout and density to ensure your edits fit a single page.
    Your response MUST ONLY be the full text of the tailored resume. NO JSON, no explanations, just the resume text.

    **Job Title:** ${jobTitle}
    **Job Details:** ${jobDetails}
    **Original Resume:**
    ${resumeText}
  `;
  
  const contents: any = { parts: [] };
  if (resumeImageBase64) {
    contents.parts.push({
      inlineData: {
        mimeType: 'image/jpeg',
        data: resumeImageBase64.split(',')[1],
      },
    });
  }
  contents.parts.push({ text: tailoringPrompt });

  try {
     const tailoringResponse = await ai.models.generateContent({
      model: "gemini-2.5-pro", // Use Pro model for high-quality creative writing
      contents: contents,
      config: {
        temperature: 0.4, // Allow for some creativity in writing
      },
    });
    const tailoredResumeText = tailoringResponse.text;

    // Step 2: Deterministic Scoring using the fast Flash model
    const analysisResult = await analyzeScores(tailoredResumeText, jobTitle, jobDetails);

    // Step 3: Combine results and return
    return {
      tailoredResume: tailoredResumeText,
      ...analysisResult,
    };

  } catch (error) {
     console.error("Error calling Gemini API (tailorResume orchestration):", error);
     if (error instanceof Error) throw error;
     throw new Error("An unexpected error occurred while tailoring the resume.");
  }
}

// Rerun analysis is now just a direct call to the unified, deterministic scoring function
export const analyzeResumeScore = analyzeScores;

export const rerunCompanySearch = async (
  companyName: string,
  resumeFiles: File[],
  feedback: string,
  sources: string[]
): Promise<UnprocessedCompanyJobs | null> => {
  const resumeTexts = await Promise.all(resumeFiles.map(fileToText));
  const combinedResumes = resumeTexts.join('\n\n---\n\n');

  const prompt = `
    An initial job search for "${companyName}" was unsatisfactory. Perform a new, more targeted search using the "Hybrid Scraper" and "Deal-Breaker" protocols, incorporating user feedback.

    **Resume(s):**
    ${combinedResumes}

    **Target Company:**
    ${companyName}

    **User Feedback:**
    "${feedback}"

    **Prioritized Sources:**
    ${sources.join(', ')}

    **Instructions & Protocol:**
    1.  **"Hybrid Scraper" Protocol:** First, find DIRECT URLs to specific job postings. Then, perform a SECOND, targeted search using the "site:" operator on each URL to get your SINGLE SOURCE OF TRUTH.
    2.  **"Deal-Breaker" Filtering:** Apply the strict filtering protocol (GATE 1: Years of Experience, GATE 2: Core Skills, GATE 3: Sponsorship, GATE 4: Location) to each SOURCE OF TRUTH. The user's preferences for the original search should be considered.
    3.  **Incorporate Feedback:** Ensure the new results align with the user's feedback (e.g., if feedback is "roles were too junior", filter out junior roles).
    4.  **"Show Your Work":** For each key requirement, provide a 'justificationSnippet' - the exact text from the job description that proves the requirement.
    5.  **STRUCTURED JSON OUTPUT:** Return a single JSON object for this company, with no other text.
        {
          "companyName": "Company Name",
          "aliasIdentifier": "google",
          "analysisSummary": "Based on feedback, this search focused on senior roles, finding a match that requires 8+ years of experience and expertise in distributed systems.",
          "jobs": [
            {
              "jobTitle": "Principal Software Engineer, Backend",
              "applicationLink": "https://careers.company.com/jobs/456",
              "jobDetails": "Brief summary of responsibilities.",
              "postedDate": "1 day ago",
              "requiredYearsOfExperience": "8+ years",
              "location": "Remote, USA",
              "sponsorshipOffered": "Not Mentioned",
              "keyRequirements": [
                  { "requirement": "Distributed Systems", "justificationSnippet": "Deep knowledge of distributed systems principles and design patterns."}
              ]
            }
          ]
        }
    6. The 'aliasIdentifier' MUST be a single, lowercase word representing the parent company.
    7. If no suitable jobs are found, return a JSON object with an empty "jobs" array.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const jsonText = cleanJsonString(response.text);
     if (!jsonText) {
        console.warn("Gemini response did not contain valid JSON for rerunCompanySearch, returning null. Response:", response.text);
        const emptyResult: UnprocessedCompanyJobs = { companyName, jobs: [], analysisSummary: 'No suitable jobs found after refinement.', aliasIdentifier: companyName.toLowerCase().replace(/[^a-z0-9]/gi, '') };
        return emptyResult;
    }
    try {
      const parsedResult = JSON.parse(jsonText) as UnprocessedCompanyJobs;
      return parsedResult;
    } catch (parseError) {
      console.error("Failed to parse JSON from Gemini (rerunCompanySearch):", jsonText);
      throw new Error(`The AI returned an invalid response during the refined search. Details: ${response.text.substring(0, 150)}`);
    }

  } catch (error) {
    console.error("Error calling Gemini API (rerunCompanySearch):", error);
    if (error instanceof Error) throw error;
    throw new Error("An unexpected error occurred while refining the job search.");
  }
};


export const streamChatAboutResume = async (
    originalResume: string,
    tailoredResume: string,
    jobDetails: string,
    chatHistory: { role: 'user' | 'model'; parts: { text: string }[] }[],
    userMessage: string
): Promise<AsyncGenerator<GenerateContentResponse>> => {
    
    const systemInstruction = `You are an expert career coach AI. Your role is to help the user refine their tailored resume. You have the context of their original resume, the AI-tailored version, and the job description. Be helpful, concise, and professional. Answer questions, provide suggestions, and help them brainstorm improvements based on their requests.`;

    const contents = [
        ...chatHistory,
        {
            role: 'user',
            parts: [{ text: `
Here is my original resume:
---
${originalResume}
---

Here is the tailored version you helped me create:
---
${tailoredResume}
---

And here is the job description we are targeting:
---
${jobDetails}
---

My question is: ${userMessage}
            `}]
        }
    ];

    try {
        const responseStream = await ai.models.generateContentStream({
            model: "gemini-2.5-flash",
            contents: contents,
            config: {
                systemInstruction,
            },
        });
        return responseStream;
    } catch (error) {
        console.error("Error calling Gemini API (streamChatAboutResume):", error);
        throw new Error("An unexpected error occurred while chatting about the resume.");
    }
}
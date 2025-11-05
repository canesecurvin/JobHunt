
export const SCORING_RUBRIC = `{
  "rubricName": "AI Resume Scoring Rubric for Max Job Description Match Confidence",
  "scoringScale": {
    "type": "weighted_sum",
    "maximumScore": 100
  },
  "categories": [
    {
      "name": "Core Technical & Experience Alignment",
      "totalWeight": 60,
      "criteria": [
        {
          "id": "1.1",
          "name": "Direct Skill Keywords (Technical & Soft) - JD 'Required'",
          "weight": 25,
          "description": "Exact or strong semantic matches for skills explicitly listed as 'Required' in the JD.",
          "aiTask": "Extract 'Required' skills from JD. Identify matches in resume (Skills, Experience, Projects).",
          "scoringLogic": "Each 'Required' skill matched = (25 / Total Required Skills) points. No match = 0 points for that skill."
        },
        {
          "id": "1.2",
          "name": "Technology/Tool Keywords - JD 'Required'",
          "weight": 15,
          "description": "Exact matches for specific technologies/tools explicitly listed as 'Required' in the JD.",
          "aiTask": "Extract 'Required' tech/tools from JD. Identify exact matches in resume.",
          "scoringLogic": "Each 'Required' tech/tool matched = (15 / Total Required Tech/Tools) points. No match = 0 points for that tech/tool."
        },
        {
          "id": "1.3",
          "name": "Years of Experience (Overall & Specific) - Matching JD requirements",
          "weight": 10,
          "description": "Total professional experience and specific experience (e.g., in a technology) matching JD requirements.",
          "aiTask": "Extract total years of relevant experience from resume. Extract JD experience requirements. Compare.",
          "scoringLogic": "Meets or exceeds all JD requirements = 10 pts. Within 1 year (overall) / 6 months (specific) = 5 pts. Significantly below = 0 pts."
        },
        {
          "id": "1.4",
          "name": "Relevant Job Titles/Role Progression",
          "weight": 10,
          "description": "Past job titles on resume align with target JD title or common seniority progression.",
          "aiTask": "Compare past resume job titles against JD target title and common seniority levels.",
          "scoringLogic": "Direct match/clear progression = 10 pts. Related but not direct = 5 pts. Unrelated/downward = 0 pts."
        }
      ]
    },
    {
      "name": "Education & Secondary Skills",
      "totalWeight": 15,
      "criteria": [
        {
          "id": "2.1",
          "name": "Educational Qualifications - Matching JD requirements",
          "weight": 10,
          "description": "Degree level and major matching JD requirements.",
          "aiTask": "Extract required degree/major from JD. Compare with resume.",
          "scoringLogic": "Exact match (degree AND major) = 10 pts. Degree matches, related major = 5 pts. Missing/unrelated = 0 pts."
        },
        {
          "id": "2.2",
          "name": "'Preferred' Skills & Technologies",
          "weight": 5,
          "description": "Presence of skills and technologies listed as 'Preferred' in the JD.",
          "aiTask": "Identify 'Preferred' items from JD. Check for presence in resume.",
          "scoringLogic": "Each matched 'Preferred' item = (5 / Total Preferred Items) points. No match = 0 pts for that item."
        }
      ]
    },
    {
      "name": "Content Quality & Impact",
      "totalWeight": 15,
      "criteria": [
        {
          "id": "3.1",
          "name": "Quantifiable Achievements",
          "weight": 10,
          "description": "Use of numbers, percentages, and metrics to describe impact in past roles.",
          "aiTask": "Scan experience bullet points for numerical data demonstrating impact.",
          "scoringLogic": "High density (>50% quantifiers) = 10 pts. Medium density (20-50%) = 5 pts. Low/No density = 0 pts."
        },
        {
          "id": "3.2",
          "name": "Grammar and Spelling Accuracy",
          "weight": 5,
          "description": "Absence of grammatical errors and typos.",
          "aiTask": "Run grammar and spell check across resume text.",
          "scoringLogic": "Zero errors = 5 pts. 1-2 minor errors = 3 pts. >2 errors or significant issues = 0 pts."
        }
      ]
    },
    {
      "name": "Structural Adherence & Parseability",
      "totalWeight": 10,
      "criteria": [
        {
          "id": "4.1",
          "name": "Standard Section Headers & Formatting (Parseability)",
          "weight": 10,
          "description": "Use of common headers and clean, simple formatting that enables easy ATS parsing.",
          "aiTask": "Verify presence of standard headers. Detect absence of complex graphics/non-standard elements. Evaluate parseability.",
          "scoringLogic": "All standard, highly parseable = 10 pts. Minor deviations, still parseable = 5 pts. Significant issues/unparseable = 0 pts."
        }
      ]
    }
  ],
  "overallLogic": {
    "initialParse": "AI must first successfully extract all entities. Significant parsing failure (e.g., due to poor formatting) defaults overall score to 0.",
    "calculation": "Calculate score for each criterion based on definition and weight. Sum these scores for total (max 100 points).",
    "thresholds": {
      "highFit": "75-100 pts: Strong candidate, likely to pass initial screening.",
      "mediumFit": "50-74 pts: Potential candidate, might require closer human review or have some gaps.",
      "lowFit": "0-49 pts: Unlikely to pass initial screening without significant human intervention."
    }
  }
}`;

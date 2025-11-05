import React, { useState, useEffect, useMemo, useRef } from 'react';
import { JobPosting, TailorResult, AnalyzeResult, ScoringBreakdown } from '../types';
import { Spinner } from './Spinner';
import { tailorResume, fileToText, analyzeResumeScore } from '../services/geminiService';
import { ResumeChatBot, ResumeChatBotRef } from './ResumeChatBot';
import { FormattedResume } from './FormattedResume';
import { RefreshIcon } from './icons/RefreshIcon';
import { InfoIcon } from './icons/InfoIcon';
import { SparklesIcon } from './icons/SparklesIcon';


declare global {
    interface Window {
        marked: any;
        docx: any;
        saveAs: any;
        pdfjsLib: any;
    }
}

interface TailorResumeModalProps {
    job: JobPosting;
    resumes: File[];
    onClose: () => void;
}

const ScoringBreakdownModal: React.FC<{breakdown: ScoringBreakdown[], onClose: () => void}> = ({breakdown, onClose}) => (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[60] p-4" onClick={onClose}>
        <div className="bg-surface rounded-2xl shadow-xl w-full max-w-2xl" onClick={(e) => e.stopPropagation()}>
            <header className="p-4 border-b border-muted flex justify-between items-center">
                <h2 className="text-xl font-bold text-text">Scoring Breakdown</h2>
                <button onClick={onClose} className="text-text-muted hover:text-text text-3xl leading-none">&times;</button>
            </header>
            <div className="p-6 text-text-muted space-y-4 max-h-[70vh] overflow-y-auto">
                <p>The match score is calculated deterministically based on a predefined rubric. Here is the breakdown of the score for this resume:</p>
                <div className="space-y-3">
                    {breakdown.map((item, index) => (
                        <div key={index}>
                            <div className="flex justify-between items-center mb-1">
                                <span className="font-semibold text-text">{item.category}</span>
                                <span className="text-sm font-bold text-primary">{item.score} / {item.maxScore}</span>
                            </div>
                            <div className="w-full bg-muted rounded-full h-2.5">
                                <div className="bg-primary h-2.5 rounded-full" style={{ width: `${(item.score / item.maxScore) * 100}%` }}></div>
                            </div>
                        </div>
                    ))}
                </div>
                 <p className="text-xs italic pt-4">This rubric ensures consistent and transparent analysis, removing AI subjectivity from the scoring process.</p>
            </div>
        </div>
    </div>
);


export const TailorResumeModal: React.FC<TailorResumeModalProps> = ({ job, resumes, onClose }) => {
    const [selectedResume, setSelectedResume] = useState<File | null>(resumes[0] || null);
    const [isLoading, setIsLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('');
    const [result, setResult] = useState<TailorResult | (AnalyzeResult & { tailoredResume?: string }) | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [originalResumeText, setOriginalResumeText] = useState('');
    const [editedResume, setEditedResume] = useState('');
    const [resumeImage, setResumeImage] = useState<string | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isBreakdownVisible, setIsBreakdownVisible] = useState(false);
    const [selectedText, setSelectedText] = useState('');
    const chatBotRef = useRef<ResumeChatBotRef>(null);


    useEffect(() => {
        const handleEsc = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    useEffect(() => {
        if (selectedResume && selectedResume.type === 'application/pdf') {
            const processPdf = async () => {
                try {
                    setLoadingMessage('Analyzing PDF layout...');
                    const reader = new FileReader();
                    reader.onload = async (event) => {
                        const pdfData = new Uint8Array(event.target!.result as ArrayBuffer);
                        const pdf = await window.pdfjsLib.getDocument({ data: pdfData }).promise;
                        const page = await pdf.getPage(1);
                        const viewport = page.getViewport({ scale: 1.5 });
                        const canvas = document.createElement('canvas');
                        const context = canvas.getContext('2d');
                        if (!context) return;
                        canvas.height = viewport.height;
                        canvas.width = viewport.width;
                        await page.render({ canvasContext: context, viewport }).promise;
                        setResumeImage(canvas.toDataURL('image/jpeg'));
                        setLoadingMessage('');
                    };
                    reader.readAsArrayBuffer(selectedResume);
                } catch (e) {
                    setError('Failed to analyze PDF file.');
                    setLoadingMessage('');
                }
            };
            processPdf();
        } else {
            setResumeImage(null);
        }
    }, [selectedResume]);


    const handleGenerate = async () => {
        if (!selectedResume) {
            setError("Please select a resume to tailor.");
            return;
        }
        setIsLoading(true);
        setError(null);
        setResult(null);
        setLoadingMessage('Extracting resume text...');
        
        try {
            let resumeText = '';
            let imageForApi: string | null = resumeImage;

            if (selectedResume.type === 'application/pdf') {
                const pdfData = new Uint8Array(await selectedResume.arrayBuffer());
                const pdf = await window.pdfjsLib.getDocument({ data: pdfData }).promise;
                let fullText = '';
                for (let i = 1; i <= pdf.numPages; i++) {
                    const page = await pdf.getPage(i);
                    const textContent = await page.getTextContent();
                    
                    let lastY = -1;
                    const items = textContent.items.map(item => ({...item}));
                    items.sort((a, b) => {
                        if (a.transform[5] > b.transform[5]) return -1;
                        if (a.transform[5] < b.transform[5]) return 1;
                        if (a.transform[4] > b.transform[4]) return 1;
                        if (a.transform[4] < b.transform[4]) return -1;
                        return 0;
                    });

                    for (const item of items) {
                        const currentY = item.transform[5];
                        if (lastY !== -1 && Math.abs(currentY - lastY) > (item.height * 0.5)) {
                            fullText += '\n';
                        }
                        fullText += item.str + ' ';
                        lastY = currentY;
                    }
                    fullText += '\n';
                }
                resumeText = fullText.trim().replace(/\s+\n/g, '\n').replace(/\n\s*\n/g, '\n\n');
            } else {
                resumeText = await fileToText(selectedResume);
                imageForApi = null; 
            }
            
            setOriginalResumeText(resumeText);
            setLoadingMessage('AI is tailoring your resume...');
            const tailorResult = await tailorResume(resumeText, imageForApi, job.jobTitle, job.jobDetails);
            setResult(tailorResult);
            setEditedResume(tailorResult.tailoredResume);

        } catch (err: any) {
            setError(err.message || "An unexpected error occurred during tailoring.");
        } finally {
            setIsLoading(false);
            setLoadingMessage('');
        }
    };

    const handleRerunAnalysis = async () => {
        setIsAnalyzing(true);
        setError(null);
        try {
            const analysisResult = await analyzeResumeScore(editedResume, job.jobTitle, job.jobDetails);
            setResult(prev => ({
                ...(prev as TailorResult), // Keep tailoredResume if it exists
                ...analysisResult,
            }));
        } catch (err: any) {
            setError(err.message || "An error occurred during analysis.");
        } finally {
            setIsAnalyzing(false);
        }
    };
    
    const handleTextDownload = () => {
        if (!editedResume) return;
        const blob = new Blob([editedResume], { type: 'text/plain;charset=utf-8' });
        const safeJobTitle = job.jobTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        const safeFileName = selectedResume?.name.split('.')[0] || 'resume';
        window.saveAs(blob, `${safeFileName}_tailored_for_${safeJobTitle}.txt`);
    };

    const handleDocxDownload = () => {
        if (!editedResume) return;

        if (!window.docx) {
            console.error("docx library not loaded");
            setError("Could not download .docx file. The document generation library failed to load. Please try refreshing the page.");
            return;
        }

        const { Document, Packer, Paragraph, TextRun } = window.docx;
        const lines = editedResume.split('\n');
        const children = lines.map(line => {
             const trimmedLine = line.trim();
             if (trimmedLine.startsWith('* ') || trimmedLine.startsWith('- ')) {
                 return new Paragraph({
                     text: trimmedLine.substring(2),
                     bullet: { level: 0 }
                 });
             }
            return new Paragraph({ children: [new TextRun(line)] });
        });
        const doc = new Document({ sections: [{ children }] });

        Packer.toBlob(doc).then((blob: any) => {
            const safeJobTitle = job.jobTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase();
            const safeFileName = selectedResume?.name.split('.')[0] || 'resume';
            window.saveAs(blob, `${safeFileName}_tailored_for_${safeJobTitle}.docx`);
        });
    };

    const handleSelection = () => {
        const text = window.getSelection()?.toString().trim() || '';
        if (text) {
            setSelectedText(text);
        } else {
            setSelectedText('');
        }
    };
    
    const handleRefineSelectedText = () => {
        if (selectedText && chatBotRef.current) {
            chatBotRef.current.refineText(selectedText);
            setSelectedText('');
            window.getSelection()?.removeAllRanges();
        }
    }

    const explanationHtml = useMemo(() => {
        if (!result?.explanation) {
            return { __html: '' };
        }

        // Defensively handle if the explanation is an array of strings
        const explanationText = Array.isArray(result.explanation)
            ? result.explanation.join('\n')
            : result.explanation;
        
        // Ensure we have a string to work with
        if (typeof explanationText !== 'string') {
             console.warn("Explanation was not a string or array of strings:", explanationText);
             return { __html: '' };
        }

        const spacedExplanation = explanationText.replace(/(\d+\.)\s/g, '\n\n$1 ').replace(/^\s*\n/, '');
        return { __html: window.marked.parse(spacedExplanation) };
    }, [result]);

    return (
        <>
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-surface rounded-2xl shadow-xl w-full max-w-7xl max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
                <header className="p-4 border-b border-muted flex justify-between items-center flex-shrink-0">
                    <h2 className="text-xl font-bold text-text">Resume Studio for: <span className="text-primary">{job.jobTitle}</span></h2>
                    <button onClick={onClose} className="text-text-muted hover:text-text text-3xl leading-none">&times;</button>
                </header>
                <div className="p-6 flex-grow overflow-y-auto flex flex-col">
                    {!result && !isLoading && (
                         <div className="space-y-4 max-w-lg mx-auto">
                            <div>
                                <label htmlFor="resume-select" className="block text-sm font-medium text-text-muted mb-2">Select resume to tailor</label>
                                <select 
                                    id="resume-select"
                                    value={selectedResume?.name || ''}
                                    onChange={(e) => setSelectedResume(resumes.find(r => r.name === e.target.value) || null)}
                                    className="block w-full px-3 py-2 bg-background border border-muted rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                                >
                                    {resumes.map(r => <option key={r.name} value={r.name}>{r.name}</option>)}
                                </select>
                            </div>
                            {resumeImage && (
                                <div>
                                    <p className="text-sm font-medium text-text-muted mb-2">Resume Layout Preview:</p>
                                    <div className="border border-muted rounded-md p-2 bg-background">
                                         <img src={resumeImage} alt="Resume preview" className="w-full h-auto rounded-md" />
                                    </div>
                                </div>
                            )}
                            <button
                                onClick={handleGenerate}
                                disabled={!selectedResume || !!loadingMessage}
                                className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark disabled:bg-muted"
                            >
                                {loadingMessage ? loadingMessage : 'Generate Tailored Resume'}
                            </button>
                         </div>
                    )}
                    {isLoading && (
                        <div className="text-center py-16">
                            <Spinner />
                            <p className="mt-4 text-text-muted">{loadingMessage || 'Initializing...'}</p>
                        </div>
                    )}
                     {error && !isLoading && <p className="text-sm text-red-500 text-center py-16">{error}</p>}
                    {result && (
                       <div className="flex flex-col flex-1 min-h-0">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-shrink-0">
                                <div>
                                    <h3 className="text-lg font-semibold mb-2 text-text">Original Resume</h3>
                                     <div className="w-full h-96 p-3 bg-background border border-muted rounded-md text-sm text-text-muted font-sans leading-relaxed overflow-y-auto">
                                        <FormattedResume text={originalResumeText} />
                                    </div>
                                </div>
                                <div className="relative">
                                    <h3 className="text-lg font-semibold mb-2 text-text">Tailored Version (Editable)</h3>
                                    <textarea
                                        value={editedResume}
                                        onChange={(e) => setEditedResume(e.target.value)}
                                        onMouseUp={handleSelection}
                                        onKeyUp={handleSelection}
                                        className="w-full h-96 p-3 bg-background border border-muted rounded-md text-sm font-sans leading-relaxed focus:ring-primary focus:border-primary"
                                    />
                                    {selectedText && (
                                        <button 
                                          onClick={handleRefineSelectedText}
                                          className="absolute bottom-4 right-4 flex items-center gap-2 px-3 py-1.5 bg-primary text-white rounded-md hover:bg-primary-dark transition-all text-sm font-medium animate-pulse-fast shadow-lg"
                                        >
                                          <SparklesIcon className="w-4 h-4" />
                                          <span>Refine with AI</span>
                                        </button>
                                    )}
                                </div>
                            </div>
                            <div className="flex flex-col lg:flex-row gap-6 mt-6 flex-1 min-h-0">
                                <div className="lg:w-1/3 p-4 bg-background rounded-lg flex flex-col">
                                    <div className="flex justify-between items-center mb-2 flex-shrink-0">
                                        <div className="flex items-center gap-2">
                                            <h3 className="text-lg font-semibold">Analysis & Changes</h3>
                                            {result.scoringBreakdown && (
                                              <button onClick={() => setIsBreakdownVisible(true)} className="text-text-muted hover:text-primary" title="Scoring Breakdown">
                                                  <InfoIcon className="w-5 h-5"/>
                                              </button>
                                            )}
                                        </div>
                                        <button
                                            onClick={handleRerunAnalysis}
                                            disabled={isAnalyzing}
                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-muted text-text rounded-md hover:bg-primary-dark transition-colors text-sm font-medium disabled:opacity-50"
                                            title="Rerun analysis on edited resume"
                                            >
                                            {isAnalyzing ? <Spinner /> : <RefreshIcon className="w-4 h-4" />}
                                            <span>Rerun</span>
                                        </button>
                                    </div>
                                    <div className="space-y-4 overflow-y-auto flex-1 pr-2">
                                        <div>
                                            <label className="text-sm font-medium text-text-muted">Match Score</label>
                                            <div className="w-full bg-muted rounded-full h-4 mt-1">
                                                <div className="bg-green-500 h-4 rounded-full" style={{ width: `${result.matchScore}%` }}></div>
                                            </div>
                                            <p className="text-right text-lg font-bold">{result.matchScore}%</p>
                                        </div>
                                        {'atsScore' in result && (
                                          <div>
                                              <label className="text-sm font-medium text-text-muted">ATS Compatibility</label>
                                              <div className="w-full bg-muted rounded-full h-4 mt-1">
                                                  <div className="bg-blue-500 h-4 rounded-full" style={{ width: `${result.atsScore}%` }}></div>
                                              </div>
                                              <p className="text-right text-lg font-bold">{result.atsScore}%</p>
                                          </div>
                                        )}
                                        {'atsExplanation' in result && result.atsExplanation && (
                                            <div>
                                                <h4 className="text-sm font-medium text-text-muted">ATS Explanation</h4>
                                                <p className="mt-1 text-text-muted text-xs">{result.atsExplanation}</p>
                                            </div>
                                        )}
                                        <div>
                                            <h4 className="text-sm font-medium text-text-muted">Match Explanation</h4>
                                            <div className="prose prose-sm prose-invert mt-1 text-text-muted max-w-none prose-p:my-2 prose-ol:pl-4 prose-li:my-1" dangerouslySetInnerHTML={explanationHtml} />
                                        </div>
                                    </div>
                                </div>
                                <div className="lg:w-2/3 flex flex-col">
                                     <ResumeChatBot 
                                        ref={chatBotRef}
                                        originalResume={originalResumeText}
                                        tailoredResume={editedResume}
                                        jobDetails={job.jobDetails}
                                     />
                                </div>
                            </div>
                       </div>
                    )}
                </div>
                {result && (
                     <footer className="p-4 border-t border-muted flex justify-end gap-4 flex-shrink-0">
                        <button onClick={handleTextDownload} className="px-4 py-2 bg-muted text-text rounded-md hover:bg-opacity-80 text-sm">Download .txt</button>
                        <button onClick={handleDocxDownload} className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark">Download .docx</button>
                    </footer>
                )}
            </div>
        </div>
        {isBreakdownVisible && result?.scoringBreakdown && <ScoringBreakdownModal breakdown={result.scoringBreakdown} onClose={() => setIsBreakdownVisible(false)} />}
        </>
    );
};
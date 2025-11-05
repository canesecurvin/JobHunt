import React, { useState, FormEvent, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { streamChatAboutResume } from '../services/geminiService';
import { Spinner } from './Spinner';

interface ResumeChatBotProps {
    originalResume: string;
    tailoredResume: string;
    jobDetails: string;
}

export interface ResumeChatBotRef {
    refineText: (text: string) => void;
}

type Message = {
    role: 'user' | 'model';
    text: string;
};

export const ResumeChatBot = forwardRef<ResumeChatBotRef, ResumeChatBotProps>(({ originalResume, tailoredResume, jobDetails }, ref) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [messages]);
    
    const runSubmit = async (messageText: string) => {
         if (!messageText.trim() || isLoading) return;

        const userMessage: Message = { role: 'user', text: messageText };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);
        setError(null);

        try {
            const chatHistory = messages.map(msg => ({
                role: msg.role,
                parts: [{ text: msg.text }]
            }));
            
            const stream = await streamChatAboutResume(originalResume, tailoredResume, jobDetails, chatHistory, messageText);
            
            let fullResponse = '';
            setMessages(prev => [...prev, { role: 'model', text: '' }]);

            for await (const chunk of stream) {
                const chunkText = chunk.text;
                fullResponse += chunkText;
                setMessages(prev => {
                    const newMessages = [...prev];
                    newMessages[newMessages.length - 1].text = fullResponse;
                    return newMessages;
                });
            }

        } catch (err: any) {
            setError(err.message || 'An error occurred.');
        } finally {
            setIsLoading(false);
        }
    }

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        runSubmit(input);
    };

    useImperativeHandle(ref, () => ({
        refineText: (text: string) => {
            const refinePrompt = `Please rewrite the following selection from my resume to be more impactful and aligned with the job description:\n\n"${text}"`;
            setInput(refinePrompt); // Pre-fill the input box
            runSubmit(refinePrompt); // Immediately submit for refinement
        }
    }));


    return (
        <div className="bg-background rounded-lg p-4 h-full flex flex-col">
            <h3 className="text-lg font-semibold mb-2 text-text flex-shrink-0">Resume Co-Pilot</h3>
            <div className="flex-1 overflow-y-auto pr-2 space-y-4 min-h-0">
                 {messages.length === 0 && (
                    <div className="text-center text-sm text-text-muted pt-8">
                        Select text in the tailored resume to refine it, or ask me anything!
                        <p className="mt-2 text-xs opacity-70">e.g., "Make my summary sound more confident."</p>
                    </div>
                )}
                {messages.map((msg, index) => (
                    <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-xs md:max-w-md lg:max-w-lg px-4 py-2 rounded-lg text-sm whitespace-pre-wrap ${msg.role === 'user' ? 'bg-primary text-white' : 'bg-muted text-text-muted'}`}>
                            {msg.text}
                        </div>
                    </div>
                ))}
                 {isLoading && messages[messages.length - 1]?.role !== 'model' && (
                     <div className="flex justify-start">
                         <div className="bg-muted text-text-muted px-4 py-2 rounded-lg">
                             <Spinner />
                         </div>
                     </div>
                 )}
                <div ref={messagesEndRef} />
            </div>
            {error && <p className="text-red-500 text-xs text-center mt-2 flex-shrink-0">{error}</p>}
            <form onSubmit={handleSubmit} className="mt-4 flex items-center gap-2 flex-shrink-0">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask for changes or ideas..."
                    className="flex-grow px-3 py-2 bg-muted border border-muted rounded-md shadow-sm placeholder-gray-500 focus:outline-none focus:ring-primary focus:border-primary text-sm"
                    disabled={isLoading}
                />
                <button
                    type="submit"
                    disabled={isLoading || !input.trim()}
                    className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark disabled:bg-muted disabled:cursor-not-allowed text-sm font-medium"
                >
                    {isLoading ? <Spinner/> : 'Send'}
                </button>
            </form>
        </div>
    );
});
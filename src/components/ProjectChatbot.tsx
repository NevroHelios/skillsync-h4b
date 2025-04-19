'use client';
import React, { useState, useRef, useEffect } from 'react';

interface Project {
  name: string;
  description?: string;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

// Simple SVG Spinner component
const LoadingSpinner = () => (
  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

export default function ProjectChatbot({ projects }: { projects: Project[] }) {
  const [selectedName, setSelectedName] = useState(projects[0]?.name || '');
  const [question, setQuestion] = useState('');
  const [chatLog, setChatLog] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null); // Ref for scrolling

  // Effect to scroll to bottom when chatLog changes
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatLog]);

  const handleAsk = async () => {
    const project = projects.find(p => p.name === selectedName);
    if (!project || !question.trim() || loading) return;

    const userMessage: ChatMessage = { role: 'user', content: question };
    setChatLog(prev => [...prev, userMessage]);
    setQuestion(''); // Clear input immediately
    setLoading(true);

    // Add a placeholder for the assistant's response
    setChatLog(prev => [...prev, { role: 'assistant', content: '' }]);

    try {
      const res = await fetch('/api/project-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project: { name: project.name, description: project.description },
          question: userMessage.content // Use the captured question
        })
      });

      if (!res.ok) {
        throw new Error(`Chat API error: ${res.statusText}`);
      }
      if (!res.body) {
        throw new Error('Response body is null');
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let assistantMsg = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        assistantMsg += decoder.decode(value, { stream: true });

        // Update the last message (which is the assistant's placeholder)
        setChatLog(prev => {
          const updatedLog = [...prev];
          if (updatedLog.length > 0 && updatedLog[updatedLog.length - 1].role === 'assistant') {
            updatedLog[updatedLog.length - 1].content = assistantMsg;
          }
          return updatedLog;
        });
      }
    } catch (err: any) {
      console.error("Chatbot error:", err);
      // Update the last message to show the error
      setChatLog(prev => {
         const updatedLog = [...prev];
         if (updatedLog.length > 0 && updatedLog[updatedLog.length - 1].role === 'assistant') {
           updatedLog[updatedLog.length - 1].content = `Error: ${err.message || 'Failed to get response.'}`;
         } else {
           // If something went wrong before the placeholder was added
           updatedLog.push({ role: 'assistant', content: `Error: ${err.message || 'Failed to get response.'}` });
         }
         return updatedLog;
      });
    } finally {
      setLoading(false);
      // Keep focus on input after sending/error
      document.getElementById('chat-input')?.focus();
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault(); // Prevent default form submission or newline
      handleAsk();
    }
  };

  return (
    <div className="mt-8 bg-gray-800 rounded-lg shadow-xl p-4 flex flex-col max-w-2xl mx-auto" style={{ height: '600px' }}>
      <h3 className="text-xl font-semibold text-indigo-300 mb-4 text-center border-b border-gray-700 pb-2">
        Project Chatbot
      </h3>

      {/* Project Selector */}
      <div className="mb-4 flex items-center gap-2 px-2">
         <label htmlFor="project-select" className="text-sm font-medium text-gray-400">Project:</label>
         <select
           id="project-select"
           value={selectedName}
           onChange={e => {
             setSelectedName(e.target.value);
             setChatLog([]); // Clear chat when project changes
           }}
           className="flex-grow bg-gray-700 border border-gray-600 text-white text-sm rounded-md focus:ring-indigo-500 focus:border-indigo-500 px-3 py-1.5"
         >
           {projects.map(p => (<option key={p.name} value={p.name}>{p.name}</option>))}
         </select>
      </div>


      {/* Chat Messages Area */}
      <div
        ref={chatContainerRef}
        className="flex-grow overflow-y-auto mb-4 pr-2 space-y-4 custom-scrollbar" // Added custom-scrollbar class if you want to style it
      >
        {chatLog.length === 0 && (
           <p className="text-center text-gray-500 text-sm mt-4">Ask a question about the selected project.</p>
        )}
        {chatLog.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-xs md:max-w-md lg:max-w-lg px-4 py-2 rounded-lg shadow ${
                msg.role === 'user'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-700 text-gray-200'
              }`}
            >
              {/* Basic Markdown Handling (Bold and Code) - Can be expanded */}
               <pre className="whitespace-pre-wrap font-sans text-sm break-words">
                 {msg.content || (msg.role === 'assistant' && loading && i === chatLog.length - 1 ? '...' : '')}
               </pre>
            </div>
          </div>
        ))}
         {/* Displaying subtle loading dots on the assistant placeholder */}
         {loading && chatLog[chatLog.length - 1]?.role === 'assistant' && !chatLog[chatLog.length - 1]?.content && (
            <div className="flex justify-start">
              <div className="px-4 py-2 rounded-lg shadow bg-gray-700 text-gray-400">
                <span className="animate-pulse">...</span>
              </div>
            </div>
          )}
      </div>

      {/* Input Area */}
      <div className="flex items-center gap-2 border-t border-gray-700 pt-3">
        <input
          id="chat-input"
          type="text"
          value={question}
          onChange={e => setQuestion(e.target.value)}
          onKeyDown={handleKeyDown} // Handle Enter key press
          placeholder="Ask a question..."
          disabled={loading}
          className="flex-1 bg-gray-700 border border-gray-600 text-white rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:opacity-60"
        />
        <button
          onClick={handleAsk}
          disabled={loading || !question.trim()}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors duration-200"
          style={{ minWidth: '80px' }} // Ensure button width doesn't jump too much
        >
          {loading ? <LoadingSpinner /> : 'Send'}
        </button>
      </div>
    </div>
  );
}
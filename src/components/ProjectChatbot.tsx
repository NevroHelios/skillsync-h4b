'use client';
import React, { useState } from 'react';

interface Project { name: string; description?: string; }

export default function ProjectChatbot({ projects }: { projects: Project[] }) {
  const [selectedName, setSelectedName] = useState(projects[0]?.name || '');
  const [question, setQuestion] = useState('');
  const [chatLog, setChatLog] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);
  const [loading, setLoading] = useState(false);

  const handleAsk = async () => {
    const project = projects.find(p => p.name === selectedName);
    if (!project || !question.trim()) return;
    // add user message
    setChatLog(prev => [...prev, { role: 'user', content: question }]);
    setLoading(true);
    try {
      const res = await fetch('/api/project-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project: { name: project.name, description: project.description }, question })
      });
      if (!res.ok) throw new Error('Chat API error');
      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let assistantMsg = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        assistantMsg += decoder.decode(value, { stream: true });
        setChatLog(prev => {
          const updated = [...prev];
          if (updated[updated.length - 1]?.role === 'assistant') {
            updated[updated.length - 1].content = assistantMsg;
          } else {
            updated.push({ role: 'assistant', content: assistantMsg });
          }
          return updated;
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setQuestion('');
    }
  };

  return (
    <div className="mt-6">
      <h3 className="text-lg font-semibold text-indigo-400 mb-2">Project Chatbot</h3>
      <div className="flex gap-2 mb-2">
        <select
          value={selectedName}
          onChange={e => setSelectedName(e.target.value)}
          className="bg-gray-800 border border-gray-700 text-white px-2 py-1 rounded"
        >
          {projects.map(p => (<option key={p.name} value={p.name}>{p.name}</option>))}
        </select>
        <input
          type="text"
          value={question}
          onChange={e => setQuestion(e.target.value)}
          placeholder="Ask a question..."
          className="flex-1 bg-gray-800 border border-gray-700 text-white px-2 py-1 rounded"
        />
        <button
          onClick={handleAsk}
          disabled={loading}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-1 rounded disabled:opacity-50"
        >{loading ? '...' : 'Send'}</button>
      </div>
      <div className="max-h-64 overflow-y-auto bg-gray-900 border border-gray-700 p-3 rounded text-sm text-gray-300">
        {chatLog.map((msg, i) => (
          <div key={i} className={msg.role === 'user' ? 'text-right mb-1' : 'text-left mb-1'}>
            <span className={msg.role === 'user' ? 'text-indigo-200' : 'text-green-300'}>
              {msg.content}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

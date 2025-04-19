'use client';
import React, { useState, useRef, useEffect, useCallback } from 'react';
import ReactFlow, { 
  Background, 
  Controls, 
  MiniMap,
  addEdge, 
  useNodesState, 
  useEdgesState, 
  MarkerType,
  Handle,
  Position,
  Panel
} from 'reactflow';
import 'reactflow/dist/style.css';

interface Project {
  name: string;
  description?: string;
}

// Sample predefined queries - can be updated
const PREDEFINED_QUERIES = [
  "What are the main features?",
  "What technologies are used?",
  "What's the project status?",
  "Any known issues?",
  "When was the last update?"
];

// Custom node types
const ProjectNode = ({ data }) => (
  <div className="px-4 py-2 rounded-lg shadow bg-indigo-700 text-white min-w-48">
    <Handle type="target" position={Position.Top} />
    <div className="font-bold">{data.name}</div>
    {data.description && (
      <div className="text-xs mt-1 text-indigo-200">{data.description.substring(0, 60)}...</div>
    )}
    <Handle type="source" position={Position.Bottom} />
  </div>
);

const QueryNode = ({ data }) => (
  <div className="px-4 py-2 rounded-lg shadow bg-gray-700 text-white min-w-40">
    <Handle type="target" position={Position.Top} />
    <div className="font-semibold">Query</div>
    <div className="text-sm mt-1">{data.text}</div>
    <Handle type="source" position={Position.Bottom} />
  </div>
);

const ResponseNode = ({ data }) => (
  <div className="px-4 py-3 rounded-lg shadow bg-gray-800 text-gray-200 max-w-md">
    <Handle type="target" position={Position.Top} />
    <div className="font-semibold text-indigo-300 mb-1">Response</div>
    <div className="text-sm whitespace-pre-wrap">
      {data.text || (data.loading ? "Thinking..." : "")}
    </div>
  </div>
);

// Node types definition
const nodeTypes = {
  project: ProjectNode,
  query: QueryNode,
  response: ResponseNode
};

export default function ProjectChatbot({ projects }: { projects: Project[] }) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [queryText, setQueryText] = useState('');
  const [reactFlowInstance, setReactFlowInstance] = useState(null);
  const nodeId = useRef(1);
  
  // For right panel controls
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const onConnect = useCallback((params) => {
    // Only add edge if it's connecting from query to project
    if (params.source.startsWith('query-') && params.target.startsWith('project-')) {
      setEdges((eds) => addEdge({
        ...params,
        animated: true,
        style: { stroke: '#6366f1' },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: '#6366f1',
        },
      }, eds));
      
      // Get project from the target node
      const projectId = params.target;
      const projectName = projectId.replace('project-', '');
      const project = projects.find(p => p.name === projectName);
      
      // Get query from source node
      const queryId = params.source;
      const queryNode = nodes.find(n => n.id === queryId);
      const question = queryNode?.data?.text || '';
      
      if (project && question) {
        handleAsk(project, question, queryId);
      }
    }
  }, [nodes, projects, setEdges]);

  const handleAddProject = () => {
    if (!selectedProject) return;
    
    // Check if this project is already on the canvas
    const existingProject = nodes.find(node => 
      node.type === 'project' && node.data.name === selectedProject.name
    );
    
    if (existingProject) {
      // Maybe flash the node or alert the user
      return;
    }
    
    const id = `project-${selectedProject.name}`;
    const projectNode = {
      id,
      type: 'project',
      data: { 
        name: selectedProject.name,
        description: selectedProject.description
      },
      position: { 
        x: Math.random() * 300 + 100, 
        y: Math.random() * 100 + 100 
      }
    };
    
    setNodes(nds => [...nds, projectNode]);
    setSelectedProject(null); // Reset selection
  };

  const handleAddCustomQuery = () => {
    if (!queryText.trim()) return;
    
    const id = `query-${nodeId.current++}`;
    const newNode = {
      id,
      type: 'query',
      data: { text: queryText },
      position: { 
        x: Math.random() * 300 + 100, 
        y: Math.random() * 100 + 300 
      }
    };
    
    setNodes(nds => [...nds, newNode]);
    setQueryText('');
  };
  
  const handleAddPredefinedQuery = (queryText) => {
    const id = `query-${nodeId.current++}`;
    const newNode = {
      id,
      type: 'query',
      data: { text: queryText },
      position: { 
        x: Math.random() * 300 + 100, 
        y: Math.random() * 100 + 300 
      }
    };
    
    setNodes(nds => [...nds, newNode]);
  };

  const handleAsk = async (project, question, queryNodeId) => {
    // Create response node
    const responseId = `response-${nodeId.current++}`;
    const responseNode = {
      id: responseId,
      type: 'response',
      data: { text: '', loading: true },
      position: { 
        x: Math.random() * 300 + 200, 
        y: Math.random() * 100 + 500 
      }
    };
    
    setNodes(nds => [...nds, responseNode]);
    
    // Connect query to response
    const responseEdge = {
      id: `edge-${queryNodeId}-${responseId}`,
      source: queryNodeId,
      target: responseId,
      animated: true,
      style: { stroke: '#8b5cf6' },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: '#8b5cf6',
      },
    };
    
    setEdges(eds => [...eds, responseEdge]);
    
    try {
      const res = await fetch('/api/project-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project: { name: project.name, description: project.description },
          question: question
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

        // Update the response node with streaming content
        setNodes(nds => 
          nds.map(node => 
            node.id === responseId
              ? { ...node, data: { ...node.data, text: assistantMsg, loading: false } }
              : node
          )
        );
      }
    } catch (err) {
      console.error("Chatbot error:", err);
      // Update response node with error message
      setNodes(nds => 
        nds.map(node => 
          node.id === responseId
            ? { ...node, data: { ...node.data, text: `Error: ${err.message || 'Failed to get response.'}`, loading: false } }
            : node
        )
      );
    }
  };

  return (
    <div className="mt-8 bg-gray-800 rounded-lg shadow-xl p-4 flex flex-col max-w-6xl mx-auto" style={{ height: '700px' }}>
      <h3 className="text-xl font-semibold text-indigo-300 mb-4 text-center border-b border-gray-700 pb-2">
        Interactive Project Flow
      </h3>
      
      {/* Main ReactFlow Canvas */}
      <div className="flex-grow rounded-md overflow-hidden border border-gray-700">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          onInit={setReactFlowInstance}
          fitView
        >
          <Background color="#4b5563" gap={16} />
          <Controls position="bottom-left" />
          <MiniMap
            nodeStrokeColor={(n) => {
              if (n.type === 'project') return '#6366f1';
              if (n.type === 'query') return '#4b5563';
              return '#8b5cf6';
            }}
            nodeColor={(n) => {
              if (n.type === 'project') return '#4338ca';
              if (n.type === 'query') return '#374151';
              return '#5b21b6';
            }}
            position="bottom-right"
          />
          
          {/* Right Panel Controls */}
          <Panel position="right" className="bg-gray-900 p-4 rounded-l-lg border-l border-t border-b border-gray-700 max-w-xs w-64">
            <div className="space-y-6">
              {/* Project Selection */}
              <div>
                <h4 className="text-indigo-300 font-semibold mb-2 text-sm">Add Project</h4>
                <div className="flex flex-col gap-2">
                  <select
                    value={selectedProject?.name || ''}
                    onChange={(e) => {
                      const project = projects.find(p => p.name === e.target.value);
                      setSelectedProject(project || null);
                    }}
                    className="bg-gray-700 border border-gray-600 text-white text-sm rounded-md focus:ring-indigo-500 focus:border-indigo-500 px-3 py-2"
                  >
                    <option value="">Select a project...</option>
                    {projects.map(project => (
                      <option key={project.name} value={project.name}>
                        {project.name}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={handleAddProject}
                    disabled={!selectedProject}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm px-3 py-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                  >
                    Add to Canvas
                  </button>
                </div>
              </div>
              
              {/* Custom Query Creation */}
              <div>
                <h4 className="text-indigo-300 font-semibold mb-2 text-sm">Custom Query</h4>
                <div className="flex flex-col gap-2">
                  <input
                    type="text"
                    value={queryText}
                    onChange={e => setQueryText(e.target.value)}
                    placeholder="Type your question..."
                    className="bg-gray-700 border border-gray-600 text-white text-sm rounded-md focus:ring-indigo-500 focus:border-indigo-500 px-3 py-2"
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        handleAddCustomQuery();
                      }
                    }}
                  />
                  <button
                    onClick={handleAddCustomQuery}
                    disabled={!queryText.trim()}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm px-3 py-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                  >
                    Add Custom Query
                  </button>
                </div>
              </div>
              
              {/* Predefined Queries */}
              <div>
                <h4 className="text-indigo-300 font-semibold mb-2 text-sm">Predefined Queries</h4>
                <div className="flex flex-col gap-1 max-h-64 overflow-y-auto pr-1">
                  {PREDEFINED_QUERIES.map((query, index) => (
                    <button
                      key={index}
                      onClick={() => handleAddPredefinedQuery(query)}
                      className="bg-gray-700 hover:bg-gray-600 text-white text-sm px-3 py-2 rounded-md text-left transition-colors duration-200 truncate"
                      title={query}
                    >
                      {query}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Instructions */}
              <div className="text-gray-400 text-xs">
                <p className="font-medium mb-1">How to use:</p>
                <ol className="list-decimal pl-4 space-y-1">
                  <li>Add a project to the canvas</li>
                  <li>Add a query (custom or predefined)</li>
                  <li>Connect the query to a project</li>
                  <li>See the response appear!</li>
                </ol>
              </div>
            </div>
          </Panel>
        </ReactFlow>
      </div>
    </div>
  );
}
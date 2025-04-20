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
  Panel,
  ReactFlowProvider, // Import ReactFlowProvider
  useReactFlow,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { FiBox, FiHelpCircle, FiMessageSquare, FiPlus, FiSend, FiTrash2, FiInfo } from 'react-icons/fi';

// Interfaces and Constants (unchanged)
interface Project {
  name: string;
  description?: string;
  link?: string;
  skills?: string[];
  experience?: string;
  repoUrl?: string;
  stars?: number;
  forks?: number;
  language?: string;
  topics?: string[];
  lastUpdate?: string;
  creation?: string;
}
const PREDEFINED_QUERIES = [
  'What are the main features?',
  'What technologies are used?',
  'What is the project status?',
  'Any known issues?',
  'When was the last update?',
  'Summarize the project.',
  'Who is the main contact?',
];
const NODE_VERTICAL_SPACING = 180; // Space below a project/query for the next element
const NODE_HORIZONTAL_SPACING = 280; // Horizontal space between new nodes of the same type

// --- Enhanced Custom Node Types (unchanged) ---
const NodeWrapper = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`rounded-lg shadow-lg border border-gray-700/50 ${className}`}>
    {children}
  </div>
);
const NodeHeader = ({ icon: Icon, title, className = '' }: { icon: React.ElementType; title: string; className?: string }) => (
  <div className={`flex items-center gap-2 px-4 py-2 border-b border-gray-600/50 ${className}`}>
    <Icon className="w-4 h-4" />
    <div className="font-semibold text-sm">{title}</div>
  </div>
);
const NodeBody = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`px-4 py-3 text-sm ${className}`}>
    {children}
  </div>
);
const ProjectNode = ({ data }) => (
  <NodeWrapper className="bg-gradient-to-br from-indigo-800 to-indigo-700 text-white min-w-[220px]">
    <Handle type="target" position={Position.Top} className="!bg-indigo-400 !w-3 !h-3" />
    <NodeHeader icon={FiBox} title={data.name} className="text-indigo-100" />
    <NodeBody className="text-xs text-indigo-200">
      {data.description && <div className="mb-1">{data.description.substring(0, 80)}...</div>}
      {data.language && <div className="text-indigo-300">Language: {data.language}</div>}
      {data.stars !== undefined && <div className="text-indigo-300">⭐ {data.stars}</div>}
    </NodeBody>
    <Handle type="source" position={Position.Bottom} className="!bg-indigo-400 !w-3 !h-3" />
  </NodeWrapper>
);
const QueryNode = ({ data }) => (
  <NodeWrapper className="bg-gray-700 text-white min-w-[200px]">
    <Handle type="target" position={Position.Top} className="!bg-gray-400 !w-3 !h-3" />
    <NodeHeader icon={FiHelpCircle} title="Query" className="text-gray-100" />
    <NodeBody className="text-gray-200">{data.text}</NodeBody>
    <Handle type="source" position={Position.Bottom} className="!bg-gray-400 !w-3 !h-3" />
  </NodeWrapper>
);
const ResponseNode = ({ data }) => (
  <NodeWrapper className="bg-gray-800 text-gray-200 max-w-lg border-indigo-500/30">
    <Handle type="target" position={Position.Top} className="!bg-indigo-400 !w-3 !h-3" />
    <NodeHeader icon={FiMessageSquare} title="Response" className="text-indigo-300" />
    <NodeBody className="whitespace-pre-wrap text-gray-300">
      {data.loading ? (
        <div className="flex items-center gap-2 text-gray-400">
          <div className="w-3 h-3 border-2 border-t-transparent border-gray-400 rounded-full animate-spin"></div>
          Thinking...
        </div>
      ) : (
        data.text || <span className="text-gray-500 italic">No response generated yet.</span>
      )}
    </NodeBody>
  </NodeWrapper>
);
const nodeTypes = { project: ProjectNode, query: QueryNode, response: ResponseNode };

// --- Helper Functions ---
const saveToLocalStorage = (key, data) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving to localStorage:', error);
  }
};
const loadFromLocalStorage = (key, defaultValue) => {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : defaultValue;
  } catch (error) {
    console.error('Error loading from localStorage:', error);
    return defaultValue;
  }
};

// Component that will be wrapped by ReactFlowProvider
function ProjectChatbotContent({ projects }: { projects: Project[] }) {
  const [nodes, setNodes, onNodesChange] = useNodesState(
    loadFromLocalStorage('projectChatbot-nodes', [])
  );
  const [edges, setEdges, onEdgesChange] = useEdgesState(
    loadFromLocalStorage('projectChatbot-edges', [])
  );
  const [queryText, setQueryText] = useState('');
  const reactFlowInstance = useReactFlow(); // Get instance for viewport access
  const nodeId = useRef(loadFromLocalStorage('projectChatbot-nodeId', 1));
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  // Save state to localStorage when it changes
  useEffect(() => {
    saveToLocalStorage('projectChatbot-nodes', nodes);
    saveToLocalStorage('projectChatbot-edges', edges);
    saveToLocalStorage('projectChatbot-nodeId', nodeId.current);
  }, [nodes, edges]);

  // --- Positioning Logic ---
  const getNextNodePosition = (nodeType: 'project' | 'query') => {
    const existingNodesOfType = nodes.filter(n => n.type === nodeType);
    const PADDING = 20; // Padding from viewport edges
    const VIEWPORT_FALLBACK_WIDTH = 800; // Assumed width if viewport not ready

    let baseX = 200;
    let baseY = nodeType === 'project' ? 100 : 450;

    if (reactFlowInstance) {
      const { x, y, zoom } = reactFlowInstance.getViewport();
      const viewport = reactFlowInstance.getViewport();
      const viewWidth = viewport.width || VIEWPORT_FALLBACK_WIDTH;
      baseX = -x / zoom + viewWidth / (2 * zoom) - (NODE_HORIZONTAL_SPACING / 2);
      baseY = -y / zoom + (nodeType === 'project' ? 100 : 400) / zoom;
    }

    if (existingNodesOfType.length === 0) {
      return { x: baseX, y: baseY };
    }

    let rightmostX = -Infinity;
    let targetY = baseY;

    existingNodesOfType.forEach(node => {
      if (node.position.x > rightmostX) {
        rightmostX = node.position.x;
        targetY = node.position.y;
      }
    });

    const newX = rightmostX + NODE_HORIZONTAL_SPACING;
    const newY = targetY;

    return { x: newX, y: newY };
  };

  // --- Core Logic Functions ---
  const onConnect = useCallback((params) => {
    const sourceNode = reactFlowInstance.getNode(params.source);
    const targetNode = reactFlowInstance.getNode(params.target);

    if (sourceNode?.type === 'query' && targetNode?.type === 'project') {
      const edge = {
        ...params,
        id: `edge-${params.source}-${params.target}-${Date.now()}`,
        type: 'smoothstep',
        animated: true,
        style: { stroke: '#6366f1', strokeWidth: 2 },
        markerEnd: { type: MarkerType.ArrowClosed, color: '#6366f1' },
      };
      setEdges((eds) => addEdge(edge, eds));

      const projectData = targetNode.data as Project;
      const question = sourceNode.data.text;

      if (projectData && question && targetNode.position) {
        handleAsk(projectData, question, sourceNode.id, targetNode.position);
      }
    } else {
      console.log("Connection ignored: Only Query -> Project connections allowed via drag.");
    }
  }, [reactFlowInstance, setEdges]);

  const handleAddProject = () => {
    if (!selectedProject) return;
    console.log("Selected project object:", selectedProject); // <-- Add this line
    const existingProject = nodes.find(node =>
      node.type === 'project' && node.data.name === selectedProject.name
    );
    if (existingProject) {
      console.warn(`Project "${selectedProject.name}" is already on the canvas.`);
      reactFlowInstance.fitView({ nodes: [existingProject], duration: 300, padding: 0.2 });
      setSelectedProject(null);
      return;
    }
    const id = `project-${selectedProject.name.replace(/\s+/g, '-')}`;
    const projectNode = {
      id,
      type: 'project',
      data: { ...selectedProject }, // <-- Pass the full project object
      position: getNextNodePosition('project')
    };
    setNodes(nds => [...nds, projectNode]);
    setSelectedProject(null);
    setTimeout(() => reactFlowInstance.fitView({ nodes: [projectNode], duration: 300, padding: 0.3 }), 100);
  };

  const addQueryNode = (text: string) => {
    const id = `query-${nodeId.current++}`;
    const newNode = {
      id,
      type: 'query',
      data: { text },
      position: getNextNodePosition('query')
    };
    setNodes(nds => [...nds, newNode]);
    setTimeout(() => reactFlowInstance.fitView({ nodes: [newNode], duration: 300, padding: 0.3 }), 100);
  };

  const handleAddCustomQuery = () => {
    if (!queryText.trim()) return;
    addQueryNode(queryText);
    setQueryText('');
  };

  const handleAddPredefinedQuery = (query: string) => {
    addQueryNode(query);
  };

  const handleAsk = async (
    project: Project,
    question: string,
    queryNodeId: string,
    projectNodePosition: { x: number; y: number }
  ) => {
    const existingResponseEdge = edges.find(
      e => e.source === queryNodeId && e.target.startsWith('response-')
    );
    if (existingResponseEdge) {
      console.log("Response already generated or in progress for this query.");
      const responseNodeId = existingResponseEdge.target;
      const responseNode = reactFlowInstance.getNode(responseNodeId);
      if (responseNode) {
        reactFlowInstance.fitView({ nodes: [responseNode], duration: 300, padding: 0.2 });
      }
      return;
    }

    const responseId = `response-${nodeId.current++}`;
    const responseNodePosition = {
      x: projectNodePosition.x,
      y: projectNodePosition.y + NODE_VERTICAL_SPACING
    };

    const responseNode = {
      id: responseId,
      type: 'response',
      data: { text: '', loading: true },
      position: responseNodePosition,
    };
    setNodes(nds => [...nds, responseNode]);

    const responseEdge = {
      id: `edge-${queryNodeId}-${responseId}`,
      source: queryNodeId,
      target: responseId,
      type: 'smoothstep',
      animated: false,
      style: { stroke: '#a78bfa', strokeWidth: 1.5, strokeDasharray: '5 5' },
      markerEnd: { type: MarkerType.ArrowClosed, color: '#a78bfa' },
    };
    setEdges(eds => [...eds, responseEdge]);

    setTimeout(() => {
      const node = reactFlowInstance.getNode(responseId);
      if (node) {
        const viewport = reactFlowInstance.getViewport();
        const nodeRect = {
          x: node.position.x,
          y: node.position.y,
          width: node.width || 200,
          height: node.height || 100
        };

        const nodeBottom = (nodeRect.y + nodeRect.height) * viewport.zoom + viewport.y;
        const viewBottom = window.innerHeight;

        if (nodeBottom > viewBottom - 50) {
          reactFlowInstance.fitView({
            nodes: [{ id: queryNodeId }, { id: responseId }],
            duration: 400,
            padding: 0.2
          });
        }
      }
    }, 200);

    try {
      const res = await fetch('/api/project-chat', {
        method: 'POST', // This confirms it's a POST request
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          project: project, // Pass the full project context
          question: question
        })
      });

      // Check response status *before* trying to read the body
      if (!res.ok) {
        console.log(res);
        console.log(project, question);
        console.log("aaaaaaaaaaaaaaaaaaaaaaaaa")
        // Try to get error details from the response body if possible
        let errorDetails = `Chat API error: ${res.status} ${res.statusText}`;
        try {
          const errorJson = await res.json();
          errorDetails = errorJson.error || errorJson.details || errorDetails;
        } catch (e) {
          // Ignore if response body is not JSON or empty
        }
        throw new Error(errorDetails);
      }

      if (!res.body) {
        throw new Error('Response body is null');
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let assistantMsg = '';
      let isDone = false;

      while (!isDone) {
        const { done, value } = await reader.read();
        isDone = done;
        if (value) {
          assistantMsg += decoder.decode(value, { stream: !isDone });
          setNodes(nds =>
            nds.map(node =>
              node.id === responseId
                ? { ...node, data: { ...node.data, text: assistantMsg, loading: !isDone } }
                : node
            )
          );
        }
      }
      setNodes(nds =>
        nds.map(node =>
          node.id === responseId
            ? { ...node, data: { ...node.data, text: assistantMsg, loading: false } }
            : node
        )
      );

    } catch (err) {
      console.error('Chatbot error:', err);
      setNodes(nds =>
        nds.map(node =>
          node.id === responseId
            ? { ...node, data: { ...node.data, text: `Error: ${err.message || 'Failed to get response.'}`, loading: false } }
            : node
        )
      );
    }
  };

  const handleClearCanvas = () => {
    setNodes([]);
    setEdges([]);
    nodeId.current = 1;
  };

  return (
    <div className="bg-gray-900 rounded-xl shadow-2xl p-1 flex flex-col w-full mx-auto border border-gray-700/50" style={{ height: '80vh', minHeight: '650px' }}>
      <h3 className="text-xl font-semibold text-indigo-300 pt-4 pb-3 px-6 text-center border-b border-gray-700/80">
        Interactive Project Flow
      </h3>

      <div className="flex-grow rounded-b-xl overflow-hidden relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.15 }}
          deleteKeyCode={['Backspace', 'Delete']}
          connectionLineStyle={{ stroke: '#cbd5e1', strokeWidth: 2 }}
          connectionLineType="smoothstep"
          proOptions={{ hideAttribution: true }}
        >
          <Background color="#374151" gap={20} size={1.5} />
          <Controls position="bottom-left" className="text-gray-300" />
          <MiniMap position="bottom-right" />

          <Panel position="top-right" className="bg-gray-800/90 backdrop-blur-sm p-5 rounded-lg border border-gray-700/50 shadow-xl max-w-sm w-80 mt-4 mr-4">
            <div className="space-y-5">
              <section>
                <h4 className="text-indigo-300 font-semibold mb-3 text-base flex items-center gap-2"><FiBox /> Add Project</h4>
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
              </section>
              <hr className="border-gray-600/50" />
              <section>
                <h4 className="text-indigo-300 font-semibold mb-3 text-base flex items-center gap-2"><FiHelpCircle /> Custom Query</h4>
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
              </section>
              <hr className="border-gray-600/50" />
              <section>
                <h4 className="text-indigo-300 font-semibold mb-3 text-base flex items-center gap-2"><FiHelpCircle /> Predefined Queries</h4>
                <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-700/50">
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
              </section>
              <hr className="border-gray-600/50" />
              <section>
                <h4 className="text-indigo-300 font-semibold mb-3 text-base flex items-center gap-2"><FiInfo /> How to Use</h4>
                <div className="text-gray-400 text-xs space-y-2 mb-4">
                  <p>1. Add Projects and Queries to the canvas using the controls above.</p>
                  <p>2. <strong className="text-indigo-400">Drag a connection line</strong> from a <span className="text-gray-200">Query</span> node's bottom handle to a <span className="text-indigo-200">Project</span> node's top handle.</p>
                  <p>3. A <span className="text-purple-300">Response</span> node will appear below the Project node.</p>
                </div>
                <button
                  onClick={handleClearCanvas}
                  className="bg-red-600 hover:bg-red-700 text-white text-sm px-3 py-2 rounded-md transition-colors duration-200"
                >
                  <FiTrash2 /> Clear Canvas
                </button>
              </section>
            </div>
          </Panel>
        </ReactFlow>
      </div>
    </div>
  );
}

// Wrap the component with ReactFlowProvider and export
export default function ProjectChatbot({ projects }: { projects: Project[] }) {
  return (
    <ReactFlowProvider>
      <ProjectChatbotContent projects={projects} />
    </ReactFlowProvider>
  );
}
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
  ReactFlowProvider,
  useReactFlow,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { FiBox, FiHelpCircle, FiMessageSquare, FiPlus, FiSend, FiTrash2, FiInfo, FiChevronDown, FiLayout } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

// Interfaces and Constants
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

const NODE_VERTICAL_SPACING = 200;
const NODE_HORIZONTAL_SPACING = 300;

// Tooltip Component
const Tooltip = ({ children, text }) => (
  <div className="group relative inline-block">
    {children}
    <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 px-3 py-1.5 text-xs font-medium text-white bg-gray-800 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap pointer-events-none z-50">
      {text}
    </div>
  </div>
);

// Enhanced Custom Node Types
const NodeWrapper = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <motion.div 
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.3 }}
    className={`rounded-lg shadow-xl border border-gray-700/50 ${className}`}
  >
    {children}
  </motion.div>
);

const NodeHeader = ({ icon: Icon, title, className = '' }: { icon: React.ElementType; title: string; className?: string }) => (
  <div className={`flex items-center gap-2 px-4 py-3 border-b border-gray-600/50 ${className}`}>
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
  <NodeWrapper className="bg-gradient-to-br from-indigo-900 to-indigo-700 text-white min-w-[240px] overflow-hidden backdrop-blur-lg">
    <Handle type="target" position={Position.Top} className="!bg-indigo-400 !w-3 !h-3 !border-2 !border-indigo-900" />
    <NodeHeader icon={FiBox} title={data.name} className="text-indigo-100 border-indigo-600/50" />
    <NodeBody className="text-xs text-indigo-200">
      {data.description && <div className="mb-2 font-medium">{data.description.substring(0, 100)}...</div>}
      <div className="flex items-center gap-3 mt-2">
        {data.language && (
          <div className="text-indigo-300 flex items-center gap-1">
            <span className="inline-block w-2 h-2 rounded-full bg-indigo-400"></span>
            {data.language}
          </div>
        )}
        {data.stars !== undefined && (
          <div className="text-indigo-300 flex items-center gap-1">
            <span className="text-amber-300">⭐</span> {data.stars}
          </div>
        )}
        {data.forks !== undefined && (
          <div className="text-indigo-300 flex items-center gap-1">
            <span className="text-green-300">⑂</span> {data.forks}
          </div>
        )}
      </div>
    </NodeBody>
    <Handle type="source" position={Position.Bottom} className="!bg-indigo-400 !w-3 !h-3 !border-2 !border-indigo-900" />
  </NodeWrapper>
);

const QueryNode = ({ data }) => (
  <NodeWrapper className="bg-gradient-to-br from-gray-800 to-gray-700 text-white min-w-[220px] overflow-hidden">
    <Handle type="target" position={Position.Top} className="!bg-gray-400 !w-3 !h-3 !border-2 !border-gray-900" />
    <NodeHeader icon={FiHelpCircle} title="Query" className="text-gray-100 border-gray-600/50" />
    <NodeBody className="text-gray-200 font-medium">{data.text}</NodeBody>
    <Handle type="source" position={Position.Bottom} className="!bg-gray-400 !w-3 !h-3 !border-2 !border-gray-900" />
  </NodeWrapper>
);

const ResponseNode = ({ data }) => (
  <NodeWrapper className="bg-gradient-to-br from-gray-900 to-gray-800 text-gray-200 max-w-lg border-indigo-500/30 overflow-hidden">
    <Handle type="target" position={Position.Top} className="!bg-indigo-400 !w-3 !h-3 !border-2 !border-indigo-900" />
    <NodeHeader icon={FiMessageSquare} title="Response" className="text-indigo-300 border-gray-700/50" />
    <NodeBody className="whitespace-pre-wrap text-gray-300 max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
      {data.loading ? (
        <motion.div 
          className="flex items-center gap-3 text-gray-400"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex items-center justify-center">
            <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce mr-1"></div>
            <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce mr-1" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
          </div>
          <span>Generating response...</span>
        </motion.div>
      ) : (
        data.text || <span className="text-gray-500 italic">No response generated yet.</span>
      )}
    </NodeBody>
  </NodeWrapper>
);

const nodeTypes = { project: ProjectNode, query: QueryNode, response: ResponseNode };

// Helper Functions
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
  const reactFlowInstance = useReactFlow();
  const nodeId = useRef(loadFromLocalStorage('projectChatbot-nodeId', 1));
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isControlsOpen, setIsControlsOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('projects');
  const [panelPosition, setPanelPosition] = useState('right');

  // Save state to localStorage when it changes
  useEffect(() => {
    saveToLocalStorage('projectChatbot-nodes', nodes);
    saveToLocalStorage('projectChatbot-edges', edges);
    saveToLocalStorage('projectChatbot-nodeId', nodeId.current);
  }, [nodes, edges]);

  // Positioning Logic
  const getNextNodePosition = (nodeType: 'project' | 'query') => {
    const existingNodesOfType = nodes.filter(n => n.type === nodeType);
    const PADDING = 20;
    const VIEWPORT_FALLBACK_WIDTH = 800;

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

  // Core Logic Functions
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
    
    const existingProject = nodes.find(node =>
      node.type === 'project' && node.data.name === selectedProject.name
    );
    
    if (existingProject) {
      reactFlowInstance.fitView({ nodes: [existingProject], duration: 500, padding: 0.2 });
      setSelectedProject(null);
      return;
    }
    
    const id = `project-${selectedProject.name.replace(/\s+/g, '-')}`;
    const projectNode = {
      id,
      type: 'project',
      data: { ...selectedProject },
      position: getNextNodePosition('project')
    };
    
    setNodes(nds => [...nds, projectNode]);
    setSelectedProject(null);
    setTimeout(() => reactFlowInstance.fitView({ nodes: [projectNode], duration: 500, padding: 0.3 }), 100);
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
    setTimeout(() => reactFlowInstance.fitView({ nodes: [newNode], duration: 500, padding: 0.3 }), 100);
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
      const responseNodeId = existingResponseEdge.target;
      const responseNode = reactFlowInstance.getNode(responseNodeId);
      if (responseNode) {
        reactFlowInstance.fitView({ nodes: [responseNode], duration: 500, padding: 0.2 });
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
            duration: 500,
            padding: 0.2
          });
        }
      }
    }, 200);

    try {
      const res = await fetch('/api/project-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          project: project,
          question: question
        })
      });

      if (!res.ok) {
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
    // Add a confirmation dialog
    if (nodes.length > 0 && !window.confirm('Are you sure you want to clear the canvas? All nodes and connections will be removed.')) {
      return;
    }
    
    setNodes([]);
    setEdges([]);
    nodeId.current = 1;
  };

  const togglePanelPosition = () => {
    setPanelPosition(prev => prev === 'right' ? 'left' : 'right');
  };

  return (
    <div className="bg-gray-900 rounded-xl shadow-2xl p-1 flex flex-col w-full mx-auto border border-gray-700/50 overflow-hidden" style={{ height: '80vh', minHeight: '650px' }}>
      <div className="text-xl font-semibold text-indigo-300 pt-4 pb-3 px-6 text-center border-b border-gray-700/80 relative">
        <div className="flex items-center justify-center">
          <FiLayout className="mr-2 text-indigo-400" />
          Interactive Project Flow
        </div>
        
        <Tooltip text={`Move panel to ${panelPosition === 'right' ? 'left' : 'right'} side`}>
          <button 
            onClick={togglePanelPosition}
            className="absolute top-4 right-4 text-gray-400 hover:text-indigo-300 transition-colors duration-200"
          >
            <FiLayout />
          </button>
        </Tooltip>
      </div>

      <div className="flex-grow rounded-b-xl overflow-hidden relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.15, duration: 800 }}
          deleteKeyCode={['Backspace', 'Delete']}
          connectionLineStyle={{ stroke: '#818cf8', strokeWidth: 2 }}
          connectionLineType="smoothstep"
          proOptions={{ hideAttribution: true }}
        >
          <Background color="#374151" gap={20} size={1.5} />
          <Controls 
            position="bottom-left" 
            className="!bg-gray-800/90 backdrop-blur-sm !border !border-gray-700/50 !shadow-lg !rounded-lg !p-1"
            showInteractive={false}
          />
          <MiniMap 
            position="bottom-right" 
            className="!bg-gray-800/90 backdrop-blur-sm !border !border-gray-700/50 !shadow-lg !rounded-lg"
            nodeColor={node => {
              if (node.type === 'project') return '#6366f1';
              if (node.type === 'query') return '#4b5563';
              return '#a78bfa';
            }}
            maskColor="rgba(30, 41, 59, 0.5)"
          />

          <Panel 
            position={`top-${panelPosition}`} 
            className={`transition-all duration-500 ease-in-out ${isControlsOpen ? 'translate-x-0' : panelPosition === 'right' ? 'translate-x-full' : '-translate-x-full'}`}
          >
            <div className="bg-gray-800/90 backdrop-blur-sm p-5 rounded-lg border border-gray-700/50 shadow-xl max-w-sm w-80 mt-4 mr-4 transition-all duration-300">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-indigo-300 font-semibold">Control Panel</h3>
                <button 
                  onClick={() => setIsControlsOpen(!isControlsOpen)}
                  className="text-gray-400 hover:text-indigo-300 transition-colors"
                >
                  <FiChevronDown className={`transform transition-transform duration-300 ${isControlsOpen ? 'rotate-180' : ''}`} />
                </button>
              </div>
              
              <AnimatePresence>
                {isControlsOpen && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="mb-4 border-b border-gray-700/50 pb-2">
                      <div className="flex rounded-md overflow-hidden">
                        <button
                          onClick={() => setActiveTab('projects')}
                          className={`flex-1 py-2 text-sm font-medium ${activeTab === 'projects' ? 'bg-indigo-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
                        >
                          Projects
                        </button>
                        <button
                          onClick={() => setActiveTab('queries')}
                          className={`flex-1 py-2 text-sm font-medium ${activeTab === 'queries' ? 'bg-indigo-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
                        >
                          Queries
                        </button>
                        <button
                          onClick={() => setActiveTab('help')}
                          className={`flex-1 py-2 text-sm font-medium ${activeTab === 'help' ? 'bg-indigo-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
                        >
                          Help
                        </button>
                      </div>
                    </div>
                    
                    {activeTab === 'projects' && (
                      <motion.section
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      >
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
                            className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm px-4 py-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center gap-2"
                          >
                            <FiPlus /> Add to Canvas
                          </button>
                        </div>
                      </motion.section>
                    )}
                    
                    {activeTab === 'queries' && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <section className="mb-4">
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
                              className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm px-4 py-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center gap-2"
                            >
                              <FiSend /> Add Custom Query
                            </button>
                          </div>
                        </section>
                        
                        <hr className="border-gray-600/50 my-4" />
                        
                        <section>
                          <h4 className="text-indigo-300 font-semibold mb-3 text-base flex items-center gap-2"><FiHelpCircle /> Predefined Queries</h4>
                          <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-700/50">
                            {PREDEFINED_QUERIES.map((query, index) => (
                              <button
                                key={index}
                                onClick={() => handleAddPredefinedQuery(query)}
                                className="bg-gray-700 hover:bg-gray-600 text-white text-sm px-3 py-2 rounded-md text-left transition-colors duration-200 truncate border border-gray-600/30 hover:border-gray-500"
                                title={query}
                              >
                                {query}
                              </button>
                            ))}
                          </div>
                        </section>
                      </motion.div>
                    )}
                    
                    {activeTab === 'help' && (
                      <motion.section
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <h4 className="text-indigo-300 font-semibold mb-3 text-base flex items-center gap-2"><FiInfo /> How to Use</h4>
                        <div className="text-gray-300 text-sm space-y-3 mb-4">
                          <div className="flex items-start gap-2">
                            <div className="bg-indigo-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs flex-shrink-0 mt-0.5">1</div>
                            <p>Add Projects and Queries to the canvas using the tools above.</p>
                          </div>
                          <div className="flex items-start gap-2">
                            <div className="bg-indigo-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs flex-shrink-0 mt-0.5">2</div>
                            <p><strong className="text-indigo-400">Drag a connection line</strong> from a <span className="text-gray-200">Query</span> node's bottom handle to a <span className="text-indigo-200">Project</span> node's top handle.</p>
                          </div>
                          <div className="flex items-start gap-2">
                            <div className="bg-indigo-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs flex-shrink-0 mt-0.5">3</div>
                            <p>A <span className="text-purple-300">Response</span> node will appear below the Project node with the generated answer.</p>
                          </div>
                        </div>
                        <button
                          onClick={handleClearCanvas}
                          className="bg-red-600 hover:bg-red-700 text-white text-sm px-4 py-2 rounded-md transition-colors duration-200 w-full flex items-center justify-center gap-2"
                        >
                          <FiTrash2 /> Clear Canvas
                        </button>
                      </motion.section>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </Panel>
          
          {!isControlsOpen && (
            <button
              onClick={() => setIsControlsOpen(true)}
              className={`absolute ${panelPosition === 'right' ? 'right-4' : 'left-4'} top-4 z-10 bg-gray-800/90 backdrop-blur-sm p-2 rounded-lg border border-gray-700/50 shadow-xl text-indigo-300 hover:text-indigo-200 transition-colors`}
            >
              <FiChevronDown className="transform rotate-180" />
            </button>
          )}
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
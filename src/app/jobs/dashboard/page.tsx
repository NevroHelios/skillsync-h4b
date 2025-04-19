'use client';

import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { toast } from 'react-toastify';
import {
    FiSearch, FiMapPin, FiBriefcase, FiFilter, FiX, FiExternalLink, FiLoader,
    FiPlusCircle, FiTrash2, FiShare2, FiCheckSquare, FiType, FiTag, FiUserCheck, FiDatabase // New Icons
} from 'react-icons/fi';
import ReactFlow, {
    useNodesState, useEdgesState, addEdge, MiniMap, Controls, Background,
    Node, Edge, Position, Connection, NodeProps, ReactFlowProvider, useReactFlow, Handle, useStoreApi, // Import Handle & useStoreApi
    NodeToolbar, // For node actions
} from 'reactflow';
import { shallow } from 'zustand/shallow'; // For optimizing selectors

import 'reactflow/dist/style.css';
import './filter-flow-styles.css'; // We'll add some specific CSS

// --- Interfaces and Constants ---
interface Job {
    _id: string;
    title: string;
    company: string;
    location: string;
    description: string;
    techStack: string[];
    salaryMin?: number;
    salaryMax?: number;
    employmentType?: string;
    experienceLevel?: string;
    status: 'Open' | 'Closed' | 'Draft';
    createdAt: string;
}

const EXPERIENCE_LEVELS = ["Entry-level", "Mid-level", "Senior-level", "Lead", "Manager"];
const EMPLOYMENT_TYPES = ["Full-time", "Part-time", "Contract", "Temporary", "Internship"];

// --- Filter Flow Specific Types ---
type FilterType = 'source' | 'search' | 'experience' | 'employment' | 'tech' | 'output';

interface BaseFilterData {
    id: string; // Ensure ID is part of data for easier updates
    type: FilterType;
    label: string;
}
interface SearchFilterData extends BaseFilterData {
    type: 'search';
    value: string;
    onChange: (id: string, value: string) => void;
}
interface SelectFilterData extends BaseFilterData {
    type: 'experience' | 'employment';
    value: string;
    options: readonly string[];
    onChange: (id: string, value: string) => void;
}
interface TechFilterData extends BaseFilterData {
    type: 'tech';
    value: string[];
    options: string[];
    onChange: (id: string, value: string[]) => void;
}
interface SourceData extends BaseFilterData { type: 'source'; }
interface OutputData extends BaseFilterData { type: 'output'; }

type FilterNodeData = SourceData | SearchFilterData | SelectFilterData | TechFilterData | OutputData;

// --- Filter Flow Node Components ---

const FilterNodeWrapper: React.FC<React.PropsWithChildren<{ label: string, typeIcon: React.ReactNode, nodeId: string, onDelete: (id: string) => void }>> =
    ({ children, label, typeIcon, nodeId, onDelete }) => {
        return (
            <div className="filter-node bg-gray-700 border border-gray-600 rounded-md shadow-lg text-white text-xs relative">
                <NodeToolbar isVisible={true} position={Position.Top}>
                    <button onClick={() => onDelete(nodeId)} title="Delete Filter" className="text-red-500 hover:text-red-400 p-1 bg-gray-800 rounded-full border border-gray-600">
                        <FiTrash2 size={12} />
                    </button>
                </NodeToolbar>
                <div className="filter-node-header bg-gray-800 px-2 py-1 rounded-t-md border-b border-gray-600 flex items-center gap-1.5">
                    {typeIcon} <span className="font-medium">{label}</span>
                </div>
                <div className="p-2">
                    {children}
                </div>
                <Handle type="target" position={Position.Left} className="filter-handle !bg-teal-500" />
                <Handle type="source" position={Position.Right} className="filter-handle !bg-indigo-500" />
            </div>
        );
    };

const SourceNode: React.FC<NodeProps<SourceData>> = ({ data }) => (
    <div className="filter-node source-node bg-green-800 border border-green-600 rounded-md shadow-lg text-white text-xs p-3 flex items-center gap-2">
        <FiDatabase size={14}/> <span className="font-medium">{data.label}</span>
        <Handle type="source" position={Position.Right} className="filter-handle !bg-green-500" />
    </div>
);

const OutputNode: React.FC<NodeProps<OutputData>> = ({ data }) => (
    <div className="filter-node output-node bg-purple-800 border border-purple-600 rounded-md shadow-lg text-white text-xs p-3 flex items-center gap-2">
       <FiCheckSquare size={14}/> <span className="font-medium">{data.label}</span>
        <Handle type="target" position={Position.Left} className="filter-handle !bg-purple-500" />
    </div>
);


const SearchFilterNode: React.FC<NodeProps<SearchFilterData>> = memo(({ id, data }) => (
    <FilterNodeWrapper label={data.label} typeIcon={<FiSearch size={12}/>} nodeId={id} onDelete={(nodeId) => console.warn("Delete not implemented via toolbar here yet") /* TODO: Implement delete via toolbar or context */}>
        <input
            type="text"
            placeholder="Keywords..."
            value={data.value}
            onChange={(e) => data.onChange(id, e.target.value)}
            className="nodrag w-full p-1 bg-gray-600 border border-gray-500 rounded text-xs focus:border-indigo-500 focus:ring-indigo-500"
        />
    </FilterNodeWrapper>
));
SearchFilterNode.displayName = 'SearchFilterNode';


const SelectFilterNode: React.FC<NodeProps<SelectFilterData>> = memo(({ id, data }) => (
    <FilterNodeWrapper
        label={data.label}
        typeIcon={data.type === 'experience' ? <FiUserCheck size={12}/> : <FiType size={12}/>}
        nodeId={id}
        onDelete={(nodeId) => console.warn("Delete not implemented via toolbar here yet")}
    >
        <select
            value={data.value}
            onChange={(e) => data.onChange(id, e.target.value)}
            className="nodrag w-full p-1 bg-gray-600 border border-gray-500 rounded text-xs focus:border-indigo-500 focus:ring-indigo-500 appearance-none pr-5 bg-no-repeat bg-right"
            style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%239ca3af' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.3rem center', backgroundSize: '1.2em 1.2em' }}
        >
            <option value="">Any</option>
            {data.options.map(option => (
                <option key={option} value={option}>{option}</option>
            ))}
        </select>
    </FilterNodeWrapper>
));
SelectFilterNode.displayName = 'SelectFilterNode';


const TechStackFilterNode: React.FC<NodeProps<TechFilterData>> = memo(({ id, data }) => {
    const toggleTech = (tech: string) => {
        const newValue = data.value.includes(tech)
            ? data.value.filter(t => t !== tech)
            : [...data.value, tech];
        data.onChange(id, newValue);
    };

    return (
        <FilterNodeWrapper label={data.label} typeIcon={<FiTag size={12}/>} nodeId={id} onDelete={(nodeId) => console.warn("Delete not implemented via toolbar here yet")}>
             <p className="text-[10px] text-gray-400 mb-1">Select required skills (AND):</p>
            <div className="nodrag flex flex-wrap gap-1 max-h-20 overflow-y-auto pr-1">
                {data.options.map(tech => (
                    <button
                        key={tech}
                        onClick={() => toggleTech(tech)}
                        className={`px-2 py-0.5 rounded-full text-[10px] border transition-colors duration-150 ${
                            data.value.includes(tech)
                                ? 'bg-indigo-600 text-white border-indigo-500 font-medium'
                                : 'bg-gray-600 text-gray-200 border-gray-500 hover:bg-gray-500 hover:border-gray-400'
                        }`}
                    >
                        {tech}
                    </button>
                ))}
            </div>
        </FilterNodeWrapper>
    );
});
TechStackFilterNode.displayName = 'TechStackFilterNode';


const filterNodeTypes = {
    source: SourceNode,
    output: OutputNode,
    search: SearchFilterNode,
    experience: SelectFilterNode,
    employment: SelectFilterNode,
    tech: TechStackFilterNode,
};

// --- Filter Builder Flow Component ---
interface FilterBuilderFlowProps {
    allTechTags: string[];
    onFilterChange: (filters: ActiveFilters) => void;
}

interface ActiveFilters {
    searchTerm: string;
    experienceLevel: string;
    employmentType: string;
    techStack: string[];
}

const initialFilterNodes: Node<FilterNodeData>[] = [
    { id: 'source', type: 'source', position: { x: 50, y: 100 }, data: { id: 'source', type: 'source', label: 'All Jobs' } },
    { id: 'output', type: 'output', position: { x: 650, y: 100 }, data: { id: 'output', type: 'output', label: 'Filtered Jobs' } },
];

const initialFilterEdges: Edge[] = [];

let idCounter = 0;
const getUniqueNodeId = (type: FilterType) => `${type}-${idCounter++}`;

function FilterBuilderFlow({ allTechTags, onFilterChange }: FilterBuilderFlowProps) {
    const [nodes, setNodes, onNodesChange] = useNodesState<FilterNodeData>(initialFilterNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialFilterEdges);
    const reactFlowInstance = useReactFlow(); // Get instance for manipulating nodes/edges if needed

    // Function to update data within a specific node
    const updateNodeData = useCallback((nodeId: string, newData: any) => {
        setNodes((nds) =>
            nds.map((node) => {
                if (node.id === nodeId) {
                    // Important: Merge new data with existing data, especially the onChange callback
                    return { ...node, data: { ...node.data, ...newData } };
                }
                return node;
            })
        );
    }, [setNodes]);

     // Enhanced updateNodeValue specifically for filter value changes
    const updateNodeValue = useCallback((nodeId: string, value: any) => {
        setNodes((nds) =>
            nds.map((node) => {
                if (node.id === nodeId) {
                    // Preserve the rest of the data like type, label, onChange
                    return { ...node, data: { ...node.data, value: value } };
                }
                return node;
            })
        );
    }, [setNodes]);


    // Add a new filter node to the canvas
    const addFilterNode = useCallback((type: FilterType) => {
        const nodeId = getUniqueNodeId(type);
        let newNode: Node<FilterNodeData>;
        const newNodePosition = { x: 250 + Math.random() * 150, y: 50 + Math.random() * 100 }; // Randomize slightly

        switch (type) {
            case 'search':
                newNode = { id: nodeId, type, position: newNodePosition, data: { id: nodeId, type, label: 'Search Term', value: '', onChange: updateNodeValue } };
                break;
            case 'experience':
                newNode = { id: nodeId, type, position: newNodePosition, data: { id: nodeId, type, label: 'Experience', value: '', options: EXPERIENCE_LEVELS, onChange: updateNodeValue } };
                break;
            case 'employment':
                newNode = { id: nodeId, type, position: newNodePosition, data: { id: nodeId, type, label: 'Job Type', value: '', options: EMPLOYMENT_TYPES, onChange: updateNodeValue } };
                break;
            case 'tech':
                newNode = { id: nodeId, type, position: newNodePosition, data: { id: nodeId, type, label: 'Tech Stack', value: [], options: allTechTags, onChange: updateNodeValue } };
                break;
            default:
                console.error("Cannot add node of type:", type);
                return; // Don't add source/output manually
        }
        setNodes((nds) => nds.concat(newNode));
    }, [setNodes, allTechTags, updateNodeValue]);

    // Calculate active filters based on the connected graph
    useEffect(() => {
        const activeFilters: ActiveFilters = {
            searchTerm: '',
            experienceLevel: '',
            employmentType: '',
            techStack: [],
        };

        const nodeMap = new Map(nodes.map(n => [n.id, n]));
        const edgeMap = new Map<string, string[]>(); // sourceId -> [targetId, targetId, ...]
        edges.forEach(edge => {
            if (!edgeMap.has(edge.source)) edgeMap.set(edge.source, []);
            edgeMap.get(edge.source)?.push(edge.target);
        });

        let currentNodeId = 'source';
        const visited = new Set<string>(); // Prevent infinite loops in case of cycles (though unlikely here)

        while (currentNodeId && currentNodeId !== 'output' && !visited.has(currentNodeId)) {
            visited.add(currentNodeId);
            const node = nodeMap.get(currentNodeId);
            if (node && node.type !== 'source') { // Apply filter logic for non-source nodes in the path
                 switch (node.data.type) {
                    case 'search':
                        activeFilters.searchTerm = node.data.value || '';
                        break;
                    case 'experience':
                        activeFilters.experienceLevel = node.data.value || '';
                        break;
                    case 'employment':
                        activeFilters.employmentType = node.data.value || '';
                        break;
                    case 'tech':
                        // Ensure it's an array; combine if multiple tech nodes are chained (though less intuitive)
                         activeFilters.techStack = [...new Set([...activeFilters.techStack, ...(node.data.value || [])])];
                         break;
                }
            }

            // Move to the next connected node (assuming only one outgoing connection matters for the filter chain)
            const nextNodeIds = edgeMap.get(currentNodeId);
            currentNodeId = nextNodeIds && nextNodeIds.length > 0 ? nextNodeIds[0] : 'output'; // Take the first connection or jump to output

             // Check if we reached the output node via the connection
            if(currentNodeId === 'output') break;
        }

        // Only trigger update if the path successfully reaches the output node
        if (currentNodeId === 'output' || visited.has('output')) {
             // Check if the *last* node visited before stopping was connected *to* the output node
            let isConnectedToOutput = false;
            const lastVisitedNodeId = Array.from(visited).pop(); // Get the last node processed
            if(lastVisitedNodeId) {
                const outgoingEdges = edgeMap.get(lastVisitedNodeId);
                if (outgoingEdges?.includes('output')) {
                    isConnectedToOutput = true;
                }
            }
             // Also handle direct source -> output connection
            if (!isConnectedToOutput && edgeMap.get('source')?.includes('output')) {
                isConnectedToOutput = true;
            }


             if (isConnectedToOutput) {
                // console.log("Applying Filters:", activeFilters);
                onFilterChange(activeFilters);
             } else {
                 // console.log("Path not connected to output. Applying NO filters.");
                 // Send empty filters if path is broken
                 onFilterChange({ searchTerm: '', experienceLevel: '', employmentType: '', techStack: [] });
             }

        } else {
            // Path doesn't reach output, potentially disconnected graph
            // console.log("Path not connected to output. Applying NO filters.");
            onFilterChange({ searchTerm: '', experienceLevel: '', employmentType: '', techStack: [] });
        }

    }, [nodes, edges, onFilterChange]); // Rerun whenever nodes or edges change

     const onConnect = useCallback(
        (params: Connection | Edge) => setEdges((eds) => addEdge({ ...params, animated: true, style: { strokeWidth: 2 } }, eds)), // Add style to edges
        [setEdges]
    );

     // --- Node Deletion ---
    const store = useStoreApi();
    const { nodeInternals } = store.getState();
    const onDeleteNode = useCallback((nodeId: string) => {
        setNodes((nds) => nds.filter((n) => n.id !== nodeId));
        setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId));
    }, [setNodes, setEdges]);

    // Override onNodesChange to handle delete key
    const handleNodesChange: typeof onNodesChange = useCallback((changes) => {
        changes.forEach(change => {
            if (change.type === 'remove') {
                // Prevent deleting source/output nodes
                if (change.id !== 'source' && change.id !== 'output') {
                    onDeleteNode(change.id);
                }
            }
        });
        // Apply other changes (like position)
        onNodesChange(changes.filter(c => c.type !== 'remove'));
    }, [onDeleteNode, onNodesChange]);

    return (
        <div className="filter-flow-container bg-gray-800 border border-gray-700 rounded-lg shadow-inner relative p-2 h-full">
             <div className="absolute top-2 right-2 z-10 flex gap-2 p-1 bg-gray-900/70 backdrop-blur-sm rounded-md border border-gray-700">
                 <button onClick={() => addFilterNode('search')} title="Add Search Filter" className="filter-add-btn"><FiSearch size={14}/> </button>
                 <button onClick={() => addFilterNode('experience')} title="Add Experience Filter" className="filter-add-btn"><FiUserCheck size={14}/> </button>
                 <button onClick={() => addFilterNode('employment')} title="Add Job Type Filter" className="filter-add-btn"><FiType size={14}/> </button>
                 <button onClick={() => addFilterNode('tech')} title="Add Tech Stack Filter" className="filter-add-btn"><FiTag size={14}/> </button>
            </div>
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={handleNodesChange} // Use custom handler for delete
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                nodeTypes={filterNodeTypes}
                fitView
                fitViewOptions={{ padding: 0.2 }}
                minZoom={0.3}
                maxZoom={1.5}
                className="bg-gradient-to-br from-gray-800 to-gray-850"
                proOptions={{ hideAttribution: true }}
            >
                <Background color="#555" gap={20} size={1} />
                {/* <Controls showInteractive={false} /> */}
                {/* Optional: Add MiniMap if space allows */}
                {/* <MiniMap nodeStrokeWidth={2} pannable zoomable className="!bg-gray-700 border border-gray-600"/> */}
            </ReactFlow>
        </div>
    );
}


// --- Job Node Component (Keep as before, maybe slightly smaller) ---
const JobNode: React.FC<NodeProps<Job>> = ({ data }) => {
  return (
    <div className="react-flow__node-default bg-gray-800 border border-indigo-600 rounded-lg p-3 shadow-md w-64 text-sm text-white transition-all duration-150 hover:shadow-indigo-500/30 hover:border-indigo-500">
      <h3 className="text-base font-semibold text-indigo-300 mb-1 truncate" title={data.title}>
        {data.title}
      </h3>
      <p className="text-gray-400 mb-1 flex items-center gap-1.5 text-xs">
        <FiBriefcase className="flex-shrink-0" />
        <span className="truncate" title={data.company}>{data.company}</span>
      </p>
      <p className="text-gray-400 mb-2 flex items-center gap-1.5 text-xs">
        <FiMapPin className="flex-shrink-0" />
        <span className="truncate" title={data.location}>{data.location}</span>
      </p>
      <div className="flex flex-wrap gap-1 mb-2">
        {data.techStack.slice(0, 3).map(tech => (
          <span key={tech} className="bg-gray-700 text-indigo-300 text-[11px] px-2 py-0.5 rounded-full">
            {tech}
          </span>
        ))}
        {data.techStack.length > 3 && (
          <span className="text-gray-500 text-[11px] py-0.5" title={data.techStack.slice(3).join(', ')}>
            +{data.techStack.length - 3} more
          </span>
        )}
      </div>
      <Link
        href={`/jobs/${data._id}`}
        className="text-indigo-400 hover:text-indigo-300 text-xs font-medium flex items-center gap-1 justify-end mt-1 group"
        target="_blank"
        rel="noopener noreferrer"
      >
        View Details <FiExternalLink className="group-hover:translate-x-0.5 transition-transform" />
      </Link>
    </div>
  );
};

const jobNodeTypes = { jobNode: JobNode };

// --- Job Display Flow Component ---
interface JobDisplayFlowProps {
    jobs: Job[];
}

function JobDisplayFlow({ jobs }: JobDisplayFlowProps) {
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]); // Keep edges if you plan connections later
    const { fitView } = useReactFlow();

    useEffect(() => {
        const columns = 4;
        const nodeWidth = 300;
        const nodeHeight = 190; // Slightly reduced height

        const newNodes: Node<Job>[] = jobs.map((job, index) => ({
            id: job._id,
            type: 'jobNode',
            data: job,
            position: {
                x: (index % columns) * nodeWidth,
                y: Math.floor(index / columns) * nodeHeight,
            },
        }));
        setNodes(newNodes);

        // Refit view smoothly
        const timer = setTimeout(() => {
            fitView({ padding: 0.1, duration: 400 });
        }, 150); // Delay slightly more for potentially larger layout shifts

        return () => clearTimeout(timer);

    }, [jobs, setNodes, fitView]);

    const onConnect = useCallback(
        (params: Connection | Edge) => setEdges((eds) => addEdge(params, eds)),
        [setEdges]
    );

    return (
        <div className="flex-grow bg-gray-900 rounded-lg border border-gray-700 overflow-hidden relative shadow-inner h-full">
            {jobs.length > 0 ? (
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onConnect={onConnect}
                    nodeTypes={jobNodeTypes}
                    minZoom={0.1}
                    className="bg-gradient-to-br from-gray-900 to-black"
                    proOptions={{ hideAttribution: true }}
                >
                    <Controls className="react-flow__controls-bg" />
                    <MiniMap nodeStrokeWidth={3} pannable zoomable className="react-flow__minimap-bg"/>
                    <Background color="#404040" gap={20} size={1} />
                </ReactFlow>
            ) : (
                 <div className="absolute inset-0 flex items-center justify-center p-4">
                    <div className="bg-gray-800 p-6 md:p-8 text-center rounded-lg border border-gray-700 shadow-xl max-w-md">
                    <FiFilter className="text-5xl text-indigo-500 mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-semibold text-white mb-2">No Matching Jobs Found</h3>
                    <p className="text-gray-400 mb-5 text-sm">
                        Check your filter connections or adjust the filter criteria. Make sure the path connects 'All Jobs' to 'Filtered Jobs'.
                    </p>
                    {/* Maybe add a button to reset filter graph? */}
                    </div>
                </div>
            )}
             {/* Display Job Count */}
             <div className="absolute bottom-4 left-4 bg-gray-800/80 backdrop-blur-sm text-xs text-gray-300 px-3 py-1 rounded-full border border-gray-700 shadow z-10">
                {jobs.length} {jobs.length === 1 ? 'Job' : 'Jobs'} Found
             </div>
        </div>
    );
}


// --- Main Page Component ---
export default function JobsDashboardPage() {
    const [allJobs, setAllJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(true);
    const [allTechTags, setAllTechTags] = useState<string[]>([]);
    const [activeFilters, setActiveFilters] = useState<ActiveFilters>({
        searchTerm: '', experienceLevel: '', employmentType: '', techStack: [],
    });

    // Fetch initial raw jobs
    useEffect(() => {
        const fetchJobs = async () => {
            setLoading(true);
            try {
                const response = await fetch('/api/jobs/public');
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                const data: Job[] = await response.json();
                const openJobs = data.filter(job => job.status === 'Open')
                                     .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                setAllJobs(openJobs);
                const uniqueTags = Array.from(new Set(data.flatMap(job => job.techStack))).sort();
                setAllTechTags(uniqueTags);
            } catch (error) {
                console.error('Error fetching jobs:', error);
                toast.error(`Failed to load jobs: ${error instanceof Error ? error.message : 'Unknown error'}`);
            } finally {
                setLoading(false);
            }
        };
        fetchJobs();
    }, []);

    // Memoized filtered jobs based on activeFilters from the Filter Flow
    const filteredJobs = useMemo(() => {
        // console.log("Filtering with:", activeFilters); // Debugging
        return allJobs.filter(job => {
            const lowerSearchTerm = activeFilters.searchTerm.toLowerCase();

            if (activeFilters.searchTerm &&
                !job.title.toLowerCase().includes(lowerSearchTerm) &&
                !job.company.toLowerCase().includes(lowerSearchTerm) &&
                !job.description.toLowerCase().includes(lowerSearchTerm) &&
                !job.location.toLowerCase().includes(lowerSearchTerm)) {
                return false;
            }
            if (activeFilters.techStack.length > 0 &&
                !activeFilters.techStack.every(filterTech => job.techStack.includes(filterTech))) {
                return false;
            }
            if (activeFilters.experienceLevel && job.experienceLevel !== activeFilters.experienceLevel) {
                return false;
            }
            if (activeFilters.employmentType && job.employmentType !== activeFilters.employmentType) {
                return false;
            }
            return true;
        });
    }, [allJobs, activeFilters]);

    // Callback for the Filter Flow to update the active filters
    const handleFilterChange = useCallback((newFilters: ActiveFilters) => {
        // Use shallow comparison to avoid unnecessary re-renders if filters object is structurally the same
        setActiveFilters(prevFilters => shallow(prevFilters, newFilters) ? prevFilters : newFilters);
    }, []);


    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen text-gray-400">
                <FiLoader className="animate-spin text-4xl mr-3 text-indigo-500" />
                Loading Job Data...
            </div>
        );
    }

    return (
        // Use CSS Grid for layout: Fixed height filter area + flexible job display area
        <div className="flex flex-col h-screen bg-gray-900 text-white p-4 gap-4">
            <h1 className="text-2xl font-bold text-center text-indigo-400 flex-shrink-0">
                Job Dashboard <span className="text-lg font-normal text-gray-400">(Visual Filter Builder)</span>
            </h1>

             {/* Filter Flow Area (Fixed Height) */}
             <div className="filter-section flex-shrink-0 h-[250px] md:h-[200px]"> {/* Adjust height as needed */}
                 <ReactFlowProvider>
                     <FilterBuilderFlow allTechTags={allTechTags} onFilterChange={handleFilterChange} />
                 </ReactFlowProvider>
             </div>

             {/* Job Display Area (Takes Remaining Space) */}
             <div className="job-display-section flex-grow min-h-0"> {/* min-h-0 is crucial for flex-grow in flex-col */}
                 <ReactFlowProvider>
                     <JobDisplayFlow jobs={filteredJobs} />
                 </ReactFlowProvider>
             </div>
        </div>
    );
}
import { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import api from '../services/api';

interface Agent {
    id: string;
    name: string;
    systemPrompt: string;
    llmProvider: string;
    llmModel: string;
    knowledgeBases: KnowledgeBase[];
}

interface KnowledgeBase {
    id: string;
    fileName: string;
    status: string;
    chunkCount: number;
}

interface ChatMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
    toolCalls?: any[];
    toolResults?: any[];
}

interface Action {
    id: string;
    name: string;
    descriptionForLlm: string;
}

export default function AgentConfigPage() {
    const [agents, setAgents] = useState<Agent[]>([]);
    const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [uploadProgress, setUploadProgress] = useState<number>(0);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadStatus, setUploadStatus] = useState<string>('');

    // Chat state
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
    const [chatInput, setChatInput] = useState('');
    const [isChatLoading, setIsChatLoading] = useState(false);
    const [chatError, setChatError] = useState<string>('');

    // Actions state
    const [availableActions, setAvailableActions] = useState<Action[]>([]);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [_agentActions, setAgentActions] = useState<Action[]>([]);

    // Form state
    const [name, setName] = useState('');
    const [systemPrompt, setSystemPrompt] = useState('');
    const [llmProvider, setLlmProvider] = useState('openai');
    const [llmModel, setLlmModel] = useState('gpt-4');
    const [apiKey, setApiKey] = useState('');

    useEffect(() => {
        loadAgents();
    }, []);

    const loadAgents = async () => {
        try {
            const response = await api.get('/agents');
            setAgents(response.data);
        } catch (error) {
            console.error('Error loading agents:', error);
        }
    };

    const handleCreateAgent = async () => {
        try {
            await api.post('/agents', {
                name,
                systemPrompt,
                llmProvider,
                llmModel,
                apiKey
            });

            setIsCreating(false);
            resetForm();
            loadAgents();
        } catch (error: any) {
            alert('Error creating agent: ' + error.message);
        }
    };

    const handleEditAgent = (agent: Agent) => {
        setEditingAgent(agent);
        setIsEditing(true);
        setIsCreating(true);
        // Pre-populate form
        setName(agent.name);
        setSystemPrompt(agent.systemPrompt);
        setLlmProvider(agent.llmProvider);
        setLlmModel(agent.llmModel);
        setApiKey(''); // Don't show existing API key for security
    };

    const handleUpdateAgent = async () => {
        if (!editingAgent) return;

        try {
            await api.put(`/agents/${editingAgent.id}`, {
                name,
                systemPrompt,
                llmProvider,
                llmModel,
                ...(apiKey && { apiKey }) // Only include apiKey if provided
            });

            setIsCreating(false);
            setIsEditing(false);
            setEditingAgent(null);
            resetForm();
            loadAgents();
        } catch (error: any) {
            alert('Error updating agent: ' + error.message);
        }
    };

    const handleDeleteAgent = async (agentId: string) => {
        if (!confirm('Are you sure you want to delete this agent? This action cannot be undone.')) {
            return;
        }

        try {
            await api.delete(`/agents/${agentId}`);

            // Clear selection if deleted agent was selected
            if (selectedAgent?.id === agentId) {
                setSelectedAgent(null);
            }

            loadAgents();
        } catch (error: any) {
            alert('Error deleting agent: ' + error.message);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!selectedAgent) {
            alert('Please select an agent first');
            return;
        }

        if (!e.target.files?.[0]) {
            return;
        }

        if (!selectedAgent.id) {
            alert('Selected agent has no ID');
            return;
        }

        const formData = new FormData();
        formData.append('file', e.target.files[0]);

        try {
            setIsUploading(true);
            setUploadProgress(0);
            setUploadStatus('Uploading file...');

            console.log('Uploading to:', `/kb/${selectedAgent.id}/upload`);

            // Simulate upload progress
            setUploadProgress(30);

            const response = await api.post(`/kb/${selectedAgent.id}/upload`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            console.log('Upload response:', response.data);

            setUploadProgress(50);
            setUploadStatus('Processing file and generating embeddings...');

            // Build embeddings
            await api.post(`/kb/${response.data.id}/build-embeddings`, {
                embeddingProvider: 'openai',
                embeddingModel: 'text-embedding-3-small'
            });

            setUploadProgress(100);
            setUploadStatus('Complete!');

            setTimeout(() => {
                setIsUploading(false);
                setUploadProgress(0);
                setUploadStatus('');
            }, 1500);

            loadAgents();
        } catch (error: any) {
            console.error('Upload error:', error);
            const errorMsg = error.response?.data?.error || error.message;
            alert('Error uploading file: ' + errorMsg);
            setIsUploading(false);
            setUploadProgress(0);
            setUploadStatus('');
        }

        // Reset file input
        e.target.value = '';
    };

    const handleSearch = async () => {
        if (!selectedAgent || !searchQuery) return;

        try {
            const response = await api.post(`/kb/${selectedAgent.id}/search`, {
                query: searchQuery,
                topK: 5
            });
            setSearchResults(response.data);
        } catch (error: any) {
            alert('Error searching: ' + error.message);
        }
    };

    const handleDeleteKB = async (kbId: string) => {
        if (!confirm('Are you sure you want to delete this knowledge base? This action cannot be undone.')) {
            return;
        }

        try {
            await api.delete(`/kb/${kbId}`);
            alert('Knowledge base deleted successfully!');
            loadAgents();
        } catch (error: any) {
            alert('Error deleting knowledge base: ' + error.message);
        }
    };

    const resetForm = () => {
        setName('');
        setSystemPrompt('');
        setLlmProvider('openai');
        setLlmModel('gpt-4');
        setApiKey('');
        setIsEditing(false);
        setEditingAgent(null);
    };

    const handleSendMessage = async () => {
        if (!selectedAgent || !chatInput.trim()) return;

        const userMessage: ChatMessage = {
            role: 'user',
            content: chatInput.trim()
        };

        // Add user message to chat
        const updatedMessages = [...chatMessages, userMessage];
        setChatMessages(updatedMessages);
        setChatInput('');
        setIsChatLoading(true);
        setChatError('');

        try {
            const response = await api.post(`/agents/${selectedAgent.id}/chat`, {
                messages: updatedMessages
            });

            // Add assistant response
            setChatMessages([...updatedMessages, response.data]);
        } catch (error: any) {
            setChatError(error.response?.data?.error || error.message || 'Failed to send message');
        } finally {
            setIsChatLoading(false);
        }
    };

    const handleClearChat = () => {
        setChatMessages([]);
        setChatError('');
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const loadActions = async () => {
        try {
            const response = await api.get('/actions');
            setAvailableActions(response.data);
        } catch (error) {
            console.error('Error loading actions:', error);
        }
    };

    const loadAgentActions = async (_agentId: string) => {
        try {
            // Get all actions attached to this agent
            // const response = await api.get(`/actions`);
            // const allActions = response.data;
            await api.get(`/actions`); // Placeholder call

            // Filter to only show actions attached to this agent
            // Note: This is a simplified version. In production, you'd have a dedicated endpoint
            // For now, we'll load all actions and let the user attach/detach
            setAgentActions([]);
        } catch (error) {
            console.error('Error loading agent actions:', error);
        }
    };

    const handleAttachAction = async (actionId: string) => {
        if (!selectedAgent) return;

        try {
            await api.post(`/agents/${selectedAgent.id}/actions`, { actionId });
            alert('Action attached successfully!');
            loadAgentActions(selectedAgent.id);
        } catch (error: any) {
            alert('Error attaching action: ' + (error.response?.data?.error || error.message));
        }
    };

    /*
    const handleDetachAction = async (actionId: string) => {
        if (!selectedAgent) return;

        if (!confirm('Are you sure you want to detach this action from the agent?')) {
            return;
        }

        try {
            await api.delete(`/agents/${selectedAgent.id}/actions/${actionId}`);
            alert('Action detached successfully!');
            loadAgentActions(selectedAgent.id);
        } catch (error: any) {
            alert('Error detaching action: ' + (error.response?.data?.error || error.message));
        }
    };
    */

    // Load actions when component mounts
    useEffect(() => {
        loadActions();
    }, []);

    // Load agent actions when agent is selected
    useEffect(() => {
        if (selectedAgent) {
            loadAgentActions(selectedAgent.id);
        }
    }, [selectedAgent]);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-mono font-bold text-white">&gt; AGENT_CONFIGURATION</h2>
                <button
                    onClick={() => setIsCreating(true)}
                    className="btn-primary font-mono"
                >
                    [+ NEW_AGENT]
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Agent List */}
                <div className="card">
                    <h3 className="text-xl font-mono font-semibold mb-4 text-white">// YOUR_AGENTS</h3>
                    <div className="space-y-2">
                        {agents.map(agent => (
                            <div
                                key={agent.id}
                                className={`flex items-center gap-2 p-3 border-2 transition-colors ${selectedAgent?.id === agent.id
                                    ? 'bg-white text-black border-white'
                                    : 'bg-black text-white border-white hover:bg-gray-900'
                                    }`}
                            >
                                <button
                                    onClick={() => setSelectedAgent(agent)}
                                    className="flex-1 text-left font-mono min-w-0"
                                >
                                    <div className="font-medium truncate">&gt; {agent.name}</div>
                                    <div className="text-sm opacity-75 truncate">
                                        [{agent.llmProvider}] [{agent.llmModel}]
                                    </div>
                                </button>
                                <div className="flex gap-2 flex-shrink-0">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleEditAgent(agent);
                                        }}
                                        className="text-xs px-2 py-1 border-2 border-white hover:bg-white hover:text-black transition-colors font-mono whitespace-nowrap"
                                    >
                                        [EDIT]
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteAgent(agent.id);
                                        }}
                                        className="text-xs px-2 py-1 border-2 border-red-500 text-red-500 hover:bg-red-500 hover:text-white transition-colors font-mono whitespace-nowrap"
                                    >
                                        [DEL]
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Agent Details */}
                <div className="lg:col-span-2 space-y-6">
                    {isCreating ? (
                        <div className="card">
                            <h3 className="text-xl font-mono font-semibold mb-4 text-white">
                                // {isEditing ? 'EDIT_AGENT' : 'CREATE_NEW_AGENT'}
                            </h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-mono font-medium mb-2 text-white">AGENT_NAME:</label>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="input-field"
                                        placeholder="my_ai_agent"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-mono font-medium mb-2 text-white">SYSTEM_PROMPT:</label>
                                    <Editor
                                        height="200px"
                                        defaultLanguage="markdown"
                                        value={systemPrompt}
                                        onChange={(value) => setSystemPrompt(value || '')}
                                        theme="vs-dark"
                                        options={{
                                            minimap: { enabled: false },
                                            fontSize: 14,
                                        }}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-mono font-medium mb-2 text-white">LLM_PROVIDER:</label>
                                        <select
                                            value={llmProvider}
                                            onChange={(e) => {
                                                const newProvider = e.target.value;
                                                setLlmProvider(newProvider);
                                                // Reset model when provider changes
                                                if (newProvider === 'openai') {
                                                    setLlmModel('gpt-4');
                                                } else if (newProvider === 'google') {
                                                    setLlmModel('gemini-2.5-flash');
                                                }
                                            }}
                                            className="input-field"
                                        >
                                            <option value="openai">OpenAI</option>
                                            <option value="google">Google Gemini</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-mono font-medium mb-2 text-white">MODEL:</label>
                                        <select
                                            value={llmModel}
                                            onChange={(e) => setLlmModel(e.target.value)}
                                            className="input-field"
                                        >
                                            {llmProvider === 'openai' ? (
                                                <>
                                                    <option value="gpt-4">GPT-4</option>
                                                    <option value="gpt-4-turbo">GPT-4 Turbo</option>
                                                    <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                                                </>
                                            ) : (
                                                <>
                                                    <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
                                                    <option value="gemini-pro">Gemini Pro</option>
                                                    <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
                                                    <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
                                                    <option value="gemini-2.0-flash-exp">Gemini 2.0 Flash (Experimental)</option>
                                                </>
                                            )}
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-mono font-medium mb-2 text-white">
                                        API_KEY: {isEditing && <span className="text-gray-400 text-xs">(leave blank to keep existing)</span>}
                                    </label>
                                    <input
                                        type="password"
                                        value={apiKey}
                                        onChange={(e) => setApiKey(e.target.value)}
                                        className="input-field"
                                        placeholder={isEditing ? "Enter new key or leave blank" : "sk-..."}
                                    />
                                </div>

                                <div className="flex space-x-3">
                                    <button
                                        onClick={isEditing ? handleUpdateAgent : handleCreateAgent}
                                        className="btn-primary font-mono"
                                    >
                                        [{isEditing ? 'UPDATE' : 'CREATE'}]
                                    </button>
                                    <button
                                        onClick={() => {
                                            setIsCreating(false);
                                            resetForm();
                                        }}
                                        className="btn-secondary font-mono"
                                    >
                                        [CANCEL]
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : selectedAgent ? (
                        <>
                            {/* Test Agent Section */}
                            <div className="card">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-xl font-mono font-semibold text-white">// TEST_AGENT</h3>
                                    <button
                                        onClick={handleClearChat}
                                        className="text-xs px-3 py-1 border-2 border-white hover:bg-white hover:text-black transition-colors font-mono"
                                    >
                                        [CLEAR_CHAT]
                                    </button>
                                </div>

                                {/* Chat Messages */}
                                <div className="mb-4 h-96 overflow-y-auto bg-black border-2 border-white p-4 space-y-3">
                                    {chatMessages.length === 0 ? (
                                        <div className="text-center text-gray-400 font-mono text-sm mt-8">
                                            // START_CONVERSATION_WITH_YOUR_AGENT
                                        </div>
                                    ) : (
                                        chatMessages.map((msg, idx) => (
                                            <div
                                                key={idx}
                                                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                            >
                                                <div
                                                    className={`max-w-[80%] p-3 border-2 font-mono text-sm ${msg.role === 'user'
                                                        ? 'bg-white text-black border-white'
                                                        : 'bg-gray-900 text-white border-gray-600'
                                                        }`}
                                                >
                                                    <div className="text-xs opacity-60 mb-1">
                                                        [{msg.role.toUpperCase()}]
                                                    </div>
                                                    <div className="whitespace-pre-wrap break-words">
                                                        {msg.content}
                                                    </div>

                                                    {/* Tool calls and results hidden for cleaner UX */}
                                                    {/* Uncomment below to show action execution details
                                                    {msg.toolCalls && msg.toolCalls.length > 0 && (
                                                        <div className="mt-2 pt-2 border-t border-gray-600">
                                                            <div className="text-xs opacity-75 mb-1">
                                                                // ACTIONS_EXECUTED:
                                                            </div>
                                                            {msg.toolCalls.map((call: any, callIdx: number) => (
                                                                <div key={callIdx} className="text-xs bg-black p-2 border border-gray-700">
                                                                    <div className="text-green-400">&gt; {call.tool}</div>
                                                                    <pre className="text-gray-400 mt-1">
                                                                        {JSON.stringify(call.inputs, null, 2)}
                                                                    </pre>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                    */}
                                                    {/* Uncomment below to show action results
                                                    {msg.toolResults && msg.toolResults.length > 0 && (
                                                        <div className="mt-2 pt-2 border-t border-gray-600">
                                                            <div className="text-xs opacity-75 mb-1">
                                                                // ACTION_RESULTS:
                                                            </div>
                                                            {msg.toolResults.map((result: any, resultIdx: number) => (
                                                                <div key={resultIdx} className="text-xs bg-black p-2 border border-gray-700">
                                                                    <pre className="text-blue-400 whitespace-pre-wrap">
                                                                        {JSON.stringify(result, null, 2)}
                                                                    </pre>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                    */}
                                                </div>
                                            </div>
                                        ))
                                    )}

                                    {/* Loading indicator */}
                                    {isChatLoading && (
                                        <div className="flex justify-start">
                                            <div className="bg-gray-900 text-white border-2 border-gray-600 p-3 font-mono text-sm">
                                                <div className="text-xs opacity-60 mb-1">[ASSISTANT]</div>
                                                <div className="flex items-center space-x-2">
                                                    <div className="animate-pulse">...</div>
                                                    <span>thinking</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Error display */}
                                {chatError && (
                                    <div className="mb-4 p-3 bg-red-900 border-2 border-red-500 text-red-200 font-mono text-sm">
                                        // ERROR: {chatError}
                                    </div>
                                )}

                                {/* Input area */}
                                <div className="flex space-x-2">
                                    <input
                                        type="text"
                                        value={chatInput}
                                        onChange={(e) => setChatInput(e.target.value)}
                                        onKeyPress={handleKeyPress}
                                        className="input-field flex-1"
                                        placeholder="Type your message..."
                                        disabled={isChatLoading}
                                    />
                                    <button
                                        onClick={handleSendMessage}
                                        disabled={isChatLoading || !chatInput.trim()}
                                        className="btn-primary font-mono disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        [SEND]
                                    </button>
                                </div>
                            </div>

                            {/* Agent Actions Section */}
                            <div className="card">
                                <h3 className="text-xl font-mono font-semibold mb-4 text-white">// AGENT_ACTIONS</h3>
                                <p className="text-sm text-gray-400 font-mono mb-4">
                                    Attach actions to enable your agent to call external APIs
                                </p>

                                {availableActions.length === 0 ? (
                                    <div className="text-center text-gray-400 font-mono p-4">
                                        No actions available. Create actions in the Actions page first.
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {availableActions.map(action => (
                                            <div
                                                key={action.id}
                                                className="flex items-center justify-between p-3 bg-black border-2 border-white"
                                            >
                                                <div className="flex-1 font-mono">
                                                    <div className="font-medium text-white">&gt; {action.name}</div>
                                                    <div className="text-sm text-gray-400 mt-1">
                                                        {action.descriptionForLlm}
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => handleAttachAction(action.id)}
                                                    className="btn-primary font-mono ml-4"
                                                >
                                                    [ATTACH]
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Knowledge Base Section */}
                            <div className="card">
                                <h3 className="text-xl font-mono font-semibold mb-4 text-white">// KNOWLEDGE_BASE</h3>

                                <div className="mb-4">
                                    <label className="btn-secondary cursor-pointer font-mono">
                                        [UPLOAD_FILE]
                                        <input
                                            type="file"
                                            onChange={handleFileUpload}
                                            className="hidden"
                                            accept=".pdf,.docx,.txt,.csv,.json"
                                            disabled={isUploading}
                                        />
                                    </label>
                                </div>

                                {/* Progress Bar */}
                                {isUploading && (
                                    <div className="mb-4 p-4 bg-black border-2 border-white">
                                        <div className="mb-2 font-mono text-sm text-white">
                                            {uploadStatus}
                                        </div>
                                        <div className="w-full bg-gray-800 border-2 border-white h-6">
                                            <div
                                                className="bg-white h-full transition-all duration-300 flex items-center justify-center font-mono text-xs text-black font-bold"
                                                style={{ width: `${uploadProgress}%` }}
                                            >
                                                {uploadProgress > 10 && `${uploadProgress}%`}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-2">
                                    {selectedAgent.knowledgeBases?.map(kb => (
                                        <div
                                            key={kb.id}
                                            className="flex items-center justify-between p-3 bg-black border-2 border-white"
                                        >
                                            <div className="flex items-center space-x-3">
                                                <div className="font-mono">
                                                    <div className="font-medium text-white">&gt; {kb.fileName}</div>
                                                    <div className="text-sm text-gray-400">
                                                        [{kb.status}] [{kb.chunkCount} chunks]
                                                    </div>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleDeleteKB(kb.id)}
                                                className="text-white hover:text-gray-400 font-mono border-2 border-white px-2 py-1"
                                            >
                                                [X]
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="card">
                                <h3 className="text-xl font-mono font-semibold mb-4 text-white">// TEST_KNOWLEDGE_BASE</h3>

                                <div className="flex space-x-2 mb-4">
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="input-field flex-1"
                                        placeholder="search_query..."
                                    />
                                    <button onClick={handleSearch} className="btn-primary font-mono">
                                        [SEARCH]
                                    </button>
                                </div>

                                <div className="space-y-2">
                                    {searchResults.map((result, idx) => (
                                        <div key={idx} className="p-3 bg-black border-2 border-white">
                                            <div className="text-sm text-gray-400 mb-1 font-mono">
                                                // SCORE: {result.score.toFixed(3)}
                                            </div>
                                            <div className="text-sm font-mono text-white">{result.text}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="card text-center text-gray-400">
                            <p className="font-mono">// SELECT_AN_AGENT_OR_CREATE_NEW</p>
                        </div>
                    )}
                </div >
            </div >
        </div >
    );
}

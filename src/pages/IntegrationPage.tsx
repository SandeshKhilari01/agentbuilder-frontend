import { useState, useEffect } from 'react';
import api from '../services/api';

interface Integration {
    id: string;
    name: string;
    description: string;
    method: string;
    url: string;
    authEnabled: boolean;
    authConfig: any;
}

export default function IntegrationPage() {
    const [integrations, setIntegrations] = useState<Integration[]>([]);
    const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editingIntegration, setEditingIntegration] = useState<Integration | null>(null);
    const [testResult, setTestResult] = useState<any>(null);
    const [testBody, setTestBody] = useState('{}');

    // Form state
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [method, setMethod] = useState('GET');
    const [url, setUrl] = useState('');
    const [authEnabled, setAuthEnabled] = useState(false);
    const [authType, setAuthType] = useState('header');
    const [authKey, setAuthKey] = useState('');
    const [authValue, setAuthValue] = useState('');

    useEffect(() => {
        loadIntegrations();
    }, []);

    const loadIntegrations = async () => {
        try {
            const response = await api.get('/integrations');
            setIntegrations(response.data);
        } catch (error) {
            console.error('Error loading integrations:', error);
        }
    };

    const handleCreate = async () => {
        try {
            const authConfig = authEnabled ? [{
                type: authType,
                key: authKey,
                value: authValue,
                secret: authKey.toLowerCase().includes('authorization')
            }] : null;

            await api.post('/integrations', {
                name,
                description,
                method,
                url,
                authEnabled,
                authConfig,
                defaultHeaders: { 'Accept': 'application/json' },
                defaultParams: {}
            });

            setIsCreating(false);
            resetForm();
            loadIntegrations();
        } catch (error: any) {
            alert('Error creating integration: ' + error.message);
        }
    };

    const handleEdit = (integration: Integration) => {
        setEditingIntegration(integration);
        setIsEditing(true);
        setIsCreating(true);
        // Pre-populate form
        setName(integration.name);
        setDescription(integration.description);
        setMethod(integration.method);
        setUrl(integration.url);
        setAuthEnabled(integration.authEnabled);
        if (integration.authConfig && integration.authConfig.length > 0) {
            setAuthType(integration.authConfig[0].type);
            setAuthKey(integration.authConfig[0].key);
            setAuthValue(integration.authConfig[0].value);
        }
    };

    const handleUpdate = async () => {
        if (!editingIntegration) return;

        try {
            const authConfig = authEnabled ? [{
                type: authType,
                key: authKey,
                value: authValue,
                secret: authKey.toLowerCase().includes('authorization')
            }] : null;

            await api.put(`/integrations/${editingIntegration.id}`, {
                name,
                description,
                method,
                url,
                authEnabled,
                authConfig,
                defaultHeaders: { 'Accept': 'application/json' },
                defaultParams: {}
            });

            setIsCreating(false);
            setIsEditing(false);
            setEditingIntegration(null);
            resetForm();
            loadIntegrations();
        } catch (error: any) {
            alert('Error updating integration: ' + error.message);
        }
    };

    const handleTest = async () => {
        if (!selectedIntegration) return;

        try {
            let testInputs = {};
            // Parse test body if provided for POST/PUT requests
            if ((selectedIntegration.method === 'POST' || selectedIntegration.method === 'PUT') && testBody.trim()) {
                try {
                    testInputs = JSON.parse(testBody);
                } catch (e) {
                    alert('Invalid JSON in test body');
                    return;
                }
            }

            const response = await api.post(`/integrations/${selectedIntegration.id}/test`, {
                testInputs
            });
            setTestResult(response.data);
        } catch (error: any) {
            setTestResult({
                error: error.response?.data?.error || error.message,
                status: error.response?.status
            });
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this integration?')) return;

        try {
            await api.delete(`/integrations/${id}`);
            loadIntegrations();
            setSelectedIntegration(null);
        } catch (error: any) {
            alert('Error deleting integration: ' + error.message);
        }
    };

    const resetForm = () => {
        setName('');
        setDescription('');
        setMethod('GET');
        setUrl('');
        setAuthEnabled(false);
        setAuthType('header');
        setAuthKey('');
        setAuthValue('');
        setIsEditing(false);
        setEditingIntegration(null);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-mono font-bold text-white">&gt; REST_API_INTEGRATIONS</h2>
                <button
                    onClick={() => setIsCreating(true)}
                    className="btn-primary font-mono"
                >
                    [+ NEW_INTEGRATION]
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Integration List */}
                <div className="card">
                    <h3 className="text-xl font-mono font-semibold mb-4 text-white">// INTEGRATIONS</h3>
                    <div className="space-y-2">
                        {integrations.map(integration => (
                            <div
                                key={integration.id}
                                className={`p-3 border-2 transition-colors font-mono ${selectedIntegration?.id === integration.id
                                    ? 'bg-white text-black border-white'
                                    : 'bg-black text-white border-white hover:bg-gray-900'
                                    }`}
                            >
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setSelectedIntegration(integration)}
                                        className="flex-1 text-left min-w-0"
                                    >
                                        <div className="font-medium truncate">&gt; {integration.name}</div>
                                        <div className="text-sm opacity-75 truncate">
                                            [{integration.method}] {integration.url.substring(0, 30)}...
                                        </div>
                                    </button>
                                    <div className="flex gap-2 flex-shrink-0">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleEdit(integration);
                                            }}
                                            className="text-xs px-2 py-1 border-2 border-white hover:bg-white hover:text-black transition-colors font-mono whitespace-nowrap"
                                        >
                                            [EDIT]
                                        </button>
                                        <button
                                            onClick={() => handleDelete(integration.id)}
                                            className="text-xs px-2 py-1 border-2 border-red-500 text-red-500 hover:bg-red-500 hover:text-white transition-colors font-mono whitespace-nowrap"
                                        >
                                            [DEL]
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Integration Details */}
                <div className="lg:col-span-2 space-y-6">
                    {isCreating ? (
                        <div className="card">
                            <h3 className="text-xl font-mono font-semibold mb-4 text-white">
                                // {isEditing ? 'EDIT_INTEGRATION' : 'CREATE_INTEGRATION'}
                            </h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-mono font-medium mb-2 text-white">NAME:</label>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="input-field"
                                        placeholder="get_user"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-mono font-medium mb-2 text-white">DESCRIPTION:</label>
                                    <input
                                        type="text"
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        className="input-field"
                                        placeholder="Fetch user by ID"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-mono font-medium mb-2 text-white">METHOD:</label>
                                        <select
                                            value={method}
                                            onChange={(e) => setMethod(e.target.value)}
                                            className="input-field"
                                        >
                                            <option value="GET">GET</option>
                                            <option value="POST">POST</option>
                                            <option value="PUT">PUT</option>
                                            <option value="DELETE">DELETE</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-mono font-medium mb-2 text-white">
                                        URL (use {'{variable}'} for params):
                                    </label>
                                    <input
                                        type="text"
                                        value={url}
                                        onChange={(e) => setUrl(e.target.value)}
                                        className="input-field"
                                        placeholder="https://api.example.com/users/{user_id}"
                                    />
                                </div>

                                <div>
                                    <label className="flex items-center space-x-2">
                                        <input
                                            type="checkbox"
                                            checked={authEnabled}
                                            onChange={(e) => setAuthEnabled(e.target.checked)}
                                            className="border-2 border-white"
                                        />
                                        <span className="text-sm font-mono font-medium text-white">ENABLE_AUTHENTICATION</span>
                                    </label>
                                </div>

                                {authEnabled && (
                                    <div className="space-y-3 p-4 bg-black border-2 border-white">
                                        <div className="grid grid-cols-3 gap-3">
                                            <div>
                                                <label className="block text-sm font-mono font-medium mb-2 text-white">TYPE:</label>
                                                <select
                                                    value={authType}
                                                    onChange={(e) => setAuthType(e.target.value)}
                                                    className="input-field"
                                                >
                                                    <option value="header">Header</option>
                                                    <option value="query">Query Param</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-mono font-medium mb-2 text-white">KEY:</label>
                                                <input
                                                    type="text"
                                                    value={authKey}
                                                    onChange={(e) => setAuthKey(e.target.value)}
                                                    className="input-field"
                                                    placeholder="Authorization"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-mono font-medium mb-2 text-white">VALUE:</label>
                                                <input
                                                    type="text"
                                                    value={authValue}
                                                    onChange={(e) => setAuthValue(e.target.value)}
                                                    className="input-field"
                                                    placeholder="Bearer {{API_KEY}}"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="flex space-x-3">
                                    <button
                                        onClick={isEditing ? handleUpdate : handleCreate}
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
                    ) : selectedIntegration ? (
                        <>
                            <div className="card">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-xl font-mono font-semibold text-white">&gt; {selectedIntegration.name}</h3>
                                    <button onClick={handleTest} className="btn-primary font-mono">
                                        [TEST]
                                    </button>
                                </div>

                                <div className="space-y-3">
                                    <div>
                                        <div className="text-sm text-gray-400 font-mono">// METHOD:</div>
                                        <div className="font-mono bg-black border-2 border-white px-3 py-2">
                                            {selectedIntegration.method}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-sm text-gray-400 font-mono">// URL:</div>
                                        <div className="font-mono bg-black border-2 border-white px-3 py-2 break-all">
                                            {selectedIntegration.url}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-sm text-gray-400 font-mono">// AUTHENTICATION:</div>
                                        <div className="font-mono bg-black border-2 border-white px-3 py-2">
                                            {selectedIntegration.authEnabled ? 'Enabled' : 'Disabled'}
                                        </div>
                                    </div>

                                    {/* Test Body for POST/PUT requests */}
                                    {(selectedIntegration.method === 'POST' || selectedIntegration.method === 'PUT') && (
                                        <div>
                                            <div className="text-sm text-gray-400 font-mono mb-2">// TEST_BODY (JSON):</div>
                                            <textarea
                                                value={testBody}
                                                onChange={(e) => setTestBody(e.target.value)}
                                                className="input-field font-mono text-sm"
                                                rows={8}
                                                placeholder='{\n  "name": "test_agent",\n  "systemPrompt": "You are a helpful assistant",\n  "llmProvider": "openai",\n  "llmModel": "gpt-4",\n  "apiKey": "sk-..."\n}'
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>

                            {testResult && (
                                <div className="card">
                                    <h3 className="text-xl font-mono font-semibold mb-4 text-white">// TEST_RESULT</h3>
                                    <div className="space-y-3">
                                        <div>
                                            <div className="text-sm text-gray-400 font-mono">// STATUS:</div>
                                            <div className={`font-mono px-3 py-2 border-2 ${testResult.status >= 200 && testResult.status < 300
                                                ? 'bg-white text-black border-white'
                                                : 'bg-black text-white border-white'
                                                }`}>
                                                {testResult.status || 'Error'}
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-sm text-gray-400 font-mono">// RESPONSE:</div>
                                            <pre className="bg-black border-2 border-white px-3 py-2 overflow-auto max-h-96 text-sm font-mono text-white">
                                                {JSON.stringify(testResult.data || testResult.error, null, 2)}
                                            </pre>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="card text-center text-gray-400">
                            <p className="font-mono">// SELECT_AN_INTEGRATION_OR_CREATE_NEW</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

import { useState, useEffect } from 'react';
// import Editor from '@monaco-editor/react';
import api from '../services/api';

interface Action {
    id: string;
    name: string;
    descriptionForLlm: string;
    integrationId: string;
    executionMode: string;
    variables: Variable[];
    bodyTemplate: string;
    integration?: any;
}

interface Variable {
    name: string;
    type: string;
    description: string;
}

interface Integration {
    id: string;
    name: string;
    method: string;
    url: string;
}

export default function ActionBuilderPage() {
    const [actions, setActions] = useState<Action[]>([]);
    const [integrations, setIntegrations] = useState<Integration[]>([]);
    const [selectedAction, setSelectedAction] = useState<Action | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editingAction, setEditingAction] = useState<Action | null>(null);
    const [testResult, setTestResult] = useState<any>(null);

    // Form state
    const [name, setName] = useState('');
    const [descriptionForLlm, setDescriptionForLlm] = useState('');
    const [integrationId, setIntegrationId] = useState('');
    const [executionMode, setExecutionMode] = useState('ON_CALL');
    const [variables, setVariables] = useState<Variable[]>([]);
    const [bodyTemplate, setBodyTemplate] = useState('');
    const [testInputs, setTestInputs] = useState<Record<string, any>>({});

    useEffect(() => {
        loadActions();
        loadIntegrations();
    }, []);

    const loadActions = async () => {
        try {
            const response = await api.get('/actions');
            setActions(response.data);
        } catch (error) {
            console.error('Error loading actions:', error);
        }
    };

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
            const payload = {
                name,
                descriptionForLlm,
                integrationId,
                executionMode,
                variables,
                bodyTemplate,
                urlTemplate: null,
                queryTemplate: null
            };
            console.log('Creating action with payload:', payload);
            console.log('Variables:', variables);

            await api.post('/actions', payload);

            setIsCreating(false);
            resetForm();
            loadActions();
        } catch (error: any) {
            alert('Error creating action: ' + error.message);
        }
    };

    const handleEdit = (action: Action) => {
        setEditingAction(action);
        setIsEditing(true);
        setIsCreating(true);
        // Pre-populate form
        setName(action.name);
        setDescriptionForLlm(action.descriptionForLlm);
        setIntegrationId(action.integrationId);
        setExecutionMode(action.executionMode);
        setVariables(action.variables || []);
        setBodyTemplate(action.bodyTemplate || '');
    };

    const handleUpdate = async () => {
        if (!editingAction) return;

        try {
            const payload = {
                name,
                descriptionForLlm,
                integrationId,
                executionMode,
                variables,
                bodyTemplate,
                urlTemplate: null,
                queryTemplate: null
            };

            await api.put(`/actions/${editingAction.id}`, payload);

            setIsCreating(false);
            setIsEditing(false);
            setEditingAction(null);
            resetForm();
            loadActions();
        } catch (error: any) {
            alert('Error updating action: ' + error.message);
        }
    };

    const handleTest = async () => {
        if (!selectedAction) return;

        try {
            const response = await api.post(`/actions/${selectedAction.id}/test`, {
                inputs: testInputs,
                saveTestCase: false
            });
            setTestResult(response);
        } catch (error: any) {
            setTestResult({
                success: false,
                error: error.response?.data?.error || error.message
            });
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this action?')) return;

        try {
            await api.delete(`/actions/${id}`);
            loadActions();
            setSelectedAction(null);
        } catch (error: any) {
            alert('Error deleting action: ' + error.message);
        }
    };

    const addVariable = () => {
        setVariables([...variables, { name: '', type: 'string', description: '' }]);
    };

    const removeVariable = (index: number) => {
        setVariables(variables.filter((_, i) => i !== index));
    };

    const updateVariable = (index: number, field: keyof Variable, value: string) => {
        const updated = [...variables];
        updated[index] = { ...updated[index], [field]: value };
        setVariables(updated);
    };

    const resetForm = () => {
        setName('');
        setDescriptionForLlm('');
        setIntegrationId('');
        setExecutionMode('ON_CALL');
        setVariables([]);
        setBodyTemplate('');
        setTestInputs({});
        setIsEditing(false);
        setEditingAction(null);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-mono font-bold text-white">&gt; ACTION_BUILDER</h2>
                <button
                    onClick={() => setIsCreating(true)}
                    className="btn-primary font-mono"
                >
                    [+ NEW_ACTION]
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Action List */}
                <div className="card">
                    <h3 className="text-xl font-mono font-semibold mb-4 text-white">// ACTIONS</h3>
                    <div className="space-y-2">
                        {actions.map(action => (
                            <div
                                key={action.id}
                                className={`p-3 border-2 transition-colors font-mono ${selectedAction?.id === action.id
                                    ? 'bg-white text-black border-white'
                                    : 'bg-black text-white border-white hover:bg-gray-900'
                                    }`}
                            >
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setSelectedAction(action)}
                                        className="flex-1 text-left min-w-0"
                                    >
                                        <div className="font-medium truncate">&gt; {action.name}</div>
                                        <div className="text-sm opacity-75 truncate">
                                            [{action.integration?.name || 'No integration'}]
                                        </div>
                                    </button>
                                    <div className="flex gap-2 flex-shrink-0">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleEdit(action);
                                            }}
                                            className="text-xs px-2 py-1 border-2 border-white hover:bg-white hover:text-black transition-colors font-mono whitespace-nowrap"
                                        >
                                            [EDIT]
                                        </button>
                                        <button
                                            onClick={() => handleDelete(action.id)}
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

                {/* Action Details */}
                <div className="lg:col-span-2 space-y-6">
                    {isCreating ? (
                        <div className="card">
                            <h3 className="text-xl font-mono font-semibold mb-4 text-white">
                                // {isEditing ? 'EDIT_ACTION' : 'CREATE_ACTION'}
                            </h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-mono font-medium mb-2 text-white">ACTION_NAME:</label>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="input-field"
                                        placeholder="checkBalance"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-mono font-medium mb-2 text-white">
                                        DESCRIPTION_FOR_LLM:
                                    </label>
                                    <textarea
                                        value={descriptionForLlm}
                                        onChange={(e) => setDescriptionForLlm(e.target.value)}
                                        className="input-field"
                                        rows={3}
                                        placeholder="Use this action to check account balance for a user ID"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-mono font-medium mb-2 text-white">INTEGRATION:</label>
                                        <select
                                            value={integrationId}
                                            onChange={(e) => setIntegrationId(e.target.value)}
                                            className="input-field"
                                        >
                                            <option value="">Select integration...</option>
                                            {integrations.map(int => (
                                                <option key={int.id} value={int.id}>
                                                    {int.name} ({int.method})
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-mono font-medium mb-2 text-white">EXECUTION_MODE:</label>
                                        <select
                                            value={executionMode}
                                            onChange={(e) => setExecutionMode(e.target.value)}
                                            className="input-field"
                                        >
                                            <option value="ON_CALL">On Call</option>
                                            <option value="POST_CALL">Post Call</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="block text-sm font-mono font-medium text-white">VARIABLES:</label>
                                        <button
                                            onClick={addVariable}
                                            className="text-white hover:text-gray-400 font-mono border-2 border-white px-2 py-1"
                                        >
                                            [+ ADD]
                                        </button>
                                    </div>

                                    <div className="space-y-2">
                                        {variables.map((variable, index) => (
                                            <div key={index} className="flex items-center space-x-2 p-3 bg-black border-2 border-white">
                                                <input
                                                    type="text"
                                                    value={variable.name}
                                                    onChange={(e) => updateVariable(index, 'name', e.target.value)}
                                                    className="input-field flex-1"
                                                    placeholder="variable_name"
                                                />
                                                <select
                                                    value={variable.type}
                                                    onChange={(e) => updateVariable(index, 'type', e.target.value)}
                                                    className="input-field w-32"
                                                >
                                                    <option value="string">String</option>
                                                    <option value="number">Number</option>
                                                    <option value="boolean">Boolean</option>
                                                    <option value="object">Object</option>
                                                    <option value="array">Array</option>
                                                </select>
                                                <input
                                                    type="text"
                                                    value={variable.description}
                                                    onChange={(e) => updateVariable(index, 'description', e.target.value)}
                                                    className="input-field flex-1"
                                                    placeholder="Description"
                                                />
                                                <button
                                                    onClick={() => removeVariable(index)}
                                                    className="text-white hover:text-gray-400 font-mono border-2 border-white px-2 py-1"
                                                >
                                                    [X]
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-mono font-medium mb-2 text-white">
                                        BODY_TEMPLATE (use {'{{'} variable {'}}'})
                                    </label>
                                    <textarea
                                        value={bodyTemplate}
                                        onChange={(e) => setBodyTemplate(e.target.value)}
                                        className="input-field font-mono text-sm"
                                        rows={8}
                                        placeholder='{\n  "userId": "{{userId}}"\n}'
                                    />
                                </div>

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
                    ) : selectedAction ? (
                        <>
                            <div className="card">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-xl font-mono font-semibold text-white">&gt; {selectedAction.name}</h3>
                                </div>

                                <div className="space-y-3">
                                    <div>
                                        <div className="text-sm text-gray-400 font-mono">// DESCRIPTION:</div>
                                        <div className="bg-black border-2 border-white px-3 py-2 font-mono text-white">
                                            {selectedAction.descriptionForLlm}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-sm text-gray-400 font-mono">// INTEGRATION:</div>
                                        <div className="bg-black border-2 border-white px-3 py-2 font-mono text-white">
                                            {selectedAction.integration?.name || 'None'}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-sm text-gray-400 font-mono">// VARIABLES:</div>
                                        <div className="space-y-1">
                                            {selectedAction.variables.map((v: Variable, idx: number) => (
                                                <div key={idx} className="bg-black border-2 border-white px-3 py-2 text-sm font-mono text-white">
                                                    <span className="text-white">&gt; {v.name}</span>
                                                    <span className="text-gray-400"> ({v.type})</span>
                                                    <span className="text-gray-300"> - {v.description}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="card">
                                <h3 className="text-xl font-mono font-semibold mb-4 text-white">// TEST_ACTION</h3>

                                <div className="space-y-3 mb-4">
                                    {selectedAction.variables.map((v: Variable, idx: number) => (
                                        <div key={idx}>
                                            <label className="block text-sm font-mono font-medium mb-2 text-white">{v.name}:</label>
                                            <input
                                                type={v.type === 'number' ? 'number' : 'text'}
                                                value={testInputs[v.name] || ''}
                                                onChange={(e) => setTestInputs({
                                                    ...testInputs,
                                                    [v.name]: v.type === 'number' ? Number(e.target.value) : e.target.value
                                                })}
                                                className="input-field"
                                                placeholder={v.description}
                                            />
                                        </div>
                                    ))}
                                </div>

                                <button onClick={handleTest} className="btn-primary font-mono mb-4">
                                    [EXECUTE_TEST]
                                </button>

                                {testResult && (
                                    <div className="space-y-3">
                                        <div>
                                            <div className="text-sm text-gray-400 font-mono">// STATUS:</div>
                                            <div className={`font-mono px-3 py-2 border-2 ${testResult.data?.success
                                                ? 'bg-white text-black border-white'
                                                : 'bg-black text-white border-white'
                                                }`}>
                                                {testResult.data?.status || 'Error'}
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-sm text-gray-400 font-mono">// RESPONSE:</div>
                                            <pre className="bg-black border-2 border-white px-3 py-2 overflow-auto max-h-96 text-sm font-mono text-white">
                                                {JSON.stringify(testResult.data?.data || testResult.data?.error, null, 2)}
                                            </pre>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="card text-center text-gray-400">
                            <p className="font-mono">// SELECT_AN_ACTION_OR_CREATE_NEW</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import AgentConfigPage from './pages/AgentConfigPage';
import IntegrationPage from './pages/IntegrationPage';
import ActionBuilderPage from './pages/ActionBuilderPage';
import './index.css';

function App() {
    return (
        <BrowserRouter>
            <div className="min-h-screen bg-black">
                {/* Navigation */}
                <nav className="bg-black border-b-2 border-white sticky top-0 z-50">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex items-center justify-between h-16">
                            {/* Logo & Brand */}
                            <div className="flex-shrink-0 flex items-center">
                                <Link to="/" className="flex items-center gap-3 group">
                                    <div className="bg-white p-0.5 border-1 border-white group-hover:bg-gray-200 transition-colors">
                                        <img className="h-8 w-auto" src="/logo.png" alt="Agent Builder" />
                                    </div>
                                    <span className="text-white font-mono font-bold text-xl hidden sm:block tracking-wider group-hover:text-gray-300 transition-colors">
                                        AGENT_BUILDER
                                    </span>
                                </Link>
                            </div>

                            {/* Navigation Links */}
                            <div className="flex space-x-4">
                                <Link
                                    to="/"
                                    className="font-mono px-3 py-2 border-2 border-white text-white hover:bg-white hover:text-black transition-colors"
                                >
                                    [AGENTS]
                                </Link>
                                <Link
                                    to="/integrations"
                                    className="font-mono px-3 py-2 border-2 border-white text-white hover:bg-white hover:text-black transition-colors"
                                >
                                    [INTEGRATIONS]
                                </Link>
                                <Link
                                    to="/actions"
                                    className="font-mono px-3 py-2 border-2 border-white text-white hover:bg-white hover:text-black transition-colors"
                                >
                                    [ACTIONS]
                                </Link>
                            </div>
                        </div>
                    </div>
                </nav>

                {/* Main Content */}
                <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <Routes>
                        <Route path="/" element={<AgentConfigPage />} />
                        <Route path="/integrations" element={<IntegrationPage />} />
                        <Route path="/actions" element={<ActionBuilderPage />} />
                    </Routes>
                </main>
            </div>
        </BrowserRouter>
    );
}

export default App;

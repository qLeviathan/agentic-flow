import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import { ChatInterface } from './components/ChatInterface';
import { ApiKeySetup } from './components/ApiKeySetup';
import { ErrorBoundary } from './components/ErrorBoundary';
import { LoadingScreen } from './components/LoadingScreen';

export function App() {
  const [hasApiKey, setHasApiKey] = useState<boolean | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      setIsInitializing(true);
      setError(null);

      // Check if API key exists
      const keyExists = await invoke<boolean>('check_api_key');
      setHasApiKey(keyExists);

      // Small delay for smooth UX
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (err) {
      console.error('Failed to initialize app:', err);
      setError(err instanceof Error ? err.message : 'Failed to initialize application');
    } finally {
      setIsInitializing(false);
    }
  };

  const handleApiKeySetupComplete = () => {
    setHasApiKey(true);
  };

  // Loading state
  if (isInitializing) {
    return <LoadingScreen message="Initializing Claude Chat..." />;
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Initialization Error
          </h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={initializeApp}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // API Key setup required
  if (!hasApiKey) {
    return (
      <ErrorBoundary>
        <ApiKeySetup onComplete={handleApiKeySetupComplete} />
      </ErrorBoundary>
    );
  }

  // Main chat interface
  return (
    <ErrorBoundary>
      <ChatInterface />
    </ErrorBoundary>
  );
}

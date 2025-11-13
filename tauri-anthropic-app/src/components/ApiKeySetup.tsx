import { useState } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import { Key, ExternalLink, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Card } from './ui/Card';

interface ApiKeySetupProps {
  onComplete: () => void;
}

export function ApiKeySetup({ onComplete }: ApiKeySetupProps) {
  const [apiKey, setApiKey] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showKey, setShowKey] = useState(false);

  const validateAndSave = async () => {
    if (!apiKey.trim()) {
      setError('Please enter an API key');
      return;
    }

    if (!apiKey.startsWith('sk-ant-')) {
      setError('Invalid API key format. Anthropic keys start with "sk-ant-"');
      return;
    }

    setIsValidating(true);
    setError(null);

    try {
      // Validate the key with Anthropic API
      const isValid = await invoke<boolean>('validate_api_key', { apiKey: apiKey.trim() });

      if (!isValid) {
        setError('Invalid API key. Please check and try again.');
        setIsValidating(false);
        return;
      }

      // Save the key
      await invoke('save_api_key', { apiKey: apiKey.trim() });

      // Success!
      onComplete();
    } catch (err) {
      console.error('API key validation error:', err);
      setError(err instanceof Error ? err.message : 'Failed to validate API key');
      setIsValidating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isValidating) {
      validateAndSave();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 mb-4">
            <Key className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome to Claude Chat
          </h1>
          <p className="text-gray-600">
            Enter your Anthropic API key to get started
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700 mb-2">
              API Key
            </label>
            <div className="relative">
              <Input
                id="apiKey"
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="sk-ant-..."
                className="pr-24"
                disabled={isValidating}
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-gray-500 hover:text-gray-700 px-2 py-1 rounded"
              >
                {showKey ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          {error && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <Button
            onClick={validateAndSave}
            disabled={isValidating || !apiKey.trim()}
            className="w-full"
            size="lg"
          >
            {isValidating ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Validating...
              </>
            ) : (
              <>
                <CheckCircle className="w-5 h-5 mr-2" />
                Continue
              </>
            )}
          </Button>

          <div className="pt-4 border-t border-gray-200">
            <div className="flex items-start gap-2 text-sm text-gray-600">
              <div className="flex-shrink-0 mt-0.5">ℹ️</div>
              <div>
                <p className="font-medium mb-1">Don't have an API key?</p>
                <p className="mb-2">
                  Get one from the Anthropic Console. Your key is stored securely on your device.
                </p>
                <a
                  href="https://console.anthropic.com/account/keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium"
                >
                  Get API Key
                  <ExternalLink className="w-4 h-4 ml-1" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

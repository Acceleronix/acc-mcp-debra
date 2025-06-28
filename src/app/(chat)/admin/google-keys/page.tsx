"use client";

import { useEffect, useState } from "react";
import { Badge } from "ui/badge";
import { Button } from "ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "ui/card";

interface KeyStatus {
  key: string;
  isActive: boolean;
  errorCount: number;
  lastError?: string;
  lastUsed?: string;
}

interface GoogleKeysStatus {
  totalKeys: number;
  activeKeys: number;
  currentIndex: number;
  keys: KeyStatus[];
}

export default function GoogleKeysPage() {
  const [status, setStatus] = useState<GoogleKeysStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);
  const [testResults, setTestResults] = useState<any>(null);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/google-keys/status');
      const data = await response.json();
      setStatus(data);
    } catch (error) {
      console.error('Failed to fetch status:', error);
    } finally {
      setLoading(false);
    }
  };

  const testKeys = async () => {
    try {
      setTesting(true);
      const response = await fetch('/api/google-keys/test', { method: 'POST' });
      const data = await response.json();
      setTestResults(data);
      // Refresh status after test
      fetchStatus();
    } catch (error) {
      console.error('Failed to test keys:', error);
    } finally {
      setTesting(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">Loading Google API Keys status...</div>
      </div>
    );
  }

  if (!status) {
    return (
      <div className="p-6">
        <div className="text-red-500">Failed to load status</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Google API Keys Status</h1>
        <div className="flex gap-2">
          <Button onClick={fetchStatus} size="sm" variant="outline">
            Refresh
          </Button>
          <Button onClick={testKeys} size="sm" disabled={testing}>
            {testing ? "Testing..." : "Test Keys"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Keys</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{status.totalKeys}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Keys</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{status.activeKeys}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Current Index</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{status.currentIndex}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>API Keys Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {status.keys.map((keyStatus, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center space-x-4">
                  <div className="font-mono text-sm">{keyStatus.key}</div>
                  <Badge variant={keyStatus.isActive ? "default" : "destructive"}>
                    {keyStatus.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
                
                <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                  <div>Errors: {keyStatus.errorCount}</div>
                  {keyStatus.lastUsed && (
                    <div>
                      Last used: {new Date(keyStatus.lastUsed).toLocaleString()}
                    </div>
                  )}
                  {keyStatus.lastError && (
                    <div className="text-red-500">
                      Last error: {new Date(keyStatus.lastError).toLocaleString()}
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {status.keys.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No API keys configured
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {testResults && (
        <Card>
          <CardHeader>
            <CardTitle>Test Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">{testResults.summary?.totalAttempts || 0}</div>
                  <div className="text-sm text-muted-foreground">Attempts</div>
                </div>
                <div className="text-center">
                  <div className={`text-2xl font-bold ${testResults.summary?.success ? 'text-green-600' : 'text-red-600'}`}>
                    {testResults.summary?.success ? 'Success' : 'Failed'}
                  </div>
                  <div className="text-sm text-muted-foreground">Result</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{testResults.summary?.activeKeys || 0}</div>
                  <div className="text-sm text-muted-foreground">Active Keys</div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">Test Details:</h4>
                {testResults.testResults?.map((result: any, index: number) => (
                  <div
                    key={index}
                    className={`p-3 rounded border ${
                      result.status === 'success' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Badge variant={result.status === 'success' ? 'default' : 'destructive'}>
                          Attempt {result.attempt}
                        </Badge>
                        {result.keyMask && (
                          <span className="font-mono text-sm">{result.keyMask}</span>
                        )}
                      </div>
                      <div className="text-sm">
                        {result.message || result.error}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
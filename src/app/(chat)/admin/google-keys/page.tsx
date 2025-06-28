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
        <Button onClick={fetchStatus} size="sm">
          Refresh
        </Button>
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
    </div>
  );
}

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';

interface PortionEstimate {
  meal_id: number;
  meal_name: string;
  estimated_portions: number;
  updated_at: string;
}

export const PortionEstimationTab = () => {
  const [portions, setPortions] = useState<PortionEstimate[]>([]);
  const [loading, setLoading] = useState(true);
  const [wsConnected, setWsConnected] = useState(false);

  useEffect(() => {
    fetchInitialPortions();
    setupWebSocket();

    return () => {
      // Cleanup WebSocket connection
    };
  }, []);

  const fetchInitialPortions = async () => {
    try {
      const response = await fetch('/ws/portion/portions');
      
      if (response.ok) {
        const data = await response.json();
        setPortions(data || []);
      }
    } catch (error) {
      console.error('Error fetching initial portions:', error);
      toast({
        title: "Error",
        description: "Failed to fetch portion estimates",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const setupWebSocket = () => {
    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws/portion/stream`;
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('Portion WebSocket connected');
        setWsConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('Received portion update:', data);
          
          // Update portions with new data
          setPortions(prevPortions => {
            const existingIndex = prevPortions.findIndex(p => p.meal_id === data.meal_id);
            if (existingIndex >= 0) {
              const updated = [...prevPortions];
              updated[existingIndex] = data;
              return updated;
            } else {
              return [...prevPortions, data];
            }
          });
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.onclose = () => {
        console.log('Portion WebSocket disconnected');
        setWsConnected(false);
        
        // Attempt to reconnect after 3 seconds
        setTimeout(() => {
          setupWebSocket();
        }, 3000);
      };

      ws.onerror = (error) => {
        console.error('Portion WebSocket error:', error);
        setWsConnected(false);
      };

    } catch (error) {
      console.error('Error setting up WebSocket:', error);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading portion estimates...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Portion Estimation</h2>
        <div className={`px-3 py-1 rounded-full text-sm ${
          wsConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {wsConnected ? 'Live Updates Active' : 'Disconnected'}
        </div>
      </div>

      <div className="text-sm text-gray-600 bg-blue-50 p-4 rounded-lg">
        <p><strong>Real-time Updates:</strong> This page shows how many portions of each meal can be served based on current ingredient inventory. Updates automatically via WebSocket when inventory changes.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {portions.map((portion) => (
          <Card key={portion.meal_id}>
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <span>{portion.meal_name}</span>
                <span className={`text-lg font-bold ${
                  portion.estimated_portions > 10 
                    ? 'text-green-600' 
                    : portion.estimated_portions > 5 
                    ? 'text-yellow-600' 
                    : 'text-red-600'
                }`}>
                  {portion.estimated_portions}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Estimated portions available
              </p>
              <p className="text-xs text-gray-500 mt-2">
                Last updated: {new Date(portion.updated_at).toLocaleString()}
              </p>
              <div className={`mt-2 px-2 py-1 rounded text-xs ${
                portion.estimated_portions > 10 
                  ? 'bg-green-100 text-green-800' 
                  : portion.estimated_portions > 5 
                  ? 'bg-yellow-100 text-yellow-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {portion.estimated_portions > 10 
                  ? 'Good Stock' 
                  : portion.estimated_portions > 5 
                  ? 'Medium Stock' 
                  : 'Low Stock'}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {portions.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No portion estimates available. Make sure meals have ingredients configured.
        </div>
      )}
    </div>
  );
};

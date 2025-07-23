import React from 'react';

/**
 * WebSocket Debug Panel - Add this temporarily to your chat interface
 * to see what's happening with WebSocket connections and state updates
 */
const WebSocketDebugPanel = ({ 
  isConnected, 
  connectionError, 
  realtimeMessages, 
  chatHistory, 
  selectedRoom, 
  user 
}) => {
  const [isVisible, setIsVisible] = React.useState(false);
  const [logs, setLogs] = React.useState([]);

  // Add log entry
  const addLog = (message) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev.slice(-19), { timestamp, message }]); // Keep last 20 logs
  };

  // Monitor WebSocket state changes
  React.useEffect(() => {
    addLog(`WebSocket Connected: ${isConnected}`);
  }, [isConnected]);

  React.useEffect(() => {
    if (connectionError) {
      addLog(`Connection Error: ${connectionError}`);
    }
  }, [connectionError]);

  React.useEffect(() => {
    addLog(`Realtime Messages: ${realtimeMessages.length}`);
  }, [realtimeMessages.length]);

  React.useEffect(() => {
    addLog(`Chat History: ${chatHistory.length}`);
  }, [chatHistory.length]);

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 bg-blue-500 text-white px-3 py-1 rounded text-sm z-50"
      >
        🔧 Debug WS
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white border border-gray-300 rounded-lg shadow-lg p-4 w-80 max-h-96 overflow-y-auto z-50">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-bold text-sm">WebSocket Debug</h3>
        <button 
          onClick={() => setIsVisible(false)}
          className="text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>
      </div>

      {/* Connection Status */}
      <div className="mb-3 p-2 bg-gray-50 rounded">
        <div className="text-xs">
          <div className={`flex items-center gap-2 ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            WebSocket: {isConnected ? 'Connected' : 'Disconnected'}
          </div>
          {connectionError && (
            <div className="text-red-600 mt-1">Error: {connectionError}</div>
          )}
        </div>
      </div>

      {/* State Info */}
      <div className="mb-3 text-xs space-y-1">
        <div><strong>Room:</strong> {selectedRoom || 'None'}</div>
        <div><strong>User ID:</strong> {user?.id || 'None'}</div>
        <div><strong>Chat History:</strong> {chatHistory.length} messages</div>
        <div><strong>Realtime:</strong> {realtimeMessages.length} messages</div>
      </div>

      {/* Recent Logs */}
      <div className="mb-3">
        <div className="text-xs font-semibold mb-1">Recent Activity:</div>
        <div className="bg-gray-100 p-2 rounded text-xs max-h-32 overflow-y-auto">
          {logs.map((log, index) => (
            <div key={index} className="mb-1">
              <span className="text-gray-500">{log.timestamp}</span> {log.message}
            </div>
          ))}
          {logs.length === 0 && (
            <div className="text-gray-500">No activity yet...</div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <button
          onClick={() => {
            console.log('WebSocket Debug State:', {
              isConnected,
              connectionError,
              realtimeMessages,
              chatHistory,
              selectedRoom,
              user
            });
          }}
          className="bg-blue-500 text-white px-2 py-1 rounded text-xs"
        >
          Log State
        </button>
        <button
          onClick={() => setLogs([])}
          className="bg-gray-500 text-white px-2 py-1 rounded text-xs"
        >
          Clear Logs
        </button>
      </div>

      {/* Instructions */}
      <div className="mt-3 text-xs text-gray-600 bg-yellow-50 p-2 rounded">
        <strong>Debug Steps:</strong>
        <ol className="list-decimal list-inside mt-1 space-y-1">
          <li>Check WebSocket connection status</li>
          <li>Send a message and watch logs</li>
          <li>Add a reaction and check updates</li>
          <li>Click "Log State" for detailed info</li>
        </ol>
      </div>
    </div>
  );
};

export default WebSocketDebugPanel;

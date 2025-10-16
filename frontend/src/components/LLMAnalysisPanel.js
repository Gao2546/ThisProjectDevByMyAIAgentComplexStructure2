
import React, { useState } from 'react';
import axios from 'axios';
import './LLMAnalysisPanel.css';

const LLMAnalysisPanel = () => {
  const [query, setQuery] = useState('');
  const [analysisResult, setAnalysisResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // API base URL (in production, this should be set via environment variables)
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001';

  // Function to submit query to LLM analysis endpoint
  const submitQuery = async () => {
    if (!query.trim()) {
      setError('Please enter a query');
      return;
    }

    setLoading(true);
    setError(null);
    setAnalysisResult(null);

    try {
      // In a real implementation, this would call the LLM analysis endpoint
      // For now, we'll simulate the response
      const response = await axios.post(`${API_BASE_URL}/api/llm-analyze`, {
        query: query
      });
      
      setAnalysisResult(response.data);
    } catch (err) {
      console.error('Error submitting query:', err);
      setError('Failed to analyze data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Function to format the related data for display
  const formatRelatedData = (data) => {
    if (!data) return null;
    
    return (
      <div className="related-data">
        <h4>Related Data:</h4>
        <pre>{JSON.stringify(data, null, 2)}</pre>
      </div>
    );
  };

  return (
    <div className="llm-analysis-panel card">
      <div className="card-header">
        <h2 className="card-title">LLM Data Analysis</h2>
      </div>
      
      <div className="query-input-container">
        <textarea
          className="query-input"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Enter your question about the manufacturing data... (e.g., 'What machines have shown unusual vibration patterns recently?')"
          rows={3}
        />
        <button 
          className="analyze-button" 
          onClick={submitQuery}
          disabled={loading}
        >
          {loading ? 'Analyzing...' : 'Analyze Data'}
        </button>
      </div>
      
      {error && (
        <div className="alert anomaly">
          <strong>Error:</strong> {error}
        </div>
      )}
      
      {analysisResult && (
        <div className="analysis-result">
          <h3>Analysis Result:</h3>
          <div className="analysis-content">
            {analysisResult.analysis_result || analysisResult.response}
          </div>
          
          {formatRelatedData(analysisResult.related_data)}
        </div>
      )}
      
      {!analysisResult && !loading && (
        <div className="info-text">
          <p>Enter a question about the manufacturing data to get insights from the LLM analysis.</p>
          <p>Examples:</p>
          <ul>
            <li>"What machines have shown unusual vibration patterns recently?"</li>
            <li>"Which machine types are most prone to temperature anomalies?"</li>
            <li>"Show me a summary of anomalies detected in the last 24 hours"</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default LLMAnalysisPanel;


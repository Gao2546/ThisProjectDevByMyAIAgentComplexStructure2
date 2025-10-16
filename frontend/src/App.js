
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import moment from 'moment';
import './App.css';
import LLMAnalysisPanel from './components/LLMAnalysisPanel';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000';

function App() {
  const [sensorData, setSensorData] = useState([]);
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedMachine, setSelectedMachine] = useState('All');
  const [timeRange, setTimeRange] = useState('1h');

  // Fetch data from server
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch sensor data
      const sensorResponse = await axios.get(`${API_BASE_URL}/api/sensor-data?timeRange=${timeRange}`);
      setSensorData(sensorResponse.data);
      
      // Fetch predictions
      const predictionsResponse = await axios.get(`${API_BASE_URL}/api/predictions?timeRange=${timeRange}`);
      setPredictions(predictionsResponse.data);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to fetch data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Trigger manual data collection
  const triggerDataCollection = async () => {
    setLoading(true);
    setError(null);
    
    try {
      await axios.post(`${API_BASE_URL}/api/collect`);
      // Refresh data after collection
      await fetchData();
    } catch (err) {
      console.error('Error triggering data collection:', err);
      setError('Failed to trigger data collection. Please try again.');
      setLoading(false);
    }
  };

  // Format data for charts
  const formatChartData = () => {
    if (!sensorData || sensorData.length === 0) return [];
    
    // Filter by selected machine if not 'All'
    let filteredData = sensorData;
    if (selectedMachine !== 'All') {
      filteredData = sensorData.filter(item => item.machine_id === selectedMachine);
    }
    
    // Format for chart
    return filteredData.map(item => ({
      timestamp: moment(item.timestamp).format('HH:mm'),
      vibration: parseFloat(item.vibration),
      temperature: parseFloat(item.temperature),
      pressure: parseFloat(item.pressure),
      flowRate: parseFloat(item.flow_rate),
      rotationalSpeed: parseFloat(item.rotational_speed)
    })).reverse(); // Reverse to show oldest first
  };

  // Get unique machine IDs for filter
  const getMachineIds = () => {
    if (!sensorData || sensorData.length === 0) return [];
    
    const machineIds = [...new Set(sensorData.map(item => item.machine_id))];
    return ['All', ...machineIds];
  };

  // Get recent anomalies
  const getRecentAnomalies = () => {
    if (!predictions || predictions.length === 0) return [];
    
    return predictions
      .filter(prediction => prediction.is_anomaly)
      .slice(0, 5); // Get top 5 recent anomalies
  };

  // Fetch data on component mount
  useEffect(() => {
    fetchData();
    
    // Set up interval to refresh data every 30 seconds
    const interval = setInterval(fetchData, 30000);
    
    // Clean up interval on component unmount
    return () => clearInterval(interval);
  }, [timeRange]);

  // Format data for chart
  const chartData = formatChartData();
  const machineIds = getMachineIds();
  const recentAnomalies = getRecentAnomalies();

  return (
    <div className="App">
      <div className="dashboard-container">
        <div className="dashboard-header">
          <h1 className="dashboard-title">Manufacturing Pipeline Dashboard</h1>
          <button 
            className="refresh-button" 
            onClick={triggerDataCollection}
            disabled={loading}
          >
            {loading ? 'Collecting Data...' : 'Collect Data Now'}
          </button>
        </div>
        
        {error && (
          <div className="alert anomaly">
            <strong>Error:</strong> {error}
          </div>
        )}
        
        {/* Anomaly Alerts */}
        {recentAnomalies.length > 0 && (
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Recent Anomalies</h2>
            </div>
            <div>
              {recentAnomalies.map((anomaly, index) => (
                <div key={index} className="alert anomaly">
                  <strong>ANOMALY DETECTED:</strong> Machine {anomaly.machine_id} ({anomaly.machine_type}) at {moment(anomaly.timestamp).format('YYYY-MM-DD HH:mm:ss')} 
                  - Probability: {(anomaly.anomaly_probability * 100).toFixed(2)}% - {anomaly.prediction_details?.recommended_action}
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Controls */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Controls</h2>
          </div>
          <div className="controls-container">
            <div className="control-group">
              <label htmlFor="machine-filter">Machine:</label>
              <select 
                id="machine-filter"
                value={selectedMachine} 
                onChange={(e) => setSelectedMachine(e.target.value)}
              >
                {machineIds.map(machineId => (
                  <option key={machineId} value={machineId}>{machineId}</option>
                ))}
              </select>
            </div>
            
            <div className="control-group">
              <label htmlFor="time-range">Time Range:</label>
              <select 
                id="time-range"
                value={timeRange} 
                onChange={(e) => setTimeRange(e.target.value)}
              >
                <option value="1h">Last 1 Hour</option>
                <option value="6h">Last 6 Hours</option>
                <option value="12h">Last 12 Hours</option>
                <option value="24h">Last 24 Hours</option>
              </select>
            </div>
          </div>
        </div>
        
        {/* Sensor Data Chart */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Sensor Data</h2>
          </div>
          {loading && chartData.length === 0 ? (
            <div className="spinner"></div>
          ) : (
            <div className="chart-container">
              <ResponsiveContainer width="100%" height={400}>
                <LineChart
                  data={chartData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="timestamp" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="vibration" stroke="#8884d8" activeDot={{ r: 8 }} />
                  <Line type="monotone" dataKey="temperature" stroke="#82ca9d" />
                  <Line type="monotone" dataKey="pressure" stroke="#ffc658" />
                  <Line type="monotone" dataKey="flowRate" stroke="#ff7300" />
                  <Line type="monotone" dataKey="rotationalSpeed" stroke="#000000" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
        
        {/* LLM Analysis Panel */}
        <LLMAnalysisPanel />
        
        {/* Recent Predictions */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Recent Predictions</h2>
          </div>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Machine ID</th>
                  <th>Machine Type</th>
                  <th>Status</th>
                  <th>Probability</th>
                  <th>Confidence</th>
                  <th>Recommended Action</th>
                </tr>
              </thead>
              <tbody>
                {predictions.slice(0, 10).map((prediction) => (
                  <tr key={prediction.id}>
                    <td>{moment(prediction.timestamp).format('YYYY-MM-DD HH:mm:ss')}</td>
                    <td>{prediction.machine_id}</td>
                    <td>{prediction.machine_type}</td>
                    <td>
                      <span className={`status-indicator ${prediction.is_anomaly ? 'anomaly' : 'normal'}`}></span>
                      {prediction.is_anomaly ? 'Anomaly' : 'Normal'}
                    </td>
                    <td>{(prediction.anomaly_probability * 100).toFixed(2)}%</td>
                    <td>{(prediction.prediction_details?.confidence * 100).toFixed(2)}%</td>
                    <td>{prediction.prediction_details?.recommended_action}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        
        {/* Recent Sensor Data */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Recent Sensor Data</h2>
          </div>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Machine ID</th>
                  <th>Machine Type</th>
                  <th>Vibration</th>
                  <th>Temperature</th>
                  <th>Pressure</th>
                  <th>Flow Rate</th>
                  <th>Rotational Speed</th>
                </tr>
              </thead>
              <tbody>
                {sensorData.slice(0, 10).map((data) => (
                  <tr key={data.id}>
                    <td>{moment(data.timestamp).format('YYYY-MM-DD HH:mm:ss')}</td>
                    <td>{data.machine_id}</td>
                    <td>{data.machine_type}</td>
                    <td>{data.vibration}</td>
                    <td>{data.temperature}°C</td>
                    <td>{data.pressure} bar</td>
                    <td>{data.flow_rate} L/min</td>
                    <td>{data.rotational_speed} RPM</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;


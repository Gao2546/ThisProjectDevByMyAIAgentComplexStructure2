
import React, { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const PredictionGraph = ({ data }) => {
  const [timeRange, setTimeRange] = useState('all');
  const [chartData, setChartData] = useState({});

  useEffect(() => {
    if (!data || data.length === 0) return;

    // Filter data based on time range
    let filteredData = data;
    const now = new Date();
    
    switch (timeRange) {
      case '1h':
        const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
        filteredData = data.filter(item => new Date(item.timestamp) >= oneHourAgo);
        break;
      case '24h':
        const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        filteredData = data.filter(item => new Date(item.timestamp) >= oneDayAgo);
        break;
      case '7d':
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        filteredData = data.filter(item => new Date(item.timestamp) >= oneWeekAgo);
        break;
      default:
        filteredData = data;
    }

    // Prepare chart data
    const timestamps = filteredData.map(item => 
      new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    );
    
    const actualValues = filteredData.map(item => item.actual);
    const predictedValues = filteredData.map(item => item.predicted);

    setChartData({
      labels: timestamps,
      datasets: [
        {
          label: 'Actual Values',
          data: actualValues,
          borderColor: 'rgb(75, 192, 192)',
          backgroundColor: 'rgba(75, 192, 192, 0.5)',
          tension: 0.1,
        },
        {
          label: 'Predicted Values',
          data: predictedValues,
          borderColor: 'rgb(255, 99, 132)',
          backgroundColor: 'rgba(255, 99, 132, 0.5)',
          tension: 0.1,
        },
      ],
    });
  }, [data, timeRange]);

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Manufacturing Process Prediction vs Actual',
      },
    },
    scales: {
      y: {
        beginAtZero: false,
      },
    },
  };

  return (
    <div>
      <div style={{ marginBottom: '20px' }}>
        <label>Time Range: </label>
        <select value={timeRange} onChange={(e) => setTimeRange(e.target.value)}>
          <option value="all">All Time</option>
          <option value="1h">Last 1 Hour</option>
          <option value="24h">Last 24 Hours</option>
          <option value="7d">Last 7 Days</option>
        </select>
      </div>
      <Line options={options} data={chartData} />
    </div>
  );
};

export default PredictionGraph;

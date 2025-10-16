
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { Client } = require('pg');
const winston = require('winston');
const axios = require('axios');
const cron = require('node-cron');

require('dotenv').config();
const app = express();
const PORT = process.env.PORT || 3001;

// Database configuration
const dbConfig = {
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'manufacturing_db',
  password: process.env.DB_PASSWORD || 'postgres',
  port: process.env.DB_PORT || 5432,
};

// Ollama configuration
const OLLAMA_CONFIG = {
  host: process.env.OLLAMA_HOST || 'http://localhost:11434',
  model: process.env.OLLAMA_MODEL || 'gemma3:4b'
};

// Logger setup
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  ),
  defaultMeta: { service: 'sensor-data-pipeline' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from the React app build directory
app.use(express.static(path.join(__dirname, '../frontend/build')));

// Configuration for data collection interval (default 5 seconds)
let collectionInterval = process.env.COLLECTION_INTERVAL || 5;

// PostgreSQL client
const client = new Client(dbConfig);

// Mock sensor data generator
function generateMockSensorData() {
  const machineTypes = ['Pump', 'Compressor', 'Motor', 'Valve'];
  const machineIds = ['M001', 'M002', 'M003', 'M004', 'M005'];
  
  const data = {
    timestamp: new Date().toISOString(),
    vibration: (Math.random() * 10).toFixed(2),
    temperature: (Math.random() * 100 + 20).toFixed(2),
    pressure: (Math.random() * 10 + 1).toFixed(2),
    flowRate: (Math.random() * 50).toFixed(2),
    rotationalSpeed: (Math.random() * 5000 + 1000).toFixed(2),
    machineType: machineTypes[Math.floor(Math.random() * machineTypes.length)],
    machineId: machineIds[Math.floor(Math.random() * machineIds.length)],
    role: 'System'
  };
  
  return data;
}

// Save sensor data to database
async function saveSensorDataToDB(data) {
  try {
    const query = `
      INSERT INTO sensor_data 
      (timestamp, vibration, temperature, pressure, flow_rate, rotational_speed, machine_type, machine_id, role)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `;
    
    const values = [
      data.timestamp,
      data.vibration,
      data.temperature,
      data.pressure,
      data.flowRate,
      data.rotationalSpeed,
      data.machineType,
      data.machineId,
      data.role
    ];
    
    await client.query(query, values);
    logger.info('Sensor data saved to database', { machineId: data.machineId });
    return true;
  } catch (error) {
    logger.error('Error saving sensor data to database', { error: error.message });
    return false;
  }
}

// Save prediction result to database
async function savePredictionToDB(prediction) {
  try {
    const query = `
      INSERT INTO prediction_results 
      (timestamp, machine_id, machine_type, anomaly_probability, is_anomaly, prediction_details)
      VALUES ($1, $2, $3, $4, $5, $6)
    `;
    
    const values = [
      prediction.timestamp,
      prediction.machineId,
      prediction.machineType,
      prediction.anomalyProbability,
      prediction.isAnomaly,
      JSON.stringify(prediction.predictionDetails)
    ];
    
    await client.query(query, values);
    logger.info('Prediction result saved to database', { machineId: prediction.machineId });
    return true;
  } catch (error) {
    logger.error('Error saving prediction to database', { error: error.message });
    return false;
  }
}

// Save LLM analysis result to database
async function saveLLMAnalysisToDB(queryText, analysisResult, relatedData) {
  try {
    const insertQuery = `
      INSERT INTO llm_analysis 
      (query_text, analysis_result, related_data)
      VALUES ($1, $2, $3)
      RETURNING id
    `;
    
    const values = [
      queryText,
      analysisResult,
      JSON.stringify(relatedData)
    ];
    
    const result = await client.query(insertQuery, values);
    logger.info('LLM analysis result saved to database', { analysisId: result.rows[0].id });
    return result.rows[0].id;
  } catch (error) {
    logger.error('Error saving LLM analysis to database', { error: error.message });
    return null;
  }
}



// Load required modules for ML prediction
const { spawn } = require('child_process');

// Initialize predictor at the top with other configurations
const predictorPath = path.join(__dirname, '../ml-models/predictor_interface.py');

// Update the runPrediction function (replace the existing mock function)
async function runPrediction(data) {
  return new Promise((resolve, reject) => {
    // Prepare the input data as JSON
    const inputData = {
      timestamp: data.timestamp,
      vibration: parseFloat(data.vibration),
      temperature: parseFloat(data.temperature),
      pressure: parseFloat(data.pressure),
      flowRate: parseFloat(data.flowRate),
      rotationalSpeed: parseFloat(data.rotationalSpeed),
      machineType: data.machineType,
      machineId: data.machineId,
      role: data.role || 'System'
    };

    // Spawn a Python process to run the predictor
    const pythonProcess = spawn('/app/venv/bin/python3', [predictorPath], {
      env: { ...process.env, PYTHONPATH: path.join(__dirname, '../ml-models') }
    });

    let stdoutData = '';
    let stderrData = '';

    pythonProcess.stdout.on('data', (data) => {
      stdoutData += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      stderrData += data.toString();
    });

    pythonProcess.on('close', (code) => {
      if (code !== 0) {
        logger.error('Python prediction process failed', { 
          code: code, 
          error: stderrData 
        });
        // Fallback to mock prediction if Python process fails
        const anomalyProbability = Math.random();
        const isAnomaly = anomalyProbability > 0.8;
        resolve({
          timestamp: new Date().toISOString(),
          machineId: data.machineId,
          machineType: data.machineType,
          anomalyProbability: anomalyProbability.toFixed(4),
          isAnomaly: isAnomaly,
          predictionDetails: {
            confidence: (Math.random() * 0.3 + 0.7).toFixed(4),
            recommendedAction: isAnomaly ? 'Inspect immediately' : 'No action required'
          }
        });
      } else {
        try {
          // Parse the prediction result from Python
          const result = JSON.parse(stdoutData);
          logger.info("reuslt : ",result)
          resolve(result);
        } catch (parseError) {
          logger.error('Error parsing prediction result', { 
            error: parseError.message,
            rawData: stdoutData
          });
          // Fallback to mock prediction if parsing fails
          const anomalyProbability = Math.random();
          const isAnomaly = anomalyProbability > 0.8;
          resolve({
            timestamp: new Date().toISOString(),
            machineId: data.machineId,
            machineType: data.machineType,
            anomalyProbability: anomalyProbability.toFixed(4),
            isAnomaly: isAnomaly,
            predictionDetails: {
              confidence: (Math.random() * 0.3 + 0.7).toFixed(4),
              recommendedAction: isAnomaly ? 'Inspect immediately' : 'No action required'
            }
          });
        }
      }
    });

    // Send the input data to the Python process
    pythonProcess.stdin.write(JSON.stringify(inputData));
    pythonProcess.stdin.end();
  });
}





// Fetch data for LLM analysis
async function fetchDataForLLMAnalysis(limit = 100) {
  try {
    // Fetch recent sensor data
    const sensorQuery = `
      SELECT * FROM sensor_data 
      ORDER BY timestamp DESC 
      LIMIT $1
    `;
    
    const sensorResult = await client.query(sensorQuery, [limit]);
    
    // Fetch recent predictions
    const predictionQuery = `
      SELECT * FROM prediction_results 
      ORDER BY timestamp DESC 
      LIMIT $1
    `;
    
    const predictionResult = await client.query(predictionQuery, [limit]);
    
    return {
      sensorData: sensorResult.rows,
      predictions: predictionResult.rows
    };
  } catch (error) {
    logger.error('Error fetching data for LLM analysis', { error: error.message });
    return null;
  }
}

// Send request to Ollama for analysis
async function analyzeWithLLM(query, data) {
  try {
    // Format the data for LLM analysis
    const formattedData = `
      Sensor Data:
      ${JSON.stringify(data.sensorData, null, 2)}
      
      Prediction Results:
      ${JSON.stringify(data.predictions, null, 2)}
    `;
    
    // Prepare the prompt for LLM
    const prompt = `
      You are an AI assistant analyzing manufacturing equipment data. 
      Please answer the following question based on the provided data:
      
      Question: ${query}
      
      Data:
      ${formattedData}
      
      Please provide a concise and informative answer.
    `;
    
    // Send request to Ollama
    const response = await axios.post(`${OLLAMA_CONFIG.host}/api/generate`, {
      model: OLLAMA_CONFIG.model,
      prompt: prompt,
      stream: false
    });
    
    return response.data.response;
  } catch (error) {
    logger.error('Error analyzing with LLM', { error: error.message });
    throw new Error('Failed to analyze data with LLM');
  }
}

// Data collection task
async function collectSensorData() {
  try {
    const data = generateMockSensorData();
    
    // Save sensor data to database
    await saveSensorDataToDB(data);
    
    logger.info('Collected sensor data', { machineId: data.machineId, machineType: data.machineType });
    
    // Run prediction on the collected data
    const prediction = await runPrediction(data);
    
    // Save prediction to database
    await savePredictionToDB(prediction);
    
    logger.info('Prediction completed', { 
      machineId: data.machineId, 
      isAnomaly: prediction.isAnomaly,
      probability: prediction.anomalyProbability 
    });
    
  } catch (error) {
    logger.error('Error in data collection task', { error: error.message });
  }
}

// Schedule data collection task
let collectionTask = cron.schedule(`*/${collectionInterval} * * * * *`, collectSensorData);

// API Routes

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'Sensor Data Pipeline'
  });
});

// Get current configuration
app.get('/api/config', (req, res) => {
  res.json({ 
    collectionInterval: collectionInterval,
    serviceStatus: collectionTask ? 'running' : 'stopped'
  });
});

// Update collection interval
app.post('/api/config/interval', (req, res) => {
  const { interval } = req.body;
  
  if (!interval || isNaN(interval) || interval < 1) {
    return res.status(400).json({ error: 'Invalid interval value. Must be a positive number.' });
  }
  
  collectionInterval = parseInt(interval);
  
  // Reschedule the task with new interval
  collectionTask.destroy();
  collectionTask = cron.schedule(`*/${collectionInterval} * * * * *`, collectSensorData);
  
  logger.info('Collection interval updated', { newInterval: collectionInterval });
  
  res.json({ 
    message: 'Collection interval updated successfully',
    newInterval: collectionInterval
  });
});

// Get recent sensor data
app.get('/api/sensor-data', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const query = `
      SELECT * FROM sensor_data 
      ORDER BY timestamp DESC 
      LIMIT $1
    `;
    
    const result = await client.query(query, [limit]);
    res.json(result.rows);
  } catch (error) {
    logger.error('Error fetching sensor data', { error: error.message });
    res.status(500).json({ error: 'Failed to fetch sensor data', details: error.message });
  }
});

// Get recent predictions
app.get('/api/predictions', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const query = `
      SELECT * FROM prediction_results 
      ORDER BY timestamp DESC 
      LIMIT $1
    `;
    
    const result = await client.query(query, [limit]);
    res.json(result.rows);
  } catch (error) {
    logger.error('Error fetching predictions', { error: error.message });
    res.status(500).json({ error: 'Failed to fetch predictions', details: error.message });
  }
});

// Manual data collection trigger
app.post('/api/collect', async (req, res) => {
  try {
    await collectSensorData();
    res.json({ message: 'Data collected and prediction completed successfully' });
  } catch (error) {
    logger.error('Manual data collection failed', { error: error.message });
    res.status(500).json({ error: 'Data collection failed', details: error.message });
  }
});

// Manual prediction trigger
app.post('/api/predict', async (req, res) => {
  try {
    const { sensorData: inputData } = req.body;
    
    if (!inputData) {
      return res.status(400).json({ error: 'Sensor data is required' });
    }
    
    const prediction = await runPrediction(inputData);
    
    // Save prediction to database
    await savePredictionToDB(prediction);
    
    res.json(prediction);
  } catch (error) {
    logger.error('Manual prediction failed', { error: error.message });
    res.status(500).json({ error: 'Prediction failed', details: error.message });
  }
});

// LLM analysis endpoint
app.post('/api/llm-analyze', async (req, res) => {
  try {
    const { query } = req.body;
    
    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }
    
    // Fetch data for analysis
    const data = await fetchDataForLLMAnalysis(100);
    
    if (!data) {
      return res.status(500).json({ error: 'Failed to fetch data for analysis' });
    }
    
    // Analyze with LLM
    const analysisResult = await analyzeWithLLM(query, data);
    
    // Save analysis result to database
    await saveLLMAnalysisToDB(query, analysisResult, data);
    
    res.json({
      query: query,
      analysis_result: analysisResult,
      related_data: data
    });
  } catch (error) {
    logger.error('LLM analysis failed', { error: error.message });
    res.status(500).json({ error: 'LLM analysis failed', details: error.message });
  }
});

// Get recent LLM analysis results
app.get('/api/llm-analysis', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const query = `
      SELECT * FROM llm_analysis 
      ORDER BY created_at DESC 
      LIMIT $1
    `;
    
    const result = await client.query(query, [limit]);
    res.json(result.rows);
  } catch (error) {
    logger.error('Error fetching LLM analysis results', { error: error.message });
    res.status(500).json({ error: 'Failed to fetch LLM analysis results', details: error.message });
  }
});

// The "catchall" handler: for any request that doesn't
// match one of the API routes above, send back React's index.html file.
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/build/index.html'));
});

// Connect to database and start server
async function startServer() {
  try {
    await client.connect();
    logger.info('Connected to PostgreSQL database');
    
    app.listen(PORT, () => {
      logger.info(`Sensor Data Pipeline server running on port ${PORT}`);
      console.log(`Sensor Data Pipeline server running on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Failed to connect to database', { error: error.message });
    process.exit(1);
  }
}

startServer();

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  await client.end();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  await client.end();
  process.exit(0);
});

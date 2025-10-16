
# API Guide for AI Agent

This document provides detailed instructions for AI agents to interact with the Manufacturing Pipeline system through its RESTful APIs.

## Base URL

All API endpoints are relative to the base URL:
```
http://localhost:3001
```

## Authentication

All API requests require an API key in the `Authorization` header:
```
Authorization: Bearer YOUR_API_KEY
```

API keys can be obtained from the system administrator.

## API Endpoints

### 1. Health Check

Check if the service is running.

**Endpoint:** `GET /health`

**Response:**
```json
{
  "status": "OK",
  "timestamp": "2023-01-01T00:00:00.000Z",
  "service": "Sensor Data Pipeline"
}
```

### 2. Configuration

#### Get Current Configuration

**Endpoint:** `GET /api/config`

**Response:**
```json
{
  "collectionInterval": 5,
  "serviceStatus": "running"
}
```

#### Update Collection Interval

**Endpoint:** `POST /api/config/interval`

**Request Body:**
```json
{
  "interval": 10
}
```

**Response:**
```json
{
  "message": "Collection interval updated successfully",
  "newInterval": 10
}
```

### 3. Sensor Data

#### Get Recent Sensor Data

**Endpoint:** `GET /api/sensor-data?limit=50`

**Parameters:**
- `limit` (optional): Number of records to retrieve (default: 50)

**Response:**
```json
[
  {
    "id": 1,
    "timestamp": "2023-01-01T00:00:00.000Z",
    "vibration": "5.23",
    "temperature": "75.42",
    "pressure": "3.14",
    "flow_rate": "25.67",
    "rotational_speed": "3500.00",
    "machine_type": "Pump",
    "machine_id": "M001",
    "role": "System",
    "created_at": "2023-01-01T00:00:00.000Z"
  }
]
```

#### Manual Data Collection

Trigger immediate data collection from sensors.

**Endpoint:** `POST /api/collect`

**Response:**
```json
{
  "message": "Data collected and prediction completed successfully"
}
```

### 4. Predictions

#### Get Recent Predictions

**Endpoint:** `GET /api/predictions?limit=50`

**Parameters:**
- `limit` (optional): Number of records to retrieve (default: 50)

**Response:**
```json
[
  {
    "id": 1,
    "timestamp": "2023-01-01T00:00:00.000Z",
    "machine_id": "M001",
    "machine_type": "Pump",
    "anomaly_probability": "0.0234",
    "is_anomaly": false,
    "prediction_details": {
      "confidence": "0.9766",
      "recommended_action": "No action required"
    },
    "created_at": "2023-01-01T00:00:00.000Z"
  }
]
```

#### Manual Prediction

Submit sensor data for immediate prediction.

**Endpoint:** `POST /api/predict`

**Request Body:**
```json
{
  "sensorData": {
    "timestamp": "2023-01-01T00:00:00.000Z",
    "vibration": "5.23",
    "temperature": "75.42",
    "pressure": "3.14",
    "flowRate": "25.67",
    "rotationalSpeed": "3500.00",
    "machineType": "Pump",
    "machineId": "M001",
    "role": "Agent"
  }
}
```

**Response:**
```json
{
  "timestamp": "2023-01-01T00:00:00.000Z",
  "machineId": "M001",
  "machineType": "Pump",
  "anomalyProbability": "0.0234",
  "isAnomaly": false,
  "predictionDetails": {
    "confidence": "0.9766",
    "recommendedAction": "No action required"
  }
}
```

## Error Responses

All error responses follow this format:
```json
{
  "error": "Error message",
  "details": "Additional details about the error"
}
```

Common HTTP status codes:
- `400`: Bad Request - Invalid request parameters
- `401`: Unauthorized - Missing or invalid API key
- `500`: Internal Server Error - Server-side error

## Usage Examples

### Python Example

```python
import requests
import json

# Base URL
BASE_URL = "http://localhost:3001"

# Headers with API key
HEADERS = {
    "Authorization": "Bearer YOUR_API_KEY",
    "Content-Type": "application/json"
}

# Get recent sensor data
def get_sensor_data(limit=50):
    response = requests.get(
        f"{BASE_URL}/api/sensor-data?limit={limit}",
        headers=HEADERS
    )
    return response.json()

# Trigger manual data collection
def collect_data():
    response = requests.post(
        f"{BASE_URL}/api/collect",
        headers=HEADERS
    )
    return response.json()

# Submit data for prediction
def predict_anomaly(sensor_data):
    payload = {"sensorData": sensor_data}
    response = requests.post(
        f"{BASE_URL}/api/predict",
        headers=HEADERS,
        data=json.dumps(payload)
    )
    return response.json()
```

### cURL Examples

```bash
# Get health status
curl -X GET http://localhost:3001/health

# Get recent sensor data
curl -H "Authorization: Bearer YOUR_API_KEY" \
     -X GET "http://localhost:3001/api/sensor-data?limit=10"

# Trigger manual data collection
curl -H "Authorization: Bearer YOUR_API_KEY" \
     -X POST http://localhost:3001/api/collect

# Submit data for prediction
curl -H "Authorization: Bearer YOUR_API_KEY" \
     -H "Content-Type: application/json" \
     -X POST http://localhost:3001/api/predict \
     -d '{
       "sensorData": {
         "timestamp": "2023-01-01T00:00:00.000Z",
         "vibration": "5.23",
         "temperature": "75.42",
         "pressure": "3.14",
         "flowRate": "25.67",
         "rotationalSpeed": "3500.00",
         "machineType": "Pump",
         "machineId": "M001",
         "role": "Agent"
       }
     }'
```

## Best Practices

1. **Rate Limiting**: Avoid making too many requests in a short period. The system is designed for periodic data collection.

2. **Error Handling**: Always check HTTP status codes and handle errors appropriately in your agent implementation.

3. **Data Validation**: Validate sensor data before submitting it for prediction to ensure all required fields are present.

4. **Security**: Keep API keys secure and do not expose them in client-side code or public repositories.

5. **Monitoring**: Regularly check the health endpoint to ensure the service is running properly.

## Support

For issues or questions about the API, contact the system administrator or refer to the system logs for detailed error information.


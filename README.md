
# Manufacturing Pipeline System

A comprehensive manufacturing monitoring system with real-time sensor data collection, anomaly detection using deep learning models, and natural language analysis with LLMs.

## System Overview

This system provides end-to-end monitoring for manufacturing equipment in semiconductor and other industrial environments. It collects sensor data, analyzes it for anomalies using machine learning models, and provides a dashboard for visualization and interaction.

### Key Features

- **Real-time Data Collection**: Collects sensor data every 5 seconds (configurable)
- **Anomaly Detection**: Uses LSTM neural networks to detect equipment anomalies
- **Dashboard Visualization**: Real-time charts and tables for monitoring
- **Natural Language Analysis**: LLM-powered insights using Ollama
- **Database Storage**: PostgreSQL for persistent data storage
- **Docker Deployment**: Containerized for easy deployment and scaling
- **API Access**: RESTful API for integration with other systems

### Components

1. **Data Pipeline Service** (`data-pipeline/`)
   - Node.js/Express application
   - Collects sensor data and runs predictions
   - Provides RESTful API

2. **Database** (`database/`)
   - PostgreSQL with initialization scripts
   - Docker Compose configuration

3. **Machine Learning Models** (`ml-models/`)
   - Python scripts for training and inference
   - LSTM models for time series anomaly detection

4. **Frontend Dashboard** (`frontend/`)
   - React application with real-time charts
   - LLM analysis panel for natural language queries

5. **Documentation** (`docs/`)
   - API guide for AI agents
   - System administration guide
   - User guide

## Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌──────────────────┐
│   Frontend      │    │  Data Pipeline   │    │   Database       │
│   (React)       │◄──►│   (Node.js)      │◄──►│ (PostgreSQL)     │
└─────────────────┘    └──────────────────┘    └──────────────────┘
                                │                         │
                                ▼                         ▼
                      ┌──────────────────┐    ┌──────────────────┐
                      │   ML Models      │    │   Ollama         │
                      │  (Python/TensorFlow) │ (LLM Service)    │
                      └──────────────────┘    └──────────────────┘
```

## Quick Start

### Prerequisites

- Docker and Docker Compose
- At least 8GB RAM

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd manufacturing_pipeline
   ```

2. Start the system:
   ```bash
   docker-compose up -d
   ```

3. Access the components:
   - Dashboard: http://localhost:3002
   - API: http://localhost:3001
   - Database Admin: http://localhost:8080
   - Ollama: http://localhost:11435

### Configuration

The system can be configured using environment variables in `data-pipeline/.env`:

- `COLLECTION_INTERVAL`: Data collection interval in seconds (default: 5)
- Database connection parameters
- Ollama service configuration

## API Usage

The system provides a RESTful API for integration with other systems. See `docs/api-guide.md` for detailed API documentation.

### Example API Calls

```bash
# Get health status
curl http://localhost:3001/health

# Get recent sensor data
curl http://localhost:3001/api/sensor-data

# Get recent predictions
curl http://localhost:3001/api/predictions

# Trigger manual data collection
curl -X POST http://localhost:3001/api/collect

# LLM analysis
curl -X POST http://localhost:3001/api/llm-analyze \
  -H "Content-Type: application/json" \
  -d '{"query": "What machines have shown unusual vibration patterns recently?"}'
```

## Machine Learning Models

The system uses LSTM neural networks for anomaly detection, with separate models for different machine types:

- Pumps
- Compressors
- Motors
- Valves

Models are trained using the scripts in `ml-models/` and stored as `.h5` files.

## Documentation

- [API Guide for AI Agents](docs/api-guide.md)
- [System Administration Guide](docs/system-administration-guide.md)
- [User Guide](docs/user-guide.md)

## Security

The system implements several security measures:

- API key authentication
- Data encryption in transit (HTTPS)
- Secure database connections
- Container isolation

For production deployments, additional security measures should be implemented:

- SSL termination with a reverse proxy
- Data encryption at rest
- Regular security updates
- Access control policies

## Troubleshooting

Common issues and solutions:

1. **Dashboard not loading**: Check that all services are running with `docker-compose ps`
2. **No data displayed**: Verify data collection is working by checking logs
3. **LLM analysis not working**: Ensure Ollama service is running and models are loaded

For detailed troubleshooting, see the System Administration Guide.

## Contributing

We welcome contributions to improve the system. Please follow these steps:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For issues or questions about the system:

1. Check the documentation
2. Review system logs
3. Contact the development team


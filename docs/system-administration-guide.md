
# System Administration Guide

This guide provides instructions for system administrators to deploy, configure, and maintain the Manufacturing Pipeline system.

## System Architecture

The Manufacturing Pipeline system consists of the following components:

1. **Data Pipeline Service** (Node.js/Express)
   - Collects sensor data at regular intervals
   - Runs machine learning models for anomaly detection
   - Stores data and predictions in the database
   - Provides RESTful API for data access

2. **Database** (PostgreSQL)
   - Stores sensor data, predictions, and analysis results
   - Manages user accounts and permissions

3. **Machine Learning Models** (Python/TensorFlow)
   - Trains and executes deep learning models for anomaly detection
   - Supports different models for different machine types

4. **Frontend Dashboard** (React)
   - Provides real-time visualization of sensor data and predictions
   - Allows users to interact with the system

5. **LLM Analysis Service** (Ollama)
   - Provides natural language analysis of manufacturing data
   - Integrates with the data pipeline service

## Deployment

### Prerequisites

- Docker and Docker Compose installed
- At least 8GB RAM and 20GB free disk space
- Internet connection for initial setup

### Deployment Steps

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd manufacturing_pipeline
   ```

2. Configure environment variables:
   - Edit `data-pipeline/.env` to set database credentials and other configurations
   - Edit `database/init-scripts/01-create-tables.sql` to customize database schema if needed

3. Start the system using Docker Compose:
   ```bash
   docker-compose up -d
   ```

4. Verify the deployment:
   - Data Pipeline API: http://localhost:3001/health
   - Database Adminer: http://localhost:8080/
   - Frontend Dashboard: http://localhost:3000/
   - Ollama API: http://localhost:11434/

### Configuration

#### Data Pipeline Service

The data pipeline service can be configured using environment variables in `data-pipeline/.env`:

- `PORT`: Port for the API service (default: 3001)
- `COLLECTION_INTERVAL`: Interval for data collection in seconds (default: 5)
- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`: Database connection parameters
- `OLLAMA_HOST`: Host for the Ollama service (default: http://localhost:11434)
- `OLLAMA_MODEL`: Model to use for LLM analysis (default: llama2)

#### Database

The database is automatically initialized with the required tables when the system starts for the first time. The schema is defined in `database/init-scripts/01-create-tables.sql`.

#### Machine Learning Models

Machine learning models are trained using the scripts in `ml-models/`. To train new models:

1. Prepare training data in the database
2. Run the training script:
   ```bash
   cd ml-models
   python train_model.py
   ```
3. The trained models will be saved as `.h5` files and can be used by the data pipeline service.

## Maintenance

### Monitoring

The system provides health check endpoints for monitoring:

- Data Pipeline: `GET /health`
- Database: Use Adminer interface at http://localhost:8080/

Log files are stored in the `data-pipeline/logs` directory.

### Backup and Recovery

Regular backups of the PostgreSQL database should be performed:

```bash
docker exec sensor_data_postgres pg_dump -U postgres sensor_data_db > backup.sql
```

To restore from a backup:

```bash
docker exec -i sensor_data_postgres psql -U postgres sensor_data_db < backup.sql
```

### Updates

To update the system:

1. Pull the latest code:
   ```bash
   git pull
   ```

2. Rebuild and restart the services:
   ```bash
   docker-compose down
   docker-compose up --build -d
   ```

## Security

### Authentication

The system uses API keys for authentication. API keys should be:

- Generated for each user or service
- Stored securely
- Revoked when no longer needed

### Data Encryption

All data is transmitted over HTTPS. For additional security:

- Use a reverse proxy with SSL termination
- Encrypt sensitive data at rest in the database
- Regularly update system components

## Troubleshooting

### Common Issues

1. **Database connection failed**
   - Check database credentials in `data-pipeline/.env`
   - Verify the database container is running: `docker-compose ps`

2. **Models not loading**
   - Check that model files exist in the `ml-models` directory
   - Verify file permissions

3. **LLM analysis not working**
   - Check that the Ollama service is running
   - Verify the model name in `data-pipeline/.env`

### Logs

Check logs for troubleshooting:

```bash
# Data Pipeline logs
docker logs sensor_data_pipeline

# Database logs
docker logs sensor_data_postgres

# Frontend logs
docker logs sensor_data_frontend

# Ollama logs
docker logs sensor_data_ollama
```

## Support

For issues or questions about the system, contact the development team or refer to the system logs for detailed error information.


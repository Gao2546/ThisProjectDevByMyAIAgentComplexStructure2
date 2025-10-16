
import numpy as np
import pandas as pd
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers
from sklearn.preprocessing import MinMaxScaler
from sklearn.metrics import mean_squared_error
import psycopg2
import os
import yaml
import logging
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Database connection parameters
DB_CONFIG = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'port': os.getenv('DB_PORT', '5433'),
    'database': os.getenv('DB_NAME', 'sensor_data_db'),
    'user': os.getenv('DB_USER', 'postgres'),
    'password': os.getenv('DB_PASSWORD', 'postgres')
}

def connect_to_db():
    """Create a connection to the PostgreSQL database"""
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        return conn
    except Exception as e:
        logger.error(f"Error connecting to database: {e}")
        return None

def load_data_from_db(machine_type, limit=10000):
    """
    Load sensor data from database for a specific machine type
    """
    conn = connect_to_db()
    if not conn:
        return None
    
    try:
        query = """
        SELECT timestamp, vibration, temperature, pressure, flow_rate, rotational_speed
        FROM sensor_data
        WHERE machine_type = %s
        ORDER BY timestamp DESC
        LIMIT %s
        """
        
        df = pd.read_sql_query(query, conn, params=(machine_type, limit))
        conn.close()
        
        # Convert timestamp to datetime
        df['timestamp'] = pd.to_datetime(df['timestamp'])
        df = df.sort_values('timestamp')
        
        logger.info(f"Loaded {len(df)} records for {machine_type}")
        return df
    except Exception as e:
        logger.error(f"Error loading data from database: {e}")
        conn.close()
        return None

def prepare_data(data):
    """
    Prepare data for DNN training
    """
    # Use all sensor values as features
    features = data[['vibration', 'temperature', 'pressure', 'flow_rate', 'rotational_speed']].values
    
    # Normalize the data
    scaler = MinMaxScaler()
    features_scaled = scaler.fit_transform(features)
    
    # For anomaly detection with DNN, we predict the same input values
    # This creates an autoencoder-like structure
    X = features_scaled
    y = features_scaled
    
    return X, y, scaler

def build_dnn_model(input_shape):
    """
    Build classic DNN model for anomaly detection
    """
    model = keras.Sequential([
        layers.Dense(64, activation='relu', input_shape=input_shape),
        layers.Dense(32, activation='relu'),
        layers.Dense(16, activation='relu'),
        layers.Dense(32, activation='relu'),
        layers.Dense(64, activation='relu'),
        layers.Dense(input_shape[0], activation='linear')  # Output layer with same number of features
    ])
    
    model.compile(optimizer='adam', loss='mean_squared_error')
    return model

def train_model_for_machine_type(machine_type):
    """
    Train DNN model for a specific machine type
    """
    logger.info(f"Starting training for {machine_type}")
    
    # Load data
    df = load_data_from_db(machine_type)
    if df is None or len(df) < 100:
        logger.warning(f"Not enough data for {machine_type}")
        return None
    
    # Prepare data for DNN
    X, y, scaler = prepare_data(df)
    
    if len(X) < 10:
        logger.warning(f"Not enough data for {machine_type}")
        return None
    
    # Split data
    split_idx = int(0.8 * len(X))
    X_train, X_test = X[:split_idx], X[split_idx:]
    y_train, y_test = y[:split_idx], y[split_idx:]
    
    # Build model
    model = build_dnn_model((X_train.shape[1],))
    
    # Train model
    history = model.fit(
        X_train, y_train,
        batch_size=32,
        epochs=50,
        validation_data=(X_test, y_test),
        verbose=1
    )
    
    # Evaluate model
    train_loss = model.evaluate(X_train, y_train, verbose=0)
    test_loss = model.evaluate(X_test, y_test, verbose=0)
    
    logger.info(f"Model for {machine_type} - Train Loss: {train_loss}, Test Loss: {test_loss}")
    
    # Save model
    model_filename = f"{machine_type.lower()}_model.h5"
    model.save(model_filename)
    logger.info(f"Model saved as {model_filename}")
    
    # Save scaler
    import joblib
    scaler_filename = f"{machine_type.lower()}_scaler.pkl"
    joblib.dump(scaler, scaler_filename)
    logger.info(f"Scaler saved as {scaler_filename}")
    
    return {
        'model': model,
        'scaler': scaler,
        'train_loss': train_loss,
        'test_loss': test_loss,
        'model_filename': model_filename,
        'scaler_filename': scaler_filename
    }

def main():
    """
    Main function to train models for all machine types
    """
    # Define machine types
    machine_types = ['Pump', 'Compressor', 'Motor', 'Valve']
    
    # Train models for each machine type
    trained_models = {}
    
    for machine_type in machine_types:
        try:
            result = train_model_for_machine_type(machine_type)
            if result:
                trained_models[machine_type] = result
                logger.info(f"Successfully trained model for {machine_type}")
            else:
                logger.warning(f"Failed to train model for {machine_type}")
        except Exception as e:
            logger.error(f"Error training model for {machine_type}: {e}")
    
    # Save training results
    results = {
        'trained_models': list(trained_models.keys()),
        'timestamp': pd.Timestamp.now().isoformat()
    }
    
    with open('training_results.yaml', 'w') as f:
        yaml.dump(results, f)
    
    logger.info("Training completed")
    return trained_models

if __name__ == "__main__":
    main()



import numpy as np
import pandas as pd
import tensorflow as tf
from sklearn.preprocessing import MinMaxScaler
import joblib
import os
import logging
from dotenv import load_dotenv
import psycopg2

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Database connection parameters
DB_CONFIG = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'port': os.getenv('DB_PORT', '5432'),
    'database': os.getenv('DB_NAME', 'sensor_data_db'),
    'user': os.getenv('DB_USER', 'postgres'),
    'password': os.getenv('DB_PASSWORD', 'postgres')
}

class ModelPredictor:
    def __init__(self):
        self.models = {}
        self.scalers = {}
        self.load_models()
    
    def load_models(self):
        """
        Load all trained models and scalers
        """
        machine_types = ['Pump', 'Compressor', 'Motor', 'Valve']
        
        for machine_type in machine_types:
            try:
                model_filename = f"../ml-models/{machine_type.lower()}_model.h5"
                scaler_filename = f"../ml-models/{machine_type.lower()}_scaler.pkl"
                
                if os.path.exists(model_filename) and os.path.exists(scaler_filename):
                    model = tf.keras.models.load_model(model_filename)
                    scaler = joblib.load(scaler_filename)
                    
                    self.models[machine_type] = model
                    self.scalers[machine_type] = scaler
                    
                    logger.info(f"Loaded model and scaler for {machine_type}")
                else:
                    logger.warning(f"Model files not found for {machine_type}")
            except Exception as e:
                logger.error(f"Error loading model for {machine_type}: {e}")
    
    def preprocess_data(self, data, machine_type):
        """
        Preprocess sensor data for prediction
        """
        if machine_type not in self.scalers:
            raise ValueError(f"No scaler found for machine type: {machine_type}")
        
        # Extract features
        features = np.array([[
            data['vibration'],
            data['temperature'],
            data['pressure'],
            data['flowRate'],
            data['rotationalSpeed']
        ]])
        
        # Normalize using the loaded scaler
        scaler = self.scalers[machine_type]
        features_scaled = scaler.transform(features)
        
        return features_scaled
    
    def predict_anomaly(self, data, machine_type):
        """
        Predict anomaly for a single data point
        """
        if machine_type not in self.models:
            raise ValueError(f"No model found for machine type: {machine_type}")
        
        try:
            # Preprocess the data
            features_scaled = self.preprocess_data(data, machine_type)
            
            # Make prediction using DNN model (input format: [batch, features])
            model = self.models[machine_type]
            prediction = model.predict(features_scaled, verbose=0)
            
            # Calculate reconstruction error (MSE)
            mse = np.mean(np.power(features_scaled - prediction, 2))
            
            # Define threshold for anomaly (this should be tuned based on training data)
            threshold = 0.01
            
            # Determine if anomaly
            is_anomaly = mse > threshold
            anomaly_probability = min(mse / (threshold * 2), 1.0)  # Normalize probability
            
            return {
                'timestamp': data['timestamp'],
                'machineId': data['machineId'],
                'machineType': machine_type,
                'anomalyProbability': float(anomaly_probability),
                'isAnomaly': bool(is_anomaly),
                'mse': float(mse),
                'predictionDetails': {
                    'confidence': float(1 - anomaly_probability),
                    'recommendedAction': 'Inspect immediately' if is_anomaly else 'No action required'
                }
            }
        except Exception as e:
            logger.error(f"Error during prediction for {machine_type}: {e}")
            raise
    
    def get_machine_types(self):
        """
        Get list of available machine types
        """
        return list(self.models.keys())

# Global instance
predictor = ModelPredictor()

def get_predictor():
    """
    Get the global predictor instance
    """
    return predictor

def connect_to_db():
    """
    Create a connection to the PostgreSQL database
    """
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        return conn
    except Exception as e:
        logger.error(f"Error connecting to database: {e}")
        return None

def save_sensor_data_to_db(data):
    """
    Save sensor data to database
    """
    conn = connect_to_db()
    if not conn:
        return False
    
    try:
        cursor = conn.cursor()
        
        insert_query = """
        INSERT INTO sensor_data 
        (timestamp, vibration, temperature, pressure, flow_rate, rotational_speed, machine_type, machine_id, role)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        """
        
        cursor.execute(insert_query, (
            data['timestamp'],
            data['vibration'],
            data['temperature'],
            data['pressure'],
            data['flowRate'],
            data['rotationalSpeed'],
            data['machineType'],
            data['machineId'],
            data['role']
        ))
        
        conn.commit()
        cursor.close()
        conn.close()
        
        logger.info(f"Saved sensor data for machine {data['machineId']}")
        return True
    except Exception as e:
        logger.error(f"Error saving sensor data to database: {e}")
        conn.rollback()
        cursor.close()
        conn.close()
        return False

def save_prediction_to_db(prediction):
    """
    Save prediction result to database
    """
    conn = connect_to_db()
    if not conn:
        return False
    
    try:
        cursor = conn.cursor()
        
        insert_query = """
        INSERT INTO prediction_results 
        (timestamp, machine_id, machine_type, anomaly_probability, is_anomaly, prediction_details)
        VALUES (%s, %s, %s, %s, %s, %s)
        """
        
        cursor.execute(insert_query, (
            prediction['timestamp'],
            prediction['machineId'],
            prediction['machineType'],
            prediction['anomalyProbability'],
            prediction['isAnomaly'],
            json.dumps(prediction['predictionDetails'])
        ))
        
        conn.commit()
        cursor.close()
        conn.close()
        
        logger.info(f"Saved prediction for machine {prediction['machineId']}")
        return True
    except Exception as e:
        logger.error(f"Error saving prediction to database: {e}")
        conn.rollback()
        cursor.close()
        conn.close()
        return False

# For testing purposes
if __name__ == "__main__":
    import json
    import random
    
    # Test data
    test_data = {
        'timestamp': '2023-01-01T00:00:00Z',
        'vibration': random.uniform(0, 10),
        'temperature': random.uniform(20, 120),
        'pressure': random.uniform(1, 11),
        'flowRate': random.uniform(0, 50),
        'rotationalSpeed': random.uniform(1000, 6000),
        'machineType': 'Pump',
        'machineId': 'M001',
        'role': 'System'
    }
    
    try:
        # Test prediction
        result = predictor.predict_anomaly(test_data, 'Pump')
        print("Prediction result:", json.dumps(result, indent=2))
    except Exception as e:
        print(f"Error during prediction: {e}")


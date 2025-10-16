
#!/usr/bin/env python3
"""
Interface script for Node.js to communicate with the ML predictor.
This script reads input data from stdin, runs the prediction, and outputs the result as JSON.
"""

import sys
import json
import os
import logging

# Add the current directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Import the predictor
try:
    from model_predictor import get_predictor
    predictor = get_predictor()
except Exception as e:
    logging.error(f"Error importing predictor: {e}")
    sys.exit(1)

def main():
    try:
        # Read input data from stdin
        input_data = sys.stdin.read()
        if not input_data:
            raise ValueError("No input data received")
        
        # Parse the JSON input
        data = json.loads(input_data)
        
        # Validate required fields
        required_fields = ['timestamp', 'vibration', 'temperature', 'pressure', 
                          'flowRate', 'rotationalSpeed', 'machineType', 'machineId']
        for field in required_fields:
            if field not in data:
                raise ValueError(f"Missing required field: {field}")
        
        # Run prediction
        result = predictor.predict_anomaly(data, data['machineType'])
        
        # Output result as JSON
        print(json.dumps(result))
        
    except Exception as e:
        logging.error(f"Error in predictor interface: {e}")
        # Output error as JSON for Node.js to handle
        error_result = {
            "error": str(e),
            "timestamp": data.get('timestamp', ''),
            "machineId": data.get('machineId', ''),
            "machineType": data.get('machineType', ''),
            "anomalyProbability": 0.0,
            "isAnomaly": False,
            "predictionDetails": {
                "confidence": 0.0,
                "recommendedAction": "Error occurred during prediction"
            }
        }
        print(json.dumps(error_result))
        sys.exit(1)

if __name__ == "__main__":
    main()


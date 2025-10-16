
# User Guide

This guide provides instructions for users to interact with the Manufacturing Pipeline Dashboard and understand the system's features.

## Getting Started

### Accessing the Dashboard

To access the Manufacturing Pipeline Dashboard:

1. Open your web browser
2. Navigate to the dashboard URL (typically http://localhost:3002)
3. The dashboard will load automatically, displaying real-time sensor data and predictions

### Dashboard Overview

The dashboard is organized into several sections:

1. **Header**: Contains the dashboard title and "Collect Data Now" button
2. **Recent Anomalies**: Displays alerts for any detected anomalies
3. **Controls**: Allows filtering data by machine and time range
4. **Sensor Data Chart**: Visualizes sensor readings over time
5. **LLM Analysis Panel**: Enables natural language queries about the data
6. **Recent Predictions**: Lists recent anomaly detection results
7. **Recent Sensor Data**: Shows raw sensor readings

## Using the Dashboard

### Viewing Sensor Data

The main chart displays sensor readings over time, including:

- Vibration
- Temperature
- Pressure
- Flow Rate
- Rotational Speed

To customize the view:

1. Use the "Machine" dropdown to filter by specific equipment
2. Use the "Time Range" dropdown to adjust the time window

### Monitoring Anomalies

The system continuously monitors equipment for anomalies. When an anomaly is detected:

1. It appears in the "Recent Anomalies" section at the top of the dashboard
2. It is marked in the "Recent Predictions" table with a red indicator
3. Details include the machine ID, type, probability, and recommended action

### LLM Data Analysis

The LLM Analysis Panel allows you to ask questions about the manufacturing data in natural language:

1. Enter your question in the text area (e.g., "Which machines have shown unusual vibration patterns recently?")
2. Click "Analyze Data"
3. The system will process your query and display the results

Examples of useful queries:
- "What machines have shown unusual vibration patterns recently?"
- "Which machine types are most prone to temperature anomalies?"
- "Show me a summary of anomalies detected in the last 24 hours"

### Manual Data Collection

To manually trigger data collection:

1. Click the "Collect Data Now" button in the header
2. The system will collect new sensor data and run predictions
3. The dashboard will update automatically with the new information

## Understanding the Data

### Sensor Readings

Each sensor reading includes:

- **Timestamp**: When the data was collected
- **Machine ID**: Unique identifier for the equipment
- **Machine Type**: Category of equipment (Pump, Compressor, Motor, Valve)
- **Vibration**: Measured in mm/s
- **Temperature**: Measured in °C
- **Pressure**: Measured in bar
- **Flow Rate**: Measured in L/min
- **Rotational Speed**: Measured in RPM

### Prediction Results

Each prediction includes:

- **Timestamp**: When the prediction was made
- **Machine ID**: Unique identifier for the equipment
- **Machine Type**: Category of equipment
- **Status**: Normal or Anomaly
- **Probability**: Likelihood of an anomaly (0-100%)
- **Confidence**: Model's confidence in the prediction (0-100%)
- **Recommended Action**: Suggested response to the prediction

## Best Practices

### Monitoring

- Regularly check the dashboard for new anomalies
- Pay attention to patterns in the sensor data charts
- Use the LLM analysis panel to gain deeper insights

### Response to Anomalies

- When an anomaly is detected, follow the recommended action
- Document any actions taken in response to anomalies
- If an anomaly persists, consider escalating to maintenance personnel

### Data Analysis

- Use the filtering controls to focus on specific equipment or time periods
- Combine visual analysis of charts with LLM queries for comprehensive insights
- Regularly review historical data to identify trends

## Troubleshooting

### Common Issues

1. **Dashboard not loading**
   - Check your internet connection
   - Verify the system is running (contact your administrator)
   - Try refreshing the page

2. **No data displayed**
   - Check that sensors are properly connected
   - Verify the data collection service is running
   - Try clicking "Collect Data Now" to force a data collection

3. **LLM analysis not working**
   - Ensure your query is clear and specific
   - Check that data is available in the system
   - Try rephrasing your question

### Getting Help

If you encounter issues not covered in this guide:

1. Contact your system administrator
2. Check the system logs for error messages
3. Refer to the System Administration Guide for more detailed troubleshooting

## Support

For issues or questions about the system, contact your system administrator or refer to the system logs for detailed error information.


import os
import joblib
import numpy as np

# -----------------------------------------------------------------------------
# 1. Load the Saved Neural Network Model
# -----------------------------------------------------------------------------
model_filename = "neural_network_model.joblib"

if not os.path.exists(model_filename):
    print(f"Error: '{model_filename}' not found.")
    print("Please run 'python train_nn.py' first to train and save the model.")
    exit(1)

model = joblib.load(model_filename)

# -----------------------------------------------------------------------------
# 2. Define Test Student Profile
# -----------------------------------------------------------------------------
# You can change these values to test any scenario:
study_hours = 6.5
practice_tests = 2

# Reshape into a 2D array: shape (1, 2)
new_student = np.array([[study_hours, practice_tests]])

# -----------------------------------------------------------------------------
# 3. Make Prediction
# -----------------------------------------------------------------------------
predicted_score = model.predict(new_student)[0]
# Cap the score reasonably between 0 and 100
predicted_score = max(0.0, min(100.0, predicted_score))

print("=" * 60)
print("NEURAL NETWORK PREDICTION RESULT")
print("=" * 60)
print(f"Input Features:")
print(f"  - Study Hours        : {study_hours} hrs")
print(f"  - Practice Tests     : {practice_tests} tests")
print("-" * 60)
print(f"Predicted Exam Score  : {predicted_score:.1f} / 100")
print("=" * 60)
print("Tip: Modify 'study_hours' and 'practice_tests' in predict_nn.py to test other cases.")

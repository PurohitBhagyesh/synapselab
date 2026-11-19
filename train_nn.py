import numpy as np
from sklearn.neural_network import MLPRegressor
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline
import joblib

# -----------------------------------------------------------------------------
# 1. Training Dataset
# -----------------------------------------------------------------------------
# Features: [Study Hours, Practice Tests]
X_train = np.array([
    [1.0, 0.0],
    [2.0, 1.0],
    [3.0, 1.0],
    [4.0, 2.0],
    [5.0, 2.0],
    [6.0, 3.0],
    [7.0, 3.0],
    [8.0, 4.0],
    [9.0, 5.0],
    [10.0, 5.0],
    [12.0, 6.0],
    [14.0, 8.0]
])

# Target: Exam Score (out of 100)
# Notice non-linear effects: score gains taper off at high hours (diminishing returns)
y_train = np.array([45.0, 52.0, 58.0, 65.0, 70.0, 78.0, 83.0, 89.0, 93.0, 96.0, 98.0, 99.5])

# -----------------------------------------------------------------------------
# 2. Neural Network Architecture Definition
# -----------------------------------------------------------------------------
# Pipeline:
#   Step 1: StandardScaler -> scales inputs to zero-mean, unit-variance
#   Step 2: MLPRegressor (Multi-Layer Perceptron)
#           - hidden_layer_sizes=(8, 4): Layer 1 has 8 neurons, Layer 2 has 4 neurons
#           - activation='relu': Non-linear ReLU activation for hidden layers
#           - solver='lbfgs': Fast, exact convergence optimizer for small datasets
#           - max_iter=2000: Maximum training iterations
nn_model = Pipeline([
    ('scaler', StandardScaler()),
    ('mlp', MLPRegressor(
        hidden_layer_sizes=(8, 4),
        activation='relu',
        solver='lbfgs',
        max_iter=2000,
        random_state=42
    ))
])

# -----------------------------------------------------------------------------
# 3. Train the Neural Network
# -----------------------------------------------------------------------------
print("=" * 60)
print("TRAINING MULTI-LAYER PERCEPTRON (NEURAL NETWORK)")
print("=" * 60)
print(f"Dataset Size: {len(X_train)} samples")
print("Architecture : Input(2) -> Hidden1(8, ReLU) -> Hidden2(4, ReLU) -> Output(1)")
print("Optimizer    : L-BFGS (Quasi-Newton)")

nn_model.fit(X_train, y_train)

mlp_step = nn_model.named_steps['mlp']
print(f"\nTraining completed in {mlp_step.n_iter_} iterations.")
print(f"Final Training Loss (MSE): {mlp_step.loss_:.4f}")

# Inspect weights
weights = mlp_step.coefs_
biases = mlp_step.intercepts_
total_params = sum(w.size for w in weights) + sum(b.size for b in biases)
print(f"Total Learnable Parameters: {total_params} (Weights + Biases)")

# -----------------------------------------------------------------------------
# 4. Save Model to Disk
# -----------------------------------------------------------------------------
model_filename = "neural_network_model.joblib"
joblib.dump(nn_model, model_filename)
print(f"\nTrained Neural Network successfully saved to '{model_filename}'!\n")

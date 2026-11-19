"""
Neural Network Built From Scratch with Pure NumPy
------------------------------------------------
Demonstrates the raw math:
  1. Weight and Bias initialization
  2. Forward Propagation (Linear combination -> ReLU -> Linear output)
  3. Mean Squared Error (MSE) Loss
  4. Backpropagation (Chain Rule to calculate gradients)
  5. Gradient Descent (Updating weights & biases)
"""

import numpy as np

# -----------------------------------------------------------------------------
# 1. Activation Functions & Derivatives
# -----------------------------------------------------------------------------
def relu(z):
    return np.maximum(0, z)

def relu_derivative(z):
    return (z > 0).astype(float)

# -----------------------------------------------------------------------------
# 2. Neural Network Class
# -----------------------------------------------------------------------------
class SimpleNeuralNetwork:
    def __init__(self, input_dim=2, hidden1_dim=8, hidden2_dim=4, output_dim=1):
        np.random.seed(42)
        # He initialization for ReLU layers
        self.W1 = np.random.randn(input_dim, hidden1_dim) * np.sqrt(2.0 / input_dim)
        self.b1 = np.zeros((1, hidden1_dim))

        self.W2 = np.random.randn(hidden1_dim, hidden2_dim) * np.sqrt(2.0 / hidden1_dim)
        self.b2 = np.zeros((1, hidden2_dim))

        self.W3 = np.random.randn(hidden2_dim, output_dim) * np.sqrt(2.0 / hidden2_dim)
        self.b3 = np.zeros((1, output_dim))

    def forward(self, X):
        # Layer 1
        self.Z1 = np.dot(X, self.W1) + self.b1
        self.A1 = relu(self.Z1)

        # Layer 2
        self.Z2 = np.dot(self.A1, self.W2) + self.b2
        self.A2 = relu(self.Z2)

        # Output Layer (Linear)
        self.Z3 = np.dot(self.A2, self.W3) + self.b3
        self.y_hat = self.Z3
        return self.y_hat

    def backward(self, X, y, y_hat, learning_rate=0.01):
        m = X.shape[0]

        # Output layer gradient (MSE derivative: dL/dy_hat = 2*(y_hat - y)/m)
        dZ3 = (2 / m) * (y_hat - y)
        dW3 = np.dot(self.A2.T, dZ3)
        db3 = np.sum(dZ3, axis=0, keepdims=True)

        # Hidden layer 2 gradient
        dA2 = np.dot(dZ3, self.W3.T)
        dZ2 = dA2 * relu_derivative(self.Z2)
        dW2 = np.dot(self.A1.T, dZ2)
        db2 = np.sum(dZ2, axis=0, keepdims=True)

        # Hidden layer 1 gradient
        dA1 = np.dot(dZ2, self.W2.T)
        dZ1 = dA1 * relu_derivative(self.Z1)
        dW1 = np.dot(X.T, dZ1)
        db1 = np.sum(dZ1, axis=0, keepdims=True)

        # Gradient Descent parameter updates
        self.W3 -= learning_rate * dW3
        self.b3 -= learning_rate * db3
        self.W2 -= learning_rate * dW2
        self.b2 -= learning_rate * db2
        self.W1 -= learning_rate * dW1
        self.b1 -= learning_rate * db1

    def train(self, X, y, epochs=1000, lr=0.01):
        for epoch in range(1, epochs + 1):
            y_hat = self.forward(X)
            loss = np.mean((y_hat - y) ** 2)
            self.backward(X, y, y_hat, learning_rate=lr)

            if epoch % 200 == 0 or epoch == 1:
                print(f"Epoch {epoch:4d} / {epochs} | MSE Loss: {loss:.4f}")

# -----------------------------------------------------------------------------
# 3. Demonstration
# -----------------------------------------------------------------------------
if __name__ == "__main__":
    print("=" * 60)
    print("DEMO: TRAINING NEURAL NETWORK FROM SCRATCH (NUMPY)")
    print("=" * 60)

    # Features: [Hours, Tests]
    X = np.array([
        [1.0, 0.0], [2.0, 1.0], [3.0, 1.0], [4.0, 2.0],
        [5.0, 2.0], [6.0, 3.0], [7.0, 3.0], [8.0, 4.0],
        [9.0, 5.0], [10.0, 5.0]
    ])
    # Target: Exam Scores
    y = np.array([[45.0], [52.0], [58.0], [65.0], [70.0], [78.0], [83.0], [89.0], [94.0], [98.0]])

    # Normalize inputs for training stability
    mean = np.mean(X, axis=0)
    std = np.std(X, axis=0) + 1e-8
    X_norm = (X - mean) / std

    nn = SimpleNeuralNetwork(input_dim=2, hidden1_dim=8, hidden2_dim=4, output_dim=1)
    nn.train(X_norm, y, epochs=1000, lr=0.02)

    # Predict for 6.5 hours and 2 tests
    test_input = np.array([[6.5, 2.0]])
    test_norm = (test_input - mean) / std
    pred = nn.forward(test_norm)[0][0]
    print("-" * 60)
    print(f"Prediction for 6.5 Study Hours & 2 Practice Tests: {pred:.1f} / 100")
    print("=" * 60)

# SynapseLab: 3D Visualization Simulator for Students
# File: network_threads.py
# Pure Python neural network forward pass and signal demonstration

import math
import random

# Layer Architecture: [Input, Hidden1, Hidden2, Output]
layers = [3, 8, 4, 1]

# Hyperparameters
activation = "relu"
learning_rate = 0.05
epochs = 300


def relu(x):
    return max(0.0, x)


def sigmoid(x):
    return 1.0 / (1.0 + math.exp(-max(-500.0, min(500.0, x))))


def apply_activation(x, func="relu"):
    if func == "relu":
        return relu(x)
    elif func == "sigmoid":
        return sigmoid(x)
    return x


class NetworkThreads:
    def __init__(self, layer_sizes, act="relu"):
        self.layer_sizes = layer_sizes
        self.activation = act
        self.weights = []
        self.biases = []

        # Deterministic initialization for reproducible student runs
        random.seed(42)
        for i in range(len(layer_sizes) - 1):
            src = layer_sizes[i]
            dst = layer_sizes[i + 1]
            w = [[random.uniform(-0.8, 0.8) for _ in range(dst)] for _ in range(src)]
            b = [0.0 for _ in range(dst)]
            self.weights.append(w)
            self.biases.append(b)

    def forward(self, inputs):
        current = list(inputs)
        all_activations = [current]

        for w, b in zip(self.weights, self.biases):
            next_layer = []
            for j in range(len(b)):
                z = sum(current[i] * w[i][j] for i in range(len(current))) + b[j]
                next_layer.append(apply_activation(z, self.activation))
            current = next_layer
            all_activations.append(current)

        return current, all_activations


if __name__ == "__main__":
    print("SynapseLab Neural Network Initialized")
    print(f"Architecture: {layers}")
    print(f"Activation: {activation} | Learning Rate: {learning_rate} | Epochs: {epochs}")

    nn = NetworkThreads(layers, act=activation)
    sample_input = [1.0, 0.5, -0.2]
    output, activations = nn.forward(sample_input)

    print("\nForward Pass Signal Trace:")
    for l_idx, act in enumerate(activations):
        name = "Input" if l_idx == 0 else ("Output" if l_idx == len(activations) - 1 else f"Hidden {l_idx}")
        formatted = [f"{val:.3f}" for val in act]
        print(f"  Layer {l_idx} ({name}): [{', '.join(formatted)}]")

    print(f"\nFinal Endpoint Prediction: {output}")

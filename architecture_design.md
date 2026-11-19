# Neural Network Architecture Design

## 1. Overview
A **Multi-Layer Perceptron (MLP)** Feedforward Neural Network designed to learn both linear and non-linear patterns from input features.

---

## 2. Visual Architecture Diagram

```
[ INPUT LAYER ]              [ HIDDEN LAYER 1 ]           [ HIDDEN LAYER 2 ]          [ OUTPUT LAYER ]
 (2 Features)                   (8 Neurons)                  (4 Neurons)                 (1 Output)

   ( X1: Hours )  ---------\
                             ===> [ N1_1 (ReLU) ] ---\
                                  [ N1_2 (ReLU) ]     \
                                  [ N1_3 (ReLU) ]      ===> [ N2_1 (ReLU) ] ---\
                                  [ N1_4 (ReLU) ]           [ N2_2 (ReLU) ]     \
                                  [ N1_5 (ReLU) ]           [ N2_3 (ReLU) ]      ===> [ Output: Score ]
                                  [ N1_6 (ReLU) ]           [ N2_4 (ReLU) ]     /     (Linear / Value)
                             ===> [ N1_7 (ReLU) ]     /                        /
   ( X2: Tests )  ---------/      [ N1_8 (ReLU) ] ---/------------------------/

      Input                     Weights: 2x8 + 8             Weights: 8x4 + 4            Weights: 4x1 + 1
   [x1, x2]                        (24 params)                  (36 params)                 (5 params)
                                                                               Total Parameters = 65
```

---

## 3. Layer Specifications

| Layer | Type | Neurons | Activation Function | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| **Input Layer** | Input | 2 | None (Passthrough) | Receives raw features: Study Hours ($x_1$) & Practice Tests ($x_2$). |
| **Feature Scaler** | Preprocessing | 2 | Z-Score Normalization | Normalizes features to mean=0, std=1 for stable gradient descent. |
| **Hidden Layer 1**| Dense (FC) | 8 | ReLU ($f(z) = \max(0, z)$) | Extracts complex non-linear combinations of the input features. |
| **Hidden Layer 2**| Dense (FC) | 4 | ReLU ($f(z) = \max(0, z)$) | Compresses feature representations into higher-level abstract patterns. |
| **Output Layer**  | Dense (FC) | 1 | Linear / Identity ($f(z) = z$) | Produces continuous prediction (e.g., Final Exam Score out of 100). |

---

## 4. Mathematical Foundation

### Forward Propagation
For each layer $l$ with weights $W^{[l]}$, bias $b^{[l]}$, and activation function $g^{[l]}$:
1. **Linear Combination**:
   $$Z^{[l]} = A^{[l-1]} W^{[l]} + b^{[l]}$$
2. **Activation**:
   $$A^{[l]} = g^{[l]}(Z^{[l]})$$

### Loss Function
**Mean Squared Error (MSE)**:
$$\mathcal{L}(y, \hat{y}) = \frac{1}{N} \sum_{i=1}^{N} (y_i - \hat{y}_i)^2$$

### Optimization & Backpropagation
- **Optimizer**: Adam (Adaptive Moment Estimation) or L-BFGS (Quasi-Newton method optimized for smaller datasets).
- **Update Rule**:
  $$W \leftarrow W - \eta \cdot \frac{\partial \mathcal{L}}{\partial W}$$
  $$b \leftarrow b - \eta \cdot \frac{\partial \mathcal{L}}{\partial b}$$
  *(where $\eta$ is the learning rate).*

---

## 5. Comparison: Linear Regression vs Neural Network

| Feature | Linear Regression (`simple_ml_model`) | Neural Network (`neural_network_project`) |
| :--- | :--- | :--- |
| **Architecture** | Single equation ($y = w_1x_1 + w_2x_2 + b$) | Multi-layer graph with hidden neurons and non-linear activations |
| **Complexity** | 3 parameters total | 65 parameters across 3 weight matrices & biases |
| **Relationships** | Strictly straight-line (linear) | Can model curves, diminishing returns, and feature interactions |
| **Activation** | No activation function | ReLU (Rectified Linear Unit) enables non-linear learning |
| **Optimization** | Closed-form Ordinary Least Squares | Iterative backpropagation & gradient descent |

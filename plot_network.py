"""
Python Script to Draw Neural Network Architecture with All Connecting Threads
-----------------------------------------------------------------------------
Generates 'neural_network_threads.png' illustrating all layers, nodes,
and interconnecting synapses (threads) with weight-based styling.
"""

import matplotlib.pyplot as plt
import numpy as np

def draw_neural_network(layer_sizes, layer_names=None, filename="neural_network_threads.png"):
    fig = plt.figure(figsize=(12, 8), facecolor='#0f172a')
    ax = fig.add_subplot(1, 1, 1)
    ax.axis('off')

    num_layers = len(layer_sizes)
    v_spacing = 1.0
    h_spacing = 2.5

    # Compute node coordinates
    nodes = {}
    for layer_idx, num_nodes in enumerate(layer_sizes):
        layer_x = layer_idx * h_spacing
        layer_y_top = (num_nodes - 1) * v_spacing / 2.0
        nodes[layer_idx] = []
        for node_idx in range(num_nodes):
            layer_y = layer_y_top - node_idx * v_spacing
            nodes[layer_idx].append((layer_x, layer_y))

    # Draw all connecting threads (synapses)
    np.random.seed(42)
    thread_count = 0
    for layer_idx in range(num_layers - 1):
        for src_x, src_y in nodes[layer_idx]:
            for dst_x, dst_y in nodes[layer_idx + 1]:
                # Simulated weight strength: positive (cyan) vs negative (magenta/orange)
                weight = np.random.uniform(-1, 1)
                color = '#38bdf8' if weight >= 0 else '#fb923c'
                alpha = np.interp(abs(weight), [0, 1], [0.25, 0.75])
                lw = np.interp(abs(weight), [0, 1], [0.8, 2.5])

                # Draw the connecting line ("thread")
                ax.plot([src_x, dst_x], [src_y, dst_y], color=color, alpha=alpha, linewidth=lw, zorder=1)
                thread_count += 1

    # Draw neurons (nodes)
    layer_colors = ['#34d399', '#60a5fa', '#a78bfa', '#f43f5e']
    for layer_idx, coords in nodes.items():
        node_color = layer_colors[layer_idx % len(layer_colors)]
        for node_idx, (x, y) in enumerate(coords):
            # Outer glow circle
            glow = plt.Circle((x, y), radius=0.28, color=node_color, alpha=0.3, zorder=2)
            ax.add_patch(glow)
            # Inner solid circle
            circle = plt.Circle((x, y), radius=0.20, color=node_color, ec='#ffffff', lw=1.5, zorder=3)
            ax.add_patch(circle)

            # Node label text
            label = f"$N_{{{layer_idx},{node_idx+1}}}$"
            if layer_idx == 0:
                label = "Hours" if node_idx == 0 else "Tests"
            elif layer_idx == num_layers - 1:
                label = "Score"
            ax.text(x, y - 0.38, label, color='#e2e8f0', fontsize=9, ha='center', va='top', fontweight='bold', zorder=4)

    # Add Layer Titles
    if layer_names:
        for layer_idx, name in enumerate(layer_names):
            x = nodes[layer_idx][0][0]
            max_y = max(y for _, y in nodes[layer_idx])
            ax.text(x, max_y + 0.8, name, color='#38bdf8', fontsize=12, ha='center', va='bottom', fontweight='heavy')
            ax.text(x, max_y + 0.5, f"({layer_sizes[layer_idx]} nodes)", color='#94a3b8', fontsize=9, ha='center', va='bottom')

    # Add Info Box & Legend
    title_text = "MULTI-LAYER PERCEPTRON (NEURAL NETWORK) ARCHITECTURE"
    fig.suptitle(title_text, color='#f8fafc', fontsize=15, fontweight='bold', y=0.96)
    subtitle = f"Total Interconnecting Threads: {thread_count} Synapses | Cyan = Positive Weights, Orange = Negative Weights"
    ax.text(h_spacing * (num_layers - 1) / 2.0, -4.5, subtitle, color='#94a3b8', fontsize=10, ha='center')

    # Adjust limits
    all_x = [x for layer in nodes.values() for x, _ in layer]
    all_y = [y for layer in nodes.values() for _, y in layer]
    ax.set_xlim(min(all_x) - 1.2, max(all_x) + 1.2)
    ax.set_ylim(min(all_y) - 1.5, max(all_y) + 1.5)

    plt.tight_layout()
    plt.savefig(filename, dpi=300, bbox_inches='tight', facecolor=fig.get_facecolor(), edgecolor='none')
    plt.close()
    print(f"Neural network thread diagram saved successfully as '{filename}'!")

if __name__ == "__main__":
    layers = [2, 8, 4, 1]
    names = ["Input Layer", "Hidden Layer 1 (ReLU)", "Hidden Layer 2 (ReLU)", "Output Layer"]
    draw_neural_network(layers, names, "neural_network_threads.png")

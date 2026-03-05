import numpy as np

X_filepth = "data/processed/X_train.npy"
y_filepth = "data/processed/y_train.npy"

X_test = np.load(X_filepth)
y_test = np.load(y_filepth)
print(f"X_test shape: {X_test.shape}")
print(f"y_test shape: {y_test.shape}")
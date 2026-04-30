import torch
import numpy as np
from sklearn.metrics import classification_report, accuracy_score
from model import IllegalLoggingModel

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

X_test = torch.tensor(np.load("../data/processed/X_test.npy"), dtype=torch.float32)
y_test = np.load("../data/processed/y_test.npy")

model = IllegalLoggingModel()
model.load_state_dict(torch.load("../outputs_model.pt"))
model.to(device)
model.eval()

with torch.no_grad():
    outputs = model(X_test.to(device))
    preds = torch.argmax(outputs, dim=1).cpu().numpy()

print(classification_report(y_test, preds))
print(f"Accuracy: {accuracy_score(y_test, preds)}")
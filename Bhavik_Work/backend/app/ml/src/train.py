import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader, TensorDataset
import numpy as np
from model import IllegalLoggingModel
from tqdm import tqdm

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

X_train = torch.tensor(np.load("../data/processed/X_train.npy"), dtype=torch.float32)
y_train = torch.tensor(np.load("../data/processed/y_train.npy"), dtype=torch.long)

train_dataset = TensorDataset(X_train, y_train)
train_loader = DataLoader(train_dataset, batch_size=64, shuffle=True)

model = IllegalLoggingModel().to(device)
print("Model loaded")
criterion = nn.CrossEntropyLoss()
optimizer = optim.Adam(model.parameters(), lr=1e-3)

for epoch in range(1): #for now just testing for 1 epoch
    model.train()
    total_loss = 0

    for xb, yb in tqdm(train_loader):
        xb, yb = xb.to(device), yb.to(device)

        optimizer.zero_grad()
        outputs = model(xb)
        loss = criterion(outputs, yb)
        loss.backward()
        optimizer.step()

        total_loss += loss.item()

    print(f"Epoch {epoch+1}, Loss: {total_loss/len(train_loader)}")

torch.save(model.state_dict(), "../model_weights/IllegalLogging/outputs_model.pt")
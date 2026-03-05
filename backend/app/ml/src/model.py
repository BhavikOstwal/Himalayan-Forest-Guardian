import torch
import torch.nn as nn

class IllegalLoggingModel(nn.Module):
    def __init__(self, num_classes=5):
        super().__init__()

        self.lstm = nn.LSTM(
            input_size=128,
            hidden_size=128,
            num_layers=2,
            batch_first=True,
            bidirectional=True
        )

        self.fc = nn.Sequential(
            nn.Linear(256, 128),
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(128, num_classes)
        )

    def forward(self, x):
        out, _ = self.lstm(x)
        out = out[:, -1, :]
        return self.fc(out)
    
#  print model parameters
if __name__ == "__main__":
    model = IllegalLoggingModel()
    total_params = sum(p.numel() for p in model.parameters())
    print(f"Total parameters: {total_params}")
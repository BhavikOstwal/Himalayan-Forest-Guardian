# Himalayan Forest Guardian

A full-stack, production-ready system for monitoring Himalayan forests using audio analysis, ML predictions, and real-time mapping(not implemented fully yet).

# How to Run
You must have `conda` and Node.js installed.


## 1. Backend (FastAPI + Conda)
The `forest` conda environment handles correct python 
compatibility (Python 3.10) for ML services.
```sh
conda create -n forest python=3.10 -y
conda activate forest
pip install -r backend/requirements.txt
#might have added some new dependencies later, so install them as error pops up ;
```

```sh
# Start the backend server
cd backend
conda activate forest
uvicorn app.main:app --reload --port 8000
```

## 3. Frontend (React + Vite + Cesium)
```sh
cd frontend
npm install # already run if you followed setup
npm run dev
```

Navigate to `http://localhost:5173`.
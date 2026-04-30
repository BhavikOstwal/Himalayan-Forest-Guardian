# Himalayan Forest Guardian

A full-stack, production-ready system for monitoring Himalayan forests using remote-sensing using satellite, audio analysis, ML predictions, and real-time mapping.

# How to Run
You must have `conda` and Node.js installed.


## 1. Backend (FastAPI + Conda)
The `forest` conda environment handles correct python 
compatibility (Python 3.10) for ML services.
```sh
conda create -n forest python=3.10 -y
conda activate forest
pip install -r reuirements.txt

OR

conda create env -f environment.yml
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

Environment files (.env)
------------------------

Two environment files are required: one in the `frontend` folder and one in the `backend` folder. Create them as plain text files named `.env` in their respective folders and add the values shown below.

Frontend `.env` (place in the `frontend` folder):

```env
# Cesium Ion API Access Token
# Required to load premium base imageries (Bing Maps, Sentinel-2, Earth at Night)
# Create a free account at https://ion.cesium.com/ to get your token and paste it below:
VITE_CESIUM_ION_TOKEN=
```

Backend `.env` (place in the `backend` folder):

```env
# Google Earth Engine Configuration
# Provide your Google Cloud Project ID that has the Earth Engine API enabled.
GEE_PROJECT_ID=

# eBird API Configuration
# Required to fetch recent bird observation data. You can get this from the eBird API portal.
EBIRD_API_KEY=

GEMINI_API_KEY=
```

LoRa setup
----------

The `LoRa_setup` folder contains firmware and PlatformIO project files for an ESP32-based LoRa board. Key items in the folder:

- `platformio.ini` — PlatformIO project configuration.
- `src/` — firmware source files (notably `main.cpp`, `main_dummy.cpp`, `LloRa_test.cpp`).
- `include/` — local header files (README inside explains usage).
- `lib/` — third-party libraries used by the firmware.
- `.pio/` and `build/` — build artifacts produced by PlatformIO (can be ignored or added to `.gitignore`).

Quick notes:

- To build and upload the firmware, open `LoRa_setup` in VS Code with the PlatformIO extension installed, or use `platformio` from the command line.
- Edit source files in `src/` as needed for your hardware and LoRa configuration.
- The project is prepared for an ESP32-S3 devkit target (see the `.pio` build folders). Remove `build` artifacts before committing.

<!-- Project directory structure
---------------------------

Top-level layout (abridged):

```
deploy.sh
environment.yml
backend/
  requirements.txt
  app/
    config.py
    database.py
    main.py
    core/
    ml/
      full_pipeline_inference.py
      testing_data.py
      data/
      metadata/
      model_weights/
      src/
    models/
      schemas.py
    routers/
      alerts.py
      analytics.py
      audio.py
      device.py
      map.py
      survey.py
    services/
      alert_service.py
      audio_classifier.py
      device_ws_service.py
      gee_processor.py
      ml_service.py
data/
  istp.csv
  latest_map.json
docs/
frontend/
  package.json
  src/
    App.jsx
    main.jsx
    components/
      Map/
  public/
LoRa_setup/
  platformio.ini
  src/
    main.cpp
    LloRa_test.cpp
    main_dummy.cpp
  include/
  lib/
Report/
```

If you'd like a more detailed tree (including all nested files) or want to add `.env` templates as `.env.example` files, let me know. -->

Author and License
------------------

Created by Bhavik Ostwal.

This project is licensed under the MIT License. See the LICENSE file for details.
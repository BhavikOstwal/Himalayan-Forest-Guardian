import os
import ee
import logging
import pandas as pd
import json

logger = logging.getLogger(__name__)

# Paths
DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "data")
MAP_STORE_PATH = os.path.join(DATA_DIR, "latest_map.json")
CSV_PATH = os.path.join(DATA_DIR, "istp.csv")

def initialize_ee():
    """Initializes Google Earth Engine."""
    try:
        ee.Initialize(project=os.getenv("GEE_PROJECT_ID", "dev-airlock-454813-h7"))
        logger.info("Earth Engine initialized successfully.")
    except Exception as e:
        logger.warning(f"Failed to initialize Earth Engine: {e}. Mocking GEE responses.")
        pass

def ee_is_initialized():
    try:
        ee.Number(1).getInfo()
        return True
    except Exception:
        return False

def save_map_id(map_id_data):
    """Saves map ID to a local JSON file."""
    os.makedirs(DATA_DIR, exist_ok=True)
    with open(MAP_STORE_PATH, 'w') as f:
        json.dump(map_id_data, f)

def get_latest_classified_map():
    """Retrieves the latest map ID from storage."""
    if os.path.exists(MAP_STORE_PATH):
        with open(MAP_STORE_PATH, 'r') as f:
            return json.load(f)
    return {
        "status": "mock",
        "tile_fetch_url": "https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}",
        "palette": []
    }

def add_s2_indices(image):
    image1 = image.select(['B8','B4','B3','B2','B5','B6','B7','B11','B12'])
    ndvi = image1.normalizedDifference(['B8','B4']).rename('NDVI')
    evi = image1.expression('2.5*((NIR-RED)/(NIR+6*RED-7.5*BLUE+1))',
        {'NIR':image1.select('B8'),'RED':image1.select('B4'),'BLUE':image1.select('B2')}).rename('EVI')
    return image1.addBands([ndvi, evi])



def train_and_classify(polygon_coords=None):
    """Runs RF classification based on istp.csv survey points."""
    try:
        if not ee_is_initialized():
            initialize_ee()
        
        if polygon_coords and len(polygon_coords) >= 3:
            region = ee.Geometry.Polygon(polygon_coords)
        else:
            region = ee.FeatureCollection('FAO/GAUL/2015/level2').filter(ee.Filter.eq("ADM2_NAME","Kullu")).geometry()
        
        # Load and process satellite data
        # Simplified version of the notebook logic for performance/reliability
        start = ee.Date('2024-01-01')
        end = ee.Date('2024-12-31')
        
        s2 = ee.ImageCollection("COPERNICUS/S2_SR_HARMONIZED") \
            .filterBounds(region) \
            .filterDate(start, end) \
            .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 20)) \
            .median().clip(region)
        
        stack = add_s2_indices(s2)
        
        # Load Training Data
        df = pd.read_csv(CSV_PATH)
        features = []
        for _, row in df.iterrows():
            f = ee.Feature(ee.Geometry.Point([float(row['Longitude']), float(row['Latitude'])]), {'class': int(row['no'])})
            features.append(f)
        training_fc = ee.FeatureCollection(features)
        
        # Load WorldCover to establish Tree Mask vs Open Areas
        world_cover = ee.ImageCollection("ESA/WorldCover/v200").first()
        tree_mask = world_cover.eq(10)
        
        # Training (Only on tree-masked regions is optional, but applying it to classification is mandatory)
        bands = ['B8', 'B4', 'B3', 'B2', 'NDVI', 'EVI']
        samples = stack.sampleRegions(collection=training_fc, properties=['class'], scale=10)
        
        # Can still train on 77 trees as in the updated script
        classifier = ee.Classifier.smileRandomForest(77).train(
            features=samples, classProperty='class', inputProperties=bands
        )
        
        # 1. Mask stack to only predict against actual trees
        masked_stack = stack.updateMask(tree_mask)
        classified_trees = masked_stack.select(bands).classify(classifier)
        
        # 2. Assign everything else (non-trees) to class 4 (Open)
        open_areas = ee.Image(4).updateMask(tree_mask.Not()).rename('classification')
        
        # 3. Combine together
        classified = classified_trees.unmask(open_areas)
        
        palette = ['#006400', '#1f78b4', '#ff7f00', '#6a3d9a', '#e31a1c', '#ffd92f', '#17becf']
        
        map_id = classified.getMapId({'min': 0, 'max': 6, 'palette': palette})
        
        result = {
            "status": "success",
            "tile_fetch_url": map_id['tile_fetcher'].url_format,
            "palette": palette,
            "message": "Model retrained and map updated successfully."
        }
        save_map_id(result)
        return result

    except Exception as e:
        logger.error(f"Classification Error: {e}")
        return {"status": "error", "message": str(e)}

def compute_ndvi_tiles(region_coords, start_date, end_date):
    """Computes NDVI (Keep existing for backward compatibility)."""
    # ... existing implementation or simplified ...
    try:
        roi = ee.Geometry.Polygon(region_coords)
        collection = (ee.ImageCollection('COPERNICUS/S2_SR')
                      .filterBounds(roi)
                      .filterDate(start_date, end_date)
                      .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 20)))
        ndvi_image = collection.map(lambda img: img.addBands(img.normalizedDifference(['B8', 'B4']).rename('NDVI'))).select('NDVI').median().clip(roi)
        map_id = ndvi_image.getMapId({'min': 0.0, 'max': 1.0, 'palette': ['FFFFFF', 'CE7E45', '207401', '004C00']})
        return {"status": "success", "tile_fetch_url": map_id['tile_fetcher'].url_format}
    except Exception:
        return {"status": "mock", "tile_fetch_url": "https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}"}

# Try initializing on module load
initialize_ee()

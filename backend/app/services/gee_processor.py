import os
import ee
import logging

logger = logging.getLogger(__name__)

def initialize_ee():
    """
    Initializes Google Earth Engine.
    Requires authentication via service account or default credentials.
    """
    try:
        # In a real deployed environment, you would use a service account:
        # credentials = ee.ServiceAccountCredentials('service-account@project.iam.gserviceaccount.com', 'key.json')
        # ee.Initialize(credentials)
        
        # For local testing, assuming user has run `earthengine authenticate`
        ee.Initialize(project=os.getenv("GEE_PROJECT_ID", "your-gee-project-id"))
        logger.info("Earth Engine initialized successfully.")
    except Exception as e:
        logger.warning(f"Failed to initialize Earth Engine: {e}. Mocking GEE responses.")
        pass

def compute_ndvi_tiles(region_coords, start_date, end_date):
    """
    Computes NDVI for a given region and date range using Sentinel-2.
    Returns pseudo-tiles or a mock response if GEE is not initialized.
    
    Pseudo-workflow as requested:
    collection = Sentinel2.filterBounds(region).filterDate(start,end)
    ndvi = (B8 - B4) / (B8 + B4)
    export raster to tiles
    """
    try:
        if not ee.data._initialized:
            raise Exception("GEE not initialized")

        # Define Region of Interest (ROI)
        roi = ee.Geometry.Polygon(region_coords)

        # Load Sentinel-2 Surface Reflectance
        collection = (ee.ImageCollection('COPERNICUS/S2_SR')
                      .filterBounds(roi)
                      .filterDate(start_date, end_date)
                      .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 20)))

        # Function to compute NDVI
        def add_ndvi(image):
            ndvi = image.normalizedDifference(['B8', 'B4']).rename('NDVI')
            return image.addBands(ndvi)

        # Map the function over the collection and take the median
        ndvi_image = collection.map(add_ndvi).select('NDVI').median().clip(roi)

        # In a real app, you would export this to an asset or Cloud Storage
        # e.g., ee.batch.Export.image.toCloudStorage(...)
        
        # Here we attempt to get a thumbnail or map ID for serving tiles
        map_id = ndvi_image.getMapId({
            'min': 0.0,
            'max': 1.0,
            'palette': ['FFFFFF', 'CE7E45', 'DF923D', 'F1B555', 'FCD163', '99B718', '74A901', '66A000', '529400', '3E8601', '207401', '056201', '004C00', '023B01', '012E01', '011D01', '011301']
        })
        
        return {
            "status": "success",
            "tile_fetch_url": map_id['tile_fetcher'].url_format
        }

    except Exception as e:
        logger.error(f"GEE Error: {e}")
        # Return mock data for frontend testing
        return {
            "status": "mock",
            "tile_fetch_url": "https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}",
            "message": "Returning mock satellite tiles since GEE was not initialized."
        }

# Try initializing on module load
initialize_ee()

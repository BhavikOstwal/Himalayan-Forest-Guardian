import React, { useEffect, useRef } from 'react';
import { Viewer, Cartesian3, Color, LabelStyle, UrlTemplateImageryProvider, ScreenSpaceEventHandler, ScreenSpaceEventType, Cartographic, PolygonHierarchy, Ion } from 'cesium';
import 'cesium/Build/Cesium/Widgets/widgets.css';

const token = import.meta.env.VITE_CESIUM_ION_TOKEN;
if (token) {
    Ion.defaultAccessToken = token;
} else {
    console.warn("Please add VITE_CESIUM_ION_TOKEN to your frontend/.env file to fix the 'blue globe' issue!");
}

const CesiumMap = ({ alerts = [], hotspots = [], geeLayer = null, layerOpacity = 0.7, trainingPoints = [], isDrawing = false, drawnPoints = [], setDrawnPoints, onMapClick }) => {
    const cesiumContainer = useRef(null);
    const viewerRef = useRef(null);
    const geeImageryLayerRef = useRef(null);
    const drawnEntityRef = useRef(null);
    const pointEntitiesRef = useRef([]);

    useEffect(() => {
        if (!cesiumContainer.current) return;

        const viewer = new Viewer(cesiumContainer.current, {
            animation: false,
            baseLayerPicker: true,
            fullscreenButton: false,
            vrButton: false,
            geocoder: false,
            homeButton: false,
            infoBox: false,
            sceneModePicker: false,
            selectionIndicator: false,
            timeline: false,
            navigationHelpButton: false,
            navigationInstructionsInitiallyVisible: false,
            scene3DOnly: true,
        });

        viewerRef.current = viewer;

        if (viewer.scene.frameState.creditDisplay) {
            viewer.cesiumWidget.creditContainer.style.display = "none";
        }

        viewer.scene.globe.enableLighting = true;

        // Fly to Kullu region (where istp.csv data is)
        viewer.camera.flyTo({
            destination: Cartesian3.fromDegrees(77.05, 31.94, 15000.0),
            duration: 3.0
        });

        return () => {
            if (viewerRef.current) {
                viewerRef.current.destroy();
                viewerRef.current = null;
            }
        };
    }, []);

    // Update GEE Layer
    useEffect(() => {
        const viewer = viewerRef.current;
        if (!viewer || !geeLayer) return;

        // Remove old layer
        if (geeImageryLayerRef.current) {
            viewer.imageryLayers.remove(geeImageryLayerRef.current);
        }

        // Add new GEE layer
        const imageryProvider = new UrlTemplateImageryProvider({
            url: geeLayer,
        });

        geeImageryLayerRef.current = viewer.imageryLayers.addImageryProvider(imageryProvider);
        geeImageryLayerRef.current.alpha = layerOpacity;

    }, [geeLayer]);

    // Update Opacity
    useEffect(() => {
        if (geeImageryLayerRef.current) {
            geeImageryLayerRef.current.alpha = layerOpacity;
        }
    }, [layerOpacity]);

    // Update markers (Alerts and Training Points)
    useEffect(() => {
        const viewer = viewerRef.current;
        if (!viewer) return;

        viewer.entities.removeAll();

        // Add training points from GEE logic if provided
        trainingPoints.forEach((pt, i) => {
            viewer.entities.add({
                position: Cartesian3.fromDegrees(pt.lng, pt.lat),
                point: {
                    pixelSize: 8,
                    color: Color.WHITE.withAlpha(0.9),
                    outlineColor: Color.BLACK,
                    outlineWidth: 2,
                },
                label: {
                    text: pt.species,
                    font: '10px sans-serif',
                    pixelOffset: { x: 0, y: 10 },
                    show: false // Show on hover maybe? Keep hidden for now to avoid clutter
                }
            });
        });

        // Add alert markers
        alerts.forEach((alert) => {
            viewer.entities.add({
                position: Cartesian3.fromDegrees(alert.lng, alert.lat),
                point: {
                    pixelSize: 15,
                    color: alert.confidence > 90 ? Color.RED : Color.ORANGE,
                    outlineColor: Color.WHITE,
                    outlineWidth: 2,
                },
                label: {
                    text: `Chainsaw ${Math.round(alert.confidence)}%`,
                    font: 'bold 14px "Inter", sans-serif',
                    style: LabelStyle.FILL_AND_OUTLINE,
                    outlineWidth: 2,
                    verticalOrigin: 1,
                    pixelOffset: { x: 0, y: -20 },
                },
            });
        });
    }, [alerts, trainingPoints]);

    // Drawing mode logic
    useEffect(() => {
        const viewer = viewerRef.current;
        if (!viewer) return;

        let handler;
        if (isDrawing) {
            viewer.scene.screenSpaceCameraController.enableTranslate = false; // Disable pan when drawing
            handler = new ScreenSpaceEventHandler(viewer.scene.canvas);

            handler.setInputAction((click) => {
                const earthPosition = viewer.scene.camera.pickEllipsoid(click.position, viewer.scene.globe.ellipsoid);
                if (earthPosition) {
                    const cartographic = Cartographic.fromCartesian(earthPosition);
                    const longitude = cartographic.longitude * (180 / Math.PI);
                    const latitude = cartographic.latitude * (180 / Math.PI);
                    
                    if (setDrawnPoints) {
                        setDrawnPoints(prev => [...prev, { lat: latitude, lng: longitude }]);
                    }
                }
            }, ScreenSpaceEventType.LEFT_CLICK);

            // Right click to close or clear could be nice, but left clicks are fine to keep simple
        } else {
            viewer.scene.screenSpaceCameraController.enableTranslate = true;
            
            // Allow map clicks when not drawing
            handler = new ScreenSpaceEventHandler(viewer.scene.canvas);
            handler.setInputAction((click) => {
                const earthPosition = viewer.scene.camera.pickEllipsoid(click.position, viewer.scene.globe.ellipsoid);
                if (earthPosition && onMapClick) {
                    const cartographic = Cartographic.fromCartesian(earthPosition);
                    const longitude = cartographic.longitude * (180 / Math.PI);
                    const latitude = cartographic.latitude * (180 / Math.PI);
                    onMapClick(latitude, longitude);
                }
            }, ScreenSpaceEventType.LEFT_CLICK);
        }

        return () => {
            if (handler) handler.destroy();
            if (viewer && !viewer.isDestroyed) {
                viewer.scene.screenSpaceCameraController.enableTranslate = true;
            }
        };
    }, [isDrawing, setDrawnPoints]);

    // Render drawn polygon
    useEffect(() => {
        const viewer = viewerRef.current;
        if (!viewer) return;

        // Cleanup existing drawing entities
        if (drawnEntityRef.current) {
            viewer.entities.remove(drawnEntityRef.current);
            drawnEntityRef.current = null;
        }
        pointEntitiesRef.current.forEach(ent => viewer.entities.remove(ent));
        pointEntitiesRef.current = [];

        if (drawnPoints && drawnPoints.length > 0) {
            // Add point markers
            drawnPoints.forEach(p => {
                const pt = viewer.entities.add({
                    position: Cartesian3.fromDegrees(p.lng, p.lat),
                    point: {
                        pixelSize: 8,
                        color: Color.YELLOW,
                        outlineColor: Color.BLACK,
                        outlineWidth: 2,
                    }
                });
                pointEntitiesRef.current.push(pt);
            });

            const positions = drawnPoints.map(p => Cartesian3.fromDegrees(p.lng, p.lat));
            
            // If less than 3 points, draw a polyline
            if (drawnPoints.length < 3) {
                if (drawnPoints.length === 2) {
                    drawnEntityRef.current = viewer.entities.add({
                        polyline: {
                            positions: positions,
                            width: 3,
                            material: Color.YELLOW,
                        }
                    });
                }
            } else {
                // If 3 or more points, draw a polygon
                drawnEntityRef.current = viewer.entities.add({
                    polygon: {
                        hierarchy: new PolygonHierarchy(positions),
                        material: Color.ORANGE.withAlpha(0.2),
                        outline: true,
                        outlineColor: Color.ORANGE,
                        outlineWidth: 3
                    }
                });
            }
        }
    }, [drawnPoints]);

    return (
        <div
            ref={cesiumContainer}
            className="w-full h-full absolute inset-0 rounded-2xl overflow-hidden shadow-inner"
        />
    );
};

export default CesiumMap;

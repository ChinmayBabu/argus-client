import { useEffect, useRef, useState } from 'react';
import * as Cesium from 'cesium';
import { useDashboardStore } from '../../stores/dashboardStore';

// No Ion token needed — we are using a tactical grid instead

interface MissionMapProps {
  width?: string;
  height?: string;
}

export default function MissionMap({ width = '100%', height = '100%' }: MissionMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<Cesium.Viewer | null>(null);
  const entityRef = useRef<Cesium.Entity | null>(null);
  const pathEntityRef = useRef<Cesium.Entity | null>(null);
  const hasPositionedRef = useRef(false);
  const [viewerReady, setViewerReady] = useState(false);

  const telemetry = useDashboardStore((state) => state.telemetry);
  const telemetryHistory = useDashboardStore((state) => state.telemetryHistory);
  const mission = useDashboardStore((state) => state.mission);

  // Use refs for the Cesium drawing callbacks to always read latest React state
  const telemetryRef = useRef(telemetry);
  const historyRef = useRef(telemetryHistory);

  useEffect(() => {
    telemetryRef.current = telemetry;
    historyRef.current = telemetryHistory;
  }, [telemetry, telemetryHistory]);

  useEffect(() => {
    if (!containerRef.current) return;

    // High-resolution tactical Dark map (CartoDB Dark Matter)
    const earthProvider = new Cesium.UrlTemplateImageryProvider({
      url: 'https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png',
      credit: '© OpenStreetMap contributors © CARTO',
    });

    // @ts-ignore - compatibility with various Cesium versions for imageryProvider/baseLayer
    const viewerConfig: any = {
      terrainProvider: new Cesium.EllipsoidTerrainProvider(), // strictly no external terrain
      baseLayerPicker: false,
      geocoder: false,
      homeButton: false,
      timeline: false,
      animation: false,
      fullscreenButton: false,
      sceneModePicker: false,
      navigationHelpButton: false,
      infoBox: false,
      selectionIndicator: false,
      skyBox: false, 
      skyAtmosphere: false, 
      creditContainer: document.createElement('div'),
    };
    
    // Support newer Cesium versions that use baseLayer instead of imageryProvider
    if (Cesium.ImageryLayer) {
        viewerConfig.baseLayer = new Cesium.ImageryLayer(earthProvider);
    } else {
        viewerConfig.imageryProvider = earthProvider;
    }

    const viewer = new Cesium.Viewer(containerRef.current, viewerConfig);

    // Fix pixelation
    viewer.resolutionScale = window.devicePixelRatio;
    if (viewer.scene.postProcessStages) {
      viewer.scene.postProcessStages.fxaa.enabled = true;
    }

    // Space theme styling
    viewer.scene.backgroundColor = Cesium.Color.fromCssColorString('#010c18')!;
    viewer.scene.globe.baseColor = Cesium.Color.fromCssColorString('#010c18')!;
    viewer.scene.globe.enableLighting = false; 
    viewer.scene.globe.showWaterEffect = false;
    viewer.scene.globe.depthTestAgainstTerrain = false;

    // Set an initial world view. If telemetry has not arrived yet, the
    // first live frame will reposition the camera in the effect below.
    viewer.camera.setView({
      destination: Cesium.Cartesian3.fromDegrees(
        telemetry?.position_lon || 0,
        telemetry?.position_lat || 0,
        15000000 // 15,000km altitude to see the whole earth
      ),
      orientation: {
        heading: Cesium.Math.toRadians(0),
        pitch: Cesium.Math.toRadians(-90),
        roll: 0,
      },
    });

    viewerRef.current = viewer;
    setViewerReady(true);

    if (telemetry) {
      hasPositionedRef.current = true;
    }

    return () => {
      viewer.destroy();
      viewerRef.current = null;
      setViewerReady(false);
      hasPositionedRef.current = false;
    };
  }, []);

  // The viewer is created before the first frame often arrives. Recenter once
  // on that first frame so the satellite is in the visible hemisphere.
  useEffect(() => {
    if (!viewerRef.current || !telemetry || hasPositionedRef.current) return;

    viewerRef.current.camera.setView({
      destination: Cesium.Cartesian3.fromDegrees(
        telemetry.position_lon,
        telemetry.position_lat,
        15000000,
      ),
      orientation: {
        heading: 0,
        pitch: Cesium.Math.toRadians(-90),
        roll: 0,
      },
    });
    hasPositionedRef.current = true;
  }, [telemetry]);

  // Update satellite position when telemetry changes
  useEffect(() => {
    if (!viewerReady || !viewerRef.current || !telemetry) return;

    const viewer = viewerRef.current;

    if (!entityRef.current) {
      // Create satellite entity
      entityRef.current = viewer.entities.add({
        position: new Cesium.CallbackProperty(() => {
          const t = telemetryRef.current;
          if (t) {
            return Cesium.Cartesian3.fromDegrees(
              t.position_lon,
              t.position_lat,
              getVisualAltitude(t.altitude),
            );
          }
          return undefined;
        }, false) as any,
        point: {
          pixelSize: 8,
          color: getMissionPhaseColor(mission?.phase) as any,
          outlineColor: Cesium.Color.WHITE,
          outlineWidth: 2,
        },
        label: {
          text: 'Satellite',
          font: '14px "SFMono-Regular", monospace',
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          fillColor: Cesium.Color.CYAN,
          outlineWidth: 0,
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
          pixelOffset: new Cesium.Cartesian2(0, -15),
        },
      });

      // Create path entity for orbit trail
      pathEntityRef.current = viewer.entities.add({
        polyline: {
          positions: new Cesium.CallbackProperty(() => {
            const hist = historyRef.current;
            if (hist.timestamps.length < 2) return undefined;

            return hist.timestamps.map((_, i) =>
              Cesium.Cartesian3.fromDegrees(
                hist.position_lon[i] || 0,
                hist.position_lat[i] || 0,
                getVisualAltitude(hist.altitude[i]),
              )
            );
          }, false) as any,
          width: 3,
          material: new Cesium.PolylineGlowMaterialProperty({
            glowPower: 0.5,
            color: getMissionPhaseColor(mission?.phase),
          }) as any,
        },
      });
    } else {
      // Update entity color based on mission phase
      const color = getMissionPhaseColor(mission?.phase);
      if (entityRef.current.point) {
        entityRef.current.point.color = color as any;
      }
      if (pathEntityRef.current?.polyline) {
        pathEntityRef.current.polyline.material = new Cesium.PolylineGlowMaterialProperty({
          glowPower: 0.5,
          color: color as any,
        }) as any;
      }
    }

    // (Removed viewer.trackedEntity here to allow the user full freedom to zoom in/out and pan with the mouse!)
    viewer.scene.requestRender();
  }, [telemetry, mission?.phase, viewerReady]);

  return (
    <div
      ref={containerRef}
      className="cesium-container"
      style={{ width, height, position: 'relative' }}
    />
  );
}

// Cesium expects the height argument in meters. The simulator can temporarily
// emit a negative altitude while its orbital position is being calculated;
// keep the visual marker above the globe instead of burying it underground.
function getVisualAltitude(altitude: number): number {
  const MIN_VISIBLE_ALTITUDE_METERS = 10000;
  return Number.isFinite(altitude)
    ? Math.max(MIN_VISIBLE_ALTITUDE_METERS, altitude)
    : MIN_VISIBLE_ALTITUDE_METERS;
}

function getMissionPhaseColor(phase?: string): Cesium.Color {
  switch (phase) {
    case 'attack':
      return Cesium.Color.RED;
    case 'recovery':
      return Cesium.Color.ORANGE;
    case 'normal_ops':
      return Cesium.Color.GREEN;
    case 'launch':
      return Cesium.Color.CYAN;
    case 'deorbit':
      return Cesium.Color.PURPLE;
    default:
      return Cesium.Color.WHITE;
  }
}

// src/features/maps/components/MapContainer.tsx
'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import './map-styles.css';
import { MapProperty, ProvinceStats, PROVINCE_NAMES_TH } from '../types';
import { Button } from '@src/shared/components/ui/button';
import { KeenIcon } from '@src/shared/components/keenicons';

// Mapbox access token
const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';
const THAILAND_PROVINCES_URL = 'https://raw.githubusercontent.com/apisit/thailand.json/master/thailand.json';

interface MapContainerProps {
  properties: MapProperty[];
  selectedProperty?: MapProperty;
  provinceStats?: ProvinceStats[];
  onProvinceSelect: (provinceName: string) => void;
  onPropertySelect: (property: MapProperty) => void;
}

type MapStyle = 'standard' | 'satellite';
type LightPreset = 'dawn' | 'day' | 'dusk' | 'night';

export function MapContainer({
  properties,
  selectedProperty,
  provinceStats,
  onProvinceSelect,
  onPropertySelect,
}: MapContainerProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<Map<string, mapboxgl.Marker>>(new Map());
  const popupRef = useRef<mapboxgl.Popup | null>(null);
  
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapStyle, setMapStyle] = useState<MapStyle>('standard');
  const [lightPreset, setLightPreset] = useState<LightPreset>('night');
  const [hoveredProvince, setHoveredProvince] = useState<string | null>(null);
  const [styleVersion, setStyleVersion] = useState(0); // To trigger re-add clustering after style change
  const [showSettings, setShowSettings] = useState(false);
  
  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;
    
    mapboxgl.accessToken = MAPBOX_TOKEN;
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/standard',
      center: [100.5, 13.5],
      zoom: 5.5,
      minZoom: 4,
      maxZoom: 18,
      pitch: 45,
      bearing: -10,
      antialias: true,
    });

    // Add controls
    map.current.addControl(
      new mapboxgl.NavigationControl({ visualizePitch: true }),
      'top-right'
    );
    map.current.addControl(new mapboxgl.FullscreenControl(), 'top-right');
    map.current.addControl(
      new mapboxgl.GeolocateControl({
        positionOptions: { enableHighAccuracy: true },
        trackUserLocation: true,
        showUserHeading: true,
      }),
      'top-right'
    );
    map.current.addControl(
      new mapboxgl.ScaleControl({ maxWidth: 100, unit: 'metric' }),
      'bottom-right'
    );

    map.current.on('load', () => {
      if (!map.current) return;
      
      // Set light preset
      try {
        map.current.setConfigProperty('basemap', 'lightPreset', lightPreset);
      } catch (e) {
        console.log('Light preset not supported');
      }

      // Add terrain
      if (!map.current.getSource('mapbox-dem')) {
        map.current.addSource('mapbox-dem', {
          type: 'raster-dem',
          url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
          tileSize: 512,
          maxzoom: 14,
        });
        map.current.setTerrain({ source: 'mapbox-dem', exaggeration: 2.0 });
      }

      // Add sky layer
      if (!map.current.getLayer('sky')) {
        map.current.addLayer({
          id: 'sky',
          type: 'sky',
          paint: {
            'sky-type': 'atmosphere',
            'sky-atmosphere-sun': [0.0, 90.0],
            'sky-atmosphere-sun-intensity': 15,
          },
        });
      }

      // Load provinces
      loadProvinces();
      
      setMapLoaded(true);
    });

    return () => {
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current.clear();
      map.current?.remove();
      map.current = null;
    };
  }, []);

  // Load Thai provinces GeoJSON
  const loadProvinces = useCallback(async () => {
    if (!map.current) return;
    
    try {
      const response = await fetch(THAILAND_PROVINCES_URL);
      const data = await response.json();
      
      // Add Thai names to features
      data.features = data.features.map((feature: any, index: number) => {
        const props = feature.properties;
        const engName = props.name || props.NAME_1 || '';
        const thaiName = PROVINCE_NAMES_TH[engName] || engName;
        
        return {
          ...feature,
          id: index,
          properties: {
            ...props,
            name_th: thaiName,
            name_en: engName,
          },
        };
      });

      // Add source if not exists
      if (!map.current.getSource('thailand-provinces')) {
        map.current.addSource('thailand-provinces', {
          type: 'geojson',
          data: data,
          generateId: true,
        });

        // Province fill layer
        map.current.addLayer({
          id: 'province-fill',
          type: 'fill',
          source: 'thailand-provinces',
          paint: {
            'fill-color': [
              'case',
              ['boolean', ['feature-state', 'selected'], false],
              'rgba(220, 38, 38, 0.3)',
              ['boolean', ['feature-state', 'hover'], false],
              'rgba(220, 38, 38, 0.15)',
              'rgba(255, 255, 255, 0)',
            ],
          },
        });

        // Province border layer
        map.current.addLayer({
          id: 'province-border',
          type: 'line',
          source: 'thailand-provinces',
          paint: {
            'line-color': '#dc2626',
            'line-width': [
              'interpolate',
              ['linear'],
              ['zoom'],
              4, 1,
              6, 1.5,
              10, 2.5,
              14, 3,
            ],
            'line-opacity': 0.8,
          },
        });

        // Province label layer
        map.current.addLayer({
          id: 'province-label',
          type: 'symbol',
          source: 'thailand-provinces',
          layout: {
            'text-field': ['get', 'name_th'],
            'text-font': ['DIN Pro Bold', 'Arial Unicode MS Bold'],
            'text-size': [
              'interpolate',
              ['linear'],
              ['zoom'],
              4, 10,
              6, 13,
              8, 16,
              10, 18,
            ],
            'text-anchor': 'center',
            'text-allow-overlap': false,
          },
          paint: {
            'text-color': '#1a1a1a',
            'text-halo-color': '#ffffff',
            'text-halo-width': 2,
          },
        });

        // Setup province interactions
        setupProvinceInteractions();
      }
    } catch (error) {
      console.error('Error loading provinces:', error);
    }
  }, []);

  // Province hover and click interactions
  const setupProvinceInteractions = useCallback(() => {
    if (!map.current) return;
    
    let hoveredId: number | null = null;

    // Mouse move (hover)
    map.current.on('mousemove', 'province-fill', (e) => {
      if (!map.current || e.features?.length === 0) return;
      
      const feature = e.features![0];
      
      if (hoveredId !== null) {
        map.current.setFeatureState(
          { source: 'thailand-provinces', id: hoveredId },
          { hover: false }
        );
      }
      
      hoveredId = feature.id as number;
      map.current.setFeatureState(
        { source: 'thailand-provinces', id: hoveredId },
        { hover: true }
      );
      
      map.current.getCanvas().style.cursor = 'pointer';
      setHoveredProvince(feature.properties?.name_th || null);
    });

    // Mouse leave
    map.current.on('mouseleave', 'province-fill', () => {
      if (!map.current) return;
      
      if (hoveredId !== null) {
        map.current.setFeatureState(
          { source: 'thailand-provinces', id: hoveredId },
          { hover: false }
        );
      }
      hoveredId = null;
      map.current.getCanvas().style.cursor = '';
      setHoveredProvince(null);
    });

    // Click to select province
    map.current.on('click', 'province-fill', (e) => {
      if (!map.current || e.features?.length === 0) return;
      
      const feature = e.features![0];
      const provinceName = feature.properties?.name_th || '';
      
      // Fly to province
      const bounds = new mapboxgl.LngLatBounds();
      const coords = feature.geometry.type === 'Polygon' 
        ? (feature.geometry as GeoJSON.Polygon).coordinates[0]
        : (feature.geometry as GeoJSON.MultiPolygon).coordinates[0][0];
      
      coords.forEach((coord: any) => bounds.extend(coord as [number, number]));
      
      map.current.flyTo({
        center: bounds.getCenter(),
        zoom: 9,
        pitch: 55,
        bearing: Math.random() * 30 - 15,
        duration: 2000,
      });

      onProvinceSelect(provinceName);
    });
  }, [onProvinceSelect]);

  // Show property popup (defined before useEffects that use it)
  const showPropertyPopup = useCallback((property: MapProperty) => {
    if (!map.current) return;
    
    // Remove existing popup
    popupRef.current?.remove();

    const popupContent = `
      <div class="property-popup">
        <div class="popup-image">
          ${property.images.length > 0 
            ? `<img src="${property.images[0]}" alt="${property.title}" />`
            : '<div class="no-image">ไม่มีรูป</div>'
          }
          <span class="popup-tag ${property.status === 'ขายแล้ว' ? 'sold' : ''}">${property.status}</span>
        </div>
        <div class="popup-content">
          <div class="popup-title">${property.title}</div>
          <div class="popup-location">📍 ${property.location}</div>
          <div class="popup-price">${property.formattedPrice}</div>
        </div>
      </div>
    `;

    popupRef.current = new mapboxgl.Popup({ 
      closeButton: true, 
      maxWidth: '280px',
      offset: 25,
    })
      .setLngLat([property.lng, property.lat])
      .setHTML(popupContent)
      .addTo(map.current);

    onPropertySelect(property);
  }, [onPropertySelect]);

  // Simple grid-based clustering for 3D markers
  const ZOOM_THRESHOLD = 9; // Show individual 3D markers when zoom > this value
  const clusterMarkersRef = useRef<Map<string, mapboxgl.Marker>>(new Map());
  
  // Create 3D marker element for individual property
  const createMarkerElement = useCallback((property: MapProperty) => {
    const el = document.createElement('div');
    el.className = 'marker-3d';
    
    const isSold = property.status === 'ขายแล้ว';
    const isLED = property.source === 'LED';
    
    el.innerHTML = `
      <div class="marker-tag ${isSold ? 'sold' : ''} ${isLED ? 'led' : ''}">
        ${isSold ? 'ขายแล้ว' : formatPriceShort(property.price)}
      </div>
      <div class="marker-pole"></div>
      <div class="marker-shadow"></div>
    `;

    el.addEventListener('click', (e) => {
      e.stopPropagation();
      map.current?.flyTo({
        center: [property.lng, property.lat],
        zoom: 15,
        pitch: 55,
        duration: 1200,
      });
      setTimeout(() => showPropertyPopup(property), 600);
    });

    return el;
  }, [showPropertyPopup]);

  // Create 3D cluster element
  const createClusterElement = useCallback((count: number, centerLng: number, centerLat: number) => {
    const el = document.createElement('div');
    
    // Determine size class based on count
    let sizeClass = 'size-sm';
    if (count >= 100) sizeClass = 'size-xl';
    else if (count >= 50) sizeClass = 'size-lg';
    else if (count >= 10) sizeClass = 'size-md';
    
    el.className = `cluster-3d ${sizeClass}`;
    el.innerHTML = `
      <div class="cluster-bubble">
        <div class="cluster-ring"></div>
        ${count >= 10 ? '<div class="cluster-ring-2"></div>' : ''}
        <div class="cluster-count">${count >= 1000 ? Math.floor(count / 1000) + 'K' : count}</div>
      </div>
      <div class="cluster-pole"></div>
      <div class="cluster-shadow"></div>
    `;

    el.addEventListener('click', (e) => {
      e.stopPropagation();
      if (!map.current) return;
      
      // Zoom in to cluster
      map.current.flyTo({
        center: [centerLng, centerLat],
        zoom: Math.min(map.current.getZoom() + 3, 15),
        duration: 1000,
      });
    });

    return el;
  }, []);

  // Simple grid-based clustering algorithm
  const computeClusters = useCallback((props: MapProperty[], zoom: number) => {
    if (props.length === 0) return { clusters: [], singles: [] };
    
    // Grid size based on zoom level (smaller grid = more clusters when zoomed out)
    const gridSize = Math.max(0.5, 5 / Math.pow(2, zoom - 4));
    
    const grid = new Map<string, MapProperty[]>();
    
    props.forEach((p) => {
      if (p.lat === 0 && p.lng === 0) return;
      const cellX = Math.floor(p.lng / gridSize);
      const cellY = Math.floor(p.lat / gridSize);
      const key = `${cellX},${cellY}`;
      
      if (!grid.has(key)) grid.set(key, []);
      grid.get(key)!.push(p);
    });
    
    const clusters: { id: string; lng: number; lat: number; count: number; properties: MapProperty[] }[] = [];
    const singles: MapProperty[] = [];
    
    grid.forEach((cellProps, key) => {
      if (cellProps.length >= 3) {
        // Create cluster
        const avgLng = cellProps.reduce((sum, p) => sum + p.lng, 0) / cellProps.length;
        const avgLat = cellProps.reduce((sum, p) => sum + p.lat, 0) / cellProps.length;
        clusters.push({
          id: `cluster-${key}`,
          lng: avgLng,
          lat: avgLat,
          count: cellProps.length,
          properties: cellProps,
        });
      } else {
        // Add as singles
        singles.push(...cellProps);
      }
    });
    
    return { clusters, singles };
  }, []);

  // Update all markers
  const updateAllMarkers = useCallback(() => {
    if (!map.current) return;
    
    const zoom = map.current.getZoom();
    const bounds = map.current.getBounds();
    
    // Filter properties in viewport
    const visibleProperties = properties.filter((p) => {
      if (p.lat === 0 && p.lng === 0) return false;
      return bounds.contains([p.lng, p.lat]);
    });
    
    // Track which markers to keep
    const clusterIdsToShow = new Set<string>();
    const pointIdsToShow = new Set<string>();
    
    if (zoom < ZOOM_THRESHOLD) {
      // Zoomed out - show clusters
      const { clusters, singles } = computeClusters(visibleProperties, zoom);
      
      // Create cluster markers
      clusters.forEach((cluster) => {
        clusterIdsToShow.add(cluster.id);
        
        if (!clusterMarkersRef.current.has(cluster.id)) {
          const el = createClusterElement(cluster.count, cluster.lng, cluster.lat);
          const marker = new mapboxgl.Marker({
            element: el,
            anchor: 'bottom',
          })
            .setLngLat([cluster.lng, cluster.lat])
            .addTo(map.current!);
          
          clusterMarkersRef.current.set(cluster.id, marker);
        }
      });
      
      // Show singles as 3D markers (limit for performance)
      const maxSingles = 30;
      singles.slice(0, maxSingles).forEach((property) => {
        pointIdsToShow.add(property.id);
        
        if (!markersRef.current.has(property.id)) {
          const el = createMarkerElement(property);
          const marker = new mapboxgl.Marker({
            element: el,
            anchor: 'bottom',
          })
            .setLngLat([property.lng, property.lat])
            .addTo(map.current!);
          
          markersRef.current.set(property.id, marker);
        }
      });
    } else {
      // Zoomed in - show individual markers only
      const maxMarkers = 80;
      visibleProperties.slice(0, maxMarkers).forEach((property) => {
        pointIdsToShow.add(property.id);
        
        if (!markersRef.current.has(property.id)) {
          const el = createMarkerElement(property);
          const marker = new mapboxgl.Marker({
            element: el,
            anchor: 'bottom',
          })
            .setLngLat([property.lng, property.lat])
            .addTo(map.current!);
          
          markersRef.current.set(property.id, marker);
        }
      });
    }
    
    // Remove markers that are no longer visible
    clusterMarkersRef.current.forEach((marker, id) => {
      if (!clusterIdsToShow.has(id)) {
        marker.remove();
        clusterMarkersRef.current.delete(id);
      }
    });
    
    markersRef.current.forEach((marker, id) => {
      if (!pointIdsToShow.has(id)) {
        marker.remove();
        markersRef.current.delete(id);
      }
    });
  }, [properties, createMarkerElement, createClusterElement, computeClusters]);

  // Setup marker updates on map events
  useEffect(() => {
    if (!map.current || !mapLoaded) return;
    
    // Remove old markers
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current.clear();
    clusterMarkersRef.current.forEach((marker) => marker.remove());
    clusterMarkersRef.current.clear();

    // Update markers on zoom/move with debouncing
    let updateTimeout: NodeJS.Timeout;
    const debouncedUpdate = () => {
      clearTimeout(updateTimeout);
      updateTimeout = setTimeout(updateAllMarkers, 100);
    };
    
    map.current.on('zoom', debouncedUpdate);
    map.current.on('move', debouncedUpdate);
    
    // Initial update
    updateAllMarkers();

    return () => {
      clearTimeout(updateTimeout);
      if (map.current) {
        map.current.off('zoom', debouncedUpdate);
        map.current.off('move', debouncedUpdate);
      }
    };
  }, [properties, mapLoaded, styleVersion, updateAllMarkers]);

  // Fly to selected property
  useEffect(() => {
    if (!map.current || !selectedProperty) return;
    
    map.current.flyTo({
      center: [selectedProperty.lng, selectedProperty.lat],
      zoom: 14,
      pitch: 55,
      bearing: Math.random() * 20 - 10,
      duration: 2000,
    });

    setTimeout(() => showPropertyPopup(selectedProperty), 1000);
  }, [selectedProperty, showPropertyPopup]);

  // Reset view
  const resetView = useCallback(() => {
    if (!map.current) return;
    
    map.current.flyTo({
      center: [100.5, 13.5],
      zoom: 5.5,
      pitch: 45,
      bearing: -10,
      duration: 2500,
    });
  }, []);

  // Change map style
  const changeMapStyle = useCallback((style: MapStyle) => {
    if (!map.current) return;
    
    setMapStyle(style);
    const styleUrl = style === 'satellite' 
      ? 'mapbox://styles/mapbox/standard-satellite'
      : 'mapbox://styles/mapbox/standard';
    
    const center = map.current.getCenter();
    const zoom = map.current.getZoom();
    const pitch = map.current.getPitch();
    const bearing = map.current.getBearing();
    
    map.current.setStyle(styleUrl);
    
    map.current.once('style.load', () => {
      if (!map.current) return;
      map.current.setCenter(center);
      map.current.setZoom(zoom);
      map.current.setPitch(pitch);
      map.current.setBearing(bearing);
      
      try {
        map.current.setConfigProperty('basemap', 'lightPreset', lightPreset);
      } catch (e) {
        // Ignore
      }
      
      // Re-add terrain and provinces
      if (!map.current.getSource('mapbox-dem')) {
        map.current.addSource('mapbox-dem', {
          type: 'raster-dem',
          url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
          tileSize: 512,
          maxzoom: 14,
        });
      }
      map.current.setTerrain({ source: 'mapbox-dem', exaggeration: 2.0 });
      
      loadProvinces();
      
      // Trigger re-add clustering layers
      setStyleVersion(v => v + 1);
    });
  }, [lightPreset, loadProvinces]);

  // Change light preset
  const changeLightPreset = useCallback((preset: LightPreset) => {
    if (!map.current) return;
    
    setLightPreset(preset);
    try {
      map.current.setConfigProperty('basemap', 'lightPreset', preset);
    } catch (e) {
      console.log('Light preset not supported');
    }
  }, []);

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainer} className="w-full h-full rounded-3xl overflow-hidden" />
      
      {/* Province Stats Tooltip */}
      {hoveredProvince && provinceStats && (
        <div className="absolute top-4 left-4 bg-card border rounded-xl p-4 shadow-lg min-w-[200px] pointer-events-none z-10">
          <h4 className="font-semibold flex items-center gap-2 mb-3">
            <span className="text-primary">📍</span>
            {hoveredProvince}
          </h4>
          {(() => {
            const stats = provinceStats.find(s => s.province === hoveredProvince);
            if (!stats) return <p className="text-sm text-muted-foreground">ไม่มีข้อมูล</p>;
            return (
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">จำนวนทรัพย์</span>
                  <span className="font-semibold text-primary">{stats.count}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">ราคาเฉลี่ย</span>
                  <span className="font-medium">{formatPriceShort(stats.avgPrice)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">ราคาต่ำสุด</span>
                  <span className="font-medium">{formatPriceShort(stats.minPrice)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">ราคาสูงสุด</span>
                  <span className="font-medium">{formatPriceShort(stats.maxPrice)}</span>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* Display Settings Button */}
      <button
        className="display-settings-btn"
        onClick={() => setShowSettings(!showSettings)}
      >
        <KeenIcon icon="setting-2" className="text-lg" />
        <span>Display Settings</span>
      </button>

      {/* Display Settings Panel */}
      {showSettings && (
        <div className="display-settings-panel">
          <div className="settings-header">
            <h3>
              <KeenIcon icon="setting-2" className="text-lg" />
              Display Settings
            </h3>
            <button className="settings-close" onClick={() => setShowSettings(false)}>
              <KeenIcon icon="cross" />
            </button>
          </div>
          
          {/* Map Style */}
          <div className="settings-section">
            <span className="settings-label">🗺️ Map Style</span>
            <div className="style-options">
              <div 
                className={`style-option ${mapStyle === 'standard' ? 'active' : ''}`}
                onClick={() => changeMapStyle('standard')}
              >
                <KeenIcon icon="map" className="text-2xl" />
                <span>Standard</span>
              </div>
              <div 
                className={`style-option ${mapStyle === 'satellite' ? 'active' : ''}`}
                onClick={() => changeMapStyle('satellite')}
              >
                <KeenIcon icon="geolocation" className="text-2xl" />
                <span>Satellite</span>
              </div>
            </div>
          </div>
          
          {/* Light Preset */}
          <div className="settings-section">
            <span className="settings-label">💡 Light Preset</span>
            <div className="preset-options">
              <div 
                className={`preset-option ${lightPreset === 'dawn' ? 'active' : ''}`}
                onClick={() => changeLightPreset('dawn')}
              >
                🌅
                <span>Dawn</span>
              </div>
              <div 
                className={`preset-option ${lightPreset === 'day' ? 'active' : ''}`}
                onClick={() => changeLightPreset('day')}
              >
                ☀️
                <span>Day</span>
              </div>
              <div 
                className={`preset-option ${lightPreset === 'dusk' ? 'active' : ''}`}
                onClick={() => changeLightPreset('dusk')}
              >
                🌆
                <span>Dusk</span>
              </div>
              <div 
                className={`preset-option ${lightPreset === 'night' ? 'active' : ''}`}
                onClick={() => changeLightPreset('night')}
              >
                🌙
                <span>Night</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Controls */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 z-10">
        <Button onClick={resetView} className="gap-2 shadow-lg">
          <KeenIcon icon="arrows-circle" />
          รีเซ็ตมุมมอง
        </Button>
        <div className="flex bg-card rounded-full p-1 shadow-lg">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => map.current?.zoomIn()}
            className="rounded-full"
          >
            <KeenIcon icon="plus" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => map.current?.zoomOut()}
            className="rounded-full"
          >
            <KeenIcon icon="minus" />
          </Button>
        </div>
      </div>

      {/* Marker CSS */}
      <style jsx global>{`
        .marker-3d {
          display: flex;
          flex-direction: column;
          align-items: center;
          cursor: pointer;
        }

        .marker-3d .marker-tag {
          background: linear-gradient(180deg, #ef4444 0%, #dc2626 100%);
          color: white;
          padding: 6px 12px;
          border-radius: 8px;
          font-weight: 700;
          font-size: 12px;
          white-space: nowrap;
          border: 2px solid white;
          box-shadow: 0 3px 10px rgba(0,0,0,0.35);
          animation: marker-float 2s ease-in-out infinite;
        }

        .marker-3d .marker-tag.sold {
          background: linear-gradient(180deg, #9ca3af 0%, #6b7280 100%) !important;
        }

        .marker-3d .marker-tag.led {
          background: linear-gradient(180deg, #60a5fa 0%, #2563eb 100%);
        }

        .marker-3d .marker-pole {
          width: 3px;
          height: 20px;
          background: linear-gradient(180deg, #dc2626 0%, rgba(220,38,38,0.3) 50%, transparent 100%);
          margin-top: -2px;
        }

        .marker-3d .marker-tag.led + .marker-pole {
          background: linear-gradient(180deg, #2563eb 0%, rgba(37,99,235,0.3) 50%, transparent 100%);
        }

        .marker-3d .marker-tag.sold + .marker-pole {
          background: linear-gradient(180deg, #6b7280 0%, rgba(107,114,128,0.3) 50%, transparent 100%);
        }

        .marker-3d .marker-shadow {
          width: 20px;
          height: 8px;
          background: radial-gradient(ellipse, rgba(0,0,0,0.4) 0%, transparent 70%);
          border-radius: 50%;
          animation: shadow-scale 2s ease-in-out infinite;
        }

        @keyframes marker-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }

        @keyframes shadow-scale {
          0%, 100% { transform: scale(1); opacity: 0.4; }
          50% { transform: scale(0.6); opacity: 0.6; }
        }

        .marker-3d:hover {
          z-index: 1000 !important;
        }
        .marker-3d:hover .marker-tag {
          animation: none;
          transform: translateY(-10px) scale(1.15);
          box-shadow: 0 6px 20px rgba(0,0,0,0.5);
        }
        .marker-3d:hover .marker-shadow {
          animation: none;
          transform: scale(0.5);
          opacity: 0.7;
        }

        .property-popup {
          width: 100%;
        }
        .property-popup .popup-image {
          position: relative;
          height: 140px;
          overflow: hidden;
          border-radius: 8px 8px 0 0;
        }
        .property-popup .popup-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .property-popup .popup-image .no-image {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f3f4f6;
          color: #9ca3af;
        }
        .property-popup .popup-tag {
          position: absolute;
          top: 8px;
          left: 8px;
          background: rgba(0,0,0,0.6);
          color: white;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
        }
        .property-popup .popup-tag.sold {
          background: #9ca3af;
        }
        .property-popup .popup-content {
          padding: 12px;
        }
        .property-popup .popup-title {
          font-weight: 600;
          font-size: 14px;
          margin-bottom: 4px;
        }
        .property-popup .popup-location {
          font-size: 12px;
          color: #6b7280;
          margin-bottom: 8px;
        }
        .property-popup .popup-price {
          font-size: 18px;
          font-weight: 700;
          color: #dc2626;
        }

        .mapboxgl-popup-content {
          padding: 0;
          border-radius: 12px;
          overflow: hidden;
        }
        .mapboxgl-popup-close-button {
          background: rgba(255,255,255,0.9);
          border-radius: 50%;
          width: 24px;
          height: 24px;
          right: 8px;
          top: 8px;
          font-size: 16px;
        }
      `}</style>
    </div>
  );
}

// Helper function
function formatPriceShort(price: number): string {
  if (price >= 1000000) {
    return `฿${(price / 1000000).toFixed(1)}M`.replace('.0M', 'M');
  } else if (price >= 1000) {
    return `฿${(price / 1000).toFixed(0)}K`;
  }
  return `฿${price}`;
}

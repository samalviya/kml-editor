import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, FeatureGroup, GeoJSON } from 'react-leaflet';
import { EditControl } from 'react-leaflet-draw';
import { LatLngTuple } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import { Trash2, FileUp, FileDown, MousePointer2 } from 'lucide-react';

const App: React.FC = () => {
  const [polygons, setPolygons] = useState<GeoJSON.FeatureCollection>({
    type: 'FeatureCollection',
    features: [],
  });
  const [map, setMap] = useState<L.Map | null>(null);

  useEffect(() => {
    if (map) {
      map.eachLayer((layer) => {
        if (layer instanceof L.GeoJSON) {
          map.removeLayer(layer);
        }
      });

      L.geoJSON(polygons).addTo(map);
    }
  }, [polygons, map]);

  const handleCreated = (e: any) => {
    const { layer } = e;
    const newPolygon = layer.toGeoJSON();
    setPolygons((prev) => ({
      ...prev,
      features: [...prev.features, newPolygon],
    }));
  };

  const handleEdited = (e: any) => {
    const { layers } = e;
    const editedFeatures: GeoJSON.Feature[] = [];
    layers.eachLayer((layer: any) => {
      editedFeatures.push(layer.toGeoJSON());
    });

    setPolygons((prev) => ({
      ...prev,
      features: prev.features.map((f) => {
        const editedFeature = editedFeatures.find((ef) => ef.properties && ef.properties.id === f.properties?.id);
        return editedFeature || f;
      }),
    }));
  };

  const handleDeleted = (e: any) => {
    const { layers } = e;
    const deletedIds: string[] = [];
    layers.eachLayer((layer: any) => {
      const deletedPolygon = layer.toGeoJSON();
      if (deletedPolygon.properties && deletedPolygon.properties.id) {
        deletedIds.push(deletedPolygon.properties.id);
      }
    });

    setPolygons((prev) => ({
      ...prev,
      features: prev.features.filter((f) => f.properties && !deletedIds.includes(f.properties.id)),
    }));
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(polygons);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const exportFileDefaultName = 'polygons.geojson';
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        try {
          const importedPolygons = JSON.parse(content);
          setPolygons(importedPolygons);
        } catch (error) {
          console.error('Error parsing imported file:', error);
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="h-screen flex flex-col">
      <div className="bg-blue-600 text-white p-4">
        <h1 className="text-2xl font-bold">Polygon/KML Editor</h1>
      </div>
      <div className="flex-grow relative">
        <MapContainer
          center={[51.505, -0.09] as LatLngTuple}
          zoom={13}
          style={{ height: '100%', width: '100%' }}
          whenCreated={setMap}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <FeatureGroup>
            <EditControl
              position="topright"
              onCreated={handleCreated}
              onEdited={handleEdited}
              onDeleted={handleDeleted}
              draw={{
                rectangle: false,
                circle: false,
                circlemarker: false,
                polyline: false,
              }}
            />
          </FeatureGroup>
          <GeoJSON data={polygons} />
        </MapContainer>
      </div>
      <div className="bg-gray-200 p-4 flex justify-between items-center">
        <div>
          <button
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mr-2"
            onClick={handleExport}
          >
            <FileDown className="inline-block mr-1" /> Export
          </button>
          <label className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded cursor-pointer">
            <FileUp className="inline-block mr-1" /> Import
            <input type="file" className="hidden" onChange={handleImport} accept=".geojson,.kml" />
          </label>
        </div>
        <div className="text-sm text-gray-600">
          <MousePointer2 className="inline-block mr-1" /> Click on the map to start drawing
          <Trash2 className="inline-block ml-4 mr-1" /> Select and delete shapes
        </div>
      </div>
    </div>
  );
};

export default App;
from pathlib import Path
p=Path('src/components/CityCompare.tsx')
s=p.read_text(encoding='utf-8')
s=s.replace("import { useMemo, useRef, useState } from 'react';", "import { useEffect, useMemo, useRef, useState } from 'react';")
s=s.replace("import { MapContainer, Marker, TileLayer, Tooltip, ZoomControl } from 'react-leaflet';", "import { MapContainer, Marker, TileLayer, Tooltip, ZoomControl, useMapEvents } from 'react-leaflet';")
s=s.replace("function CityMap({ cities, selected, onToggle }: { cities: CityBenchmark[]; selected: string[]; onToggle: (city: string) => void }) {\n  return (", "function CityMap({ cities, selected, onToggle }: { cities: CityBenchmark[]; selected: string[]; onToggle: (city: string) => void }) {\n  const [zoomLevel, setZoomLevel] = useState(4);\n  return (")
s=s.replace("        scrollWheelZoom={false} zoomControl={false}>\n        <ZoomControl position=\"topright\" />", "        scrollWheelZoom zoomControl={false}>\n        <CityMapZoomObserver onZoom={setZoomLevel} />\n        <ZoomControl position=\"topright\" />")
s=s.replace("<TileLayer url=\"https://tile.openstreetmap.org/{z}/{x}/{y}.png\" attribution=\"&copy; OpenStreetMap contributors\" />", "<TileLayer url=\"https://tile.openstreetmap.org/{z}/{x}/{y}.png\" attribution=\"&copy; OpenStreetMap contributors\" tileSize={128} zoomOffset={1} />",1)
s=s.replace("className: `compare-map-marker ${tone}`", "className: `compare-map-marker ${tone} ${zoomLevel >= 6 ? 'show-label' : ''}`")
s=s.replace("      <div className=\"city-map-hint\">Click a city marker to add or remove it · Drag to explore</div>", "      <div className=\"city-map-hint\">Scroll to zoom · click markers to compare</div>")
needle="function QuickAdd({ cities, selected, onToggle, searchRef }:"
pos=s.index(needle)
s=s[:pos]+"""function CityMapZoomObserver({ onZoom }: { onZoom: (zoom: number) => void }) {
  const map = useMapEvents({ zoomend: () => onZoom(map.getZoom()) });
  useEffect(() => { onZoom(map.getZoom()); }, [map, onZoom]);
  return null;
}

"""+s[pos:]
p.write_text(s,encoding='utf-8')

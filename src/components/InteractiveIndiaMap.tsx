import L from 'leaflet';
import { useMemo } from 'react';
import { MapContainer, Marker, Popup, TileLayer, Tooltip } from 'react-leaflet';
import { CityBenchmark } from '../data';
import { score } from '../data/csv';
import { ConfidenceBadge } from './Badges';

const cityCoordinates: Record<string, [number, number]> = {
  Bengaluru: [12.9716, 77.5946],
  Hyderabad: [17.385, 78.4867],
  'Delhi NCR': [28.4595, 77.0266],
  Pune: [18.5204, 73.8567],
  Chennai: [13.0827, 80.2707],
  Mumbai: [19.076, 72.8777],
  'Ahmedabad/GIFT City': [23.2156, 72.6369],
  Coimbatore: [11.0168, 76.9558],
};

const initialViewportBounds: [[number, number], [number, number]] = [
  [5.6, 66.2],
  [36.4, 99.8],
];

const indiaPanBounds: [[number, number], [number, number]] = [
  [5.5, 62.5],
  [36.5, 104],
];

const displayUnitCounts: Record<string, number> = {
  Bengaluru: 1050,
  Hyderabad: 780,
  'Delhi NCR': 451,
  Pune: 358,
  Chennai: 320,
  Mumbai: 386,
  'Ahmedabad/GIFT City': 122,
  Coimbatore: 108,
};

type InteractiveIndiaMapProps = {
  cities: CityBenchmark[];
};

export function InteractiveIndiaMap({ cities }: InteractiveIndiaMapProps) {
  const markers = useMemo(
    () =>
      cities
        .filter((city) => cityCoordinates[city.city])
        .map((city) => {
          const count = displayUnitCounts[city.city] ?? score(city.gcc_sample_count);
          return {
            city,
            coordinates: cityCoordinates[city.city],
            count,
            radius: markerRadius(count),
          };
        }),
    [cities],
  );

  return (
    <MapContainer
      key="osm-standard-india-map"
      className="embedded-map"
      bounds={initialViewportBounds}
      boundsOptions={{ paddingTopLeft: [12, 12], paddingBottomRight: [395, 20] }}
      maxBounds={indiaPanBounds}
      maxBoundsViscosity={0.85}
      minZoom={4}
      maxZoom={11}
      scrollWheelZoom
      zoomControl
      attributionControl={false}
    >
      <TileLayer
        key="osm-standard-tiles"
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="OpenStreetMap contributors"
        noWrap
      />
      {markers.map(({ city, coordinates, count, radius }) => (
        <Marker key={city.city_id} position={coordinates} icon={cityIcon(radius, city.city, count)}>
          <Tooltip direction="top" offset={[0, -8]} opacity={0.95}>{city.city}</Tooltip>
          <Popup className="city-popup">
            <strong>{city.city}</strong>
            <span>{Number(city.gcc_sample_count).toLocaleString()} GCC sample records</span>
            <p>{city.best_for}</p>
            <ConfidenceBadge score={city.confidence_score} />
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}

function markerRadius(count: number) {
  return Math.max(16, Math.min(34, 15 + count / 48));
}

function cityIcon(radius: number, city: string, count: number) {
  const label = escapeHtml(city.replace('/GIFT City', ' / GIFT City'));
  const units = count.toLocaleString();

  return L.divIcon({
    className: 'gcc-map-marker-shell compact-marker-shell labeled-marker-shell',
    html: `<span class="gcc-map-marker compact-map-marker" style="width:${radius}px;height:${radius}px"><i></i></span><b class="gcc-map-label">${label}<small>${units} units</small></b>`,
    iconSize: [radius, radius],
    iconAnchor: [radius / 2, radius / 2],
    popupAnchor: [0, -radius / 2],
  });
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}








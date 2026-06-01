// src/components/delivery/DeliveryMap.tsx
'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';

const iconRestaurant = L.divIcon({
  className: 'delivery-marker-restaurant',
  html: '<div style="background:#00A082;border-radius:50%;width:32px;height:32px;display:flex;align-items:center;justify-content:center;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3)">🍽️</div>',
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

const iconDriver = L.divIcon({
  className: 'delivery-marker-driver',
  html: '<div style="background:#2563EB;border-radius:50%;width:36px;height:36px;display:flex;align-items:center;justify-content:center;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);font-size:18px">🛵</div>',
  iconSize: [36, 36],
  iconAnchor: [18, 18],
});

const iconDelivery = L.divIcon({
  className: 'delivery-marker-destination',
  html: '<div style="background:#EF4444;border-radius:50%;width:28px;height:28px;display:flex;align-items:center;justify-content:center;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3)">📍</div>',
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

function MapBoundsUpdater({
  driverLat,
  driverLng,
  deliveryLat,
  deliveryLng,
  restaurantLat,
  restaurantLng,
}: {
  driverLat?: number | null;
  driverLng?: number | null;
  deliveryLat: number;
  deliveryLng: number;
  restaurantLat: number;
  restaurantLng: number;
}) {
  const map = useMap();

  useEffect(() => {
    const points: [number, number][] = [
      [restaurantLat, restaurantLng],
      [deliveryLat, deliveryLng],
    ];
    if (driverLat != null && driverLng != null) {
      points.push([driverLat, driverLng]);
    }
    const bounds = L.latLngBounds(points);
    map.fitBounds(bounds, { padding: [40, 40] });
  }, [map, driverLat, driverLng, deliveryLat, deliveryLng, restaurantLat, restaurantLng]);

  return null;
}

export interface DeliveryMapProps {
  driverLat?: number | null;
  driverLng?: number | null;
  driverName?: string;
  restaurantLat: number;
  restaurantLng: number;
  restaurantName?: string;
  deliveryLat: number;
  deliveryLng: number;
  deliveryAddress?: string;
  className?: string;
  style?: React.CSSProperties;
}

export default function DeliveryMap({
  driverLat,
  driverLng,
  driverName,
  restaurantLat,
  restaurantLng,
  restaurantName,
  deliveryLat,
  deliveryLng,
  deliveryAddress,
  className = '',
  style,
}: DeliveryMapProps) {
  const [key, setKey] = useState(0);

  useEffect(() => {
    setKey((k) => k + 1);
  }, [driverLat, driverLng]);

  const routePoints: [number, number][] = [];
  if (driverLat != null && driverLng != null) {
    routePoints.push([driverLat, driverLng]);
  }
  routePoints.push([restaurantLat, restaurantLng]);
  routePoints.push([deliveryLat, deliveryLng]);

  return (
    <MapContainer
      key={key}
      center={[restaurantLat, restaurantLng]}
      zoom={14}
      className={`rounded-2xl overflow-hidden ${className}`}
      style={{ height: 260, width: '100%', zIndex: 1, ...style }}
      scrollWheelZoom={false}
      zoomControl={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <MapBoundsUpdater
        driverLat={driverLat}
        driverLng={driverLng}
        deliveryLat={deliveryLat}
        deliveryLng={deliveryLng}
        restaurantLat={restaurantLat}
        restaurantLng={restaurantLng}
      />

      {driverLat != null && driverLng != null && restaurantLat && restaurantLng && (
        <Polyline
          positions={[
            [driverLat, driverLng],
            [restaurantLat, restaurantLng],
          ]}
          color="#2563EB"
          weight={2}
          dashArray="8 4"
        />
      )}

      <Polyline
        positions={[
          [restaurantLat, restaurantLng],
          [deliveryLat, deliveryLng],
        ]}
        color="#9CA3AF"
        weight={2}
      />

      <Marker position={[restaurantLat, restaurantLng]} icon={iconRestaurant}>
        <Popup>{restaurantName || 'Restaurante'}</Popup>
      </Marker>

      {driverLat != null && driverLng != null && (
        <Marker position={[driverLat, driverLng]} icon={iconDriver}>
          <Popup>{driverName || 'Entregador'}</Popup>
        </Marker>
      )}

      <Marker position={[deliveryLat, deliveryLng]} icon={iconDelivery}>
        <Popup>{deliveryAddress || 'Destino'}</Popup>
      </Marker>
    </MapContainer>
  );
}

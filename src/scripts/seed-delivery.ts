// src/scripts/seed-delivery.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const mockDrivers = [
  {
    id: 'driver-1',
    user_id: 'driver-user-1',
    restaurantId: '1',
    name: 'João Silva',
    phone: '(11) 99999-0001',
    vehicle_type: 'MOTO' as const,
    vehicle_plate: 'ABC-1234',
    is_available: true,
  },
  {
    id: 'driver-2',
    user_id: 'driver-user-2',
    restaurantId: '1',
    name: 'Maria Santos',
    phone: '(11) 99999-0002',
    vehicle_type: 'BIKE' as const,
    is_available: true,
  },
  {
    id: 'driver-3',
    user_id: 'driver-user-3',
    restaurantId: '2',
    name: 'Carlos Oliveira',
    phone: '(11) 99999-0003',
    vehicle_type: 'MOTO' as const,
    vehicle_plate: 'DEF-5678',
    is_available: true,
  },
  {
    id: 'driver-4',
    user_id: 'driver-user-4',
    restaurantId: '3',
    name: 'Ana Costa',
    phone: '(11) 99999-0004',
    vehicle_type: 'CAR' as const,
    vehicle_plate: 'GHI-9012',
    is_available: true,
  },
  {
    id: 'driver-5',
    user_id: 'driver-user-5',
    restaurantId: '5',
    name: 'Paulo Souza',
    phone: '(11) 99999-0005',
    vehicle_type: 'MOTO' as const,
    vehicle_plate: 'JKL-3456',
    is_available: true,
  },
];

const mockZones = [
  {
    id: 'zone-1',
    restaurantId: '1',
    name: 'Zona Principal',
    type: 'RADIUS' as const,
    center_latitude: -23.5505,
    center_longitude: -46.6333,
    radius_km: 10,
    delivery_fee: 5.99,
    min_order_value: 20,
    estimated_time_minutes: 30,
    is_active: true,
    priority: 1,
  },
  {
    id: 'zone-2',
    restaurantId: '2',
    name: 'Área de Entrega',
    type: 'RADIUS' as const,
    center_latitude: -23.5615,
    center_longitude: -46.6544,
    radius_km: 15,
    delivery_fee: 0,
    min_order_value: 30,
    estimated_time_minutes: 40,
    is_active: true,
    priority: 1,
  },
  {
    id: 'zone-3',
    restaurantId: '3',
    name: 'Região Central',
    type: 'RADIUS' as const,
    center_latitude: -23.57,
    center_longitude: -46.62,
    radius_km: 8,
    delivery_fee: 8.99,
    min_order_value: 40,
    estimated_time_minutes: 45,
    is_active: true,
    priority: 1,
  },
  {
    id: 'zone-4',
    restaurantId: '5',
    name: 'Zona Açaí',
    type: 'RADIUS' as const,
    center_latitude: -23.54,
    center_longitude: -46.64,
    radius_km: 12,
    delivery_fee: 3.99,
    min_order_value: 15,
    estimated_time_minutes: 20,
    is_active: true,
    priority: 1,
  },
];

async function main() {
  console.log('🚴 Populando entregadores...');

  for (const driver of mockDrivers) {
    await prisma.deliveryDriver.upsert({
      where: { id: driver.id },
      update: {
        name: driver.name,
        phone: driver.phone,
        vehicle_type: driver.vehicle_type,
        vehicle_plate: driver.vehicle_plate || null,
        is_available: driver.is_available,
      },
      create: {
        id: driver.id,
        user_id: driver.user_id,
        name: driver.name,
        phone: driver.phone,
        vehicle_type: driver.vehicle_type,
        vehicle_plate: driver.vehicle_plate || null,
        is_available: driver.is_available,
        restaurant: { connect: { id: driver.restaurantId } },
      },
    });
    console.log(`  ✅ ${driver.name} (${driver.vehicle_type})`);
  }

  console.log('\n📍 Populando zonas de entrega...');

  for (const zone of mockZones) {
    await prisma.deliveryZone.upsert({
      where: { id: zone.id },
      update: {
        name: zone.name,
        type: zone.type,
        center_latitude: zone.center_latitude,
        center_longitude: zone.center_longitude,
        radius_km: zone.radius_km,
        delivery_fee: zone.delivery_fee,
        min_order_value: zone.min_order_value,
        estimated_time_minutes: zone.estimated_time_minutes,
        is_active: zone.is_active,
        priority: zone.priority,
      },
      create: {
        id: zone.id,
        name: zone.name,
        type: zone.type,
        center_latitude: zone.center_latitude,
        center_longitude: zone.center_longitude,
        radius_km: zone.radius_km,
        delivery_fee: zone.delivery_fee,
        min_order_value: zone.min_order_value,
        estimated_time_minutes: zone.estimated_time_minutes,
        is_active: zone.is_active,
        priority: zone.priority,
        restaurant: { connect: { id: zone.restaurantId } },
      },
    });
    console.log(`  ✅ ${zone.name} — R$ ${zone.delivery_fee.toFixed(2)}`);
  }

  console.log('\n🎉 Entregadores e zonas criados com sucesso!');
}

main()
  .catch((e) => {
    console.error('❌ Erro:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

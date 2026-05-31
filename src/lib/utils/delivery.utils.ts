// src/lib/utils/delivery.utils.ts
/**
 * Calcula distância entre duas coordenadas usando fórmula de Haversine
 * @returns Distância em quilômetros
 */
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Raio da Terra em km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return Math.round(distance * 10) / 10; // Arredonda para 1 casa decimal
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Calcula taxa de entrega baseada na distância
 */
export function calculateDeliveryFee(
  distanceKm: number,
  baseFee: number = 5,
  pricePerKm: number = 2
): number {
  if (distanceKm <= 1) return baseFee;

  const additionalKm = Math.ceil(distanceKm - 1);
  return baseFee + additionalKm * pricePerKm;
}

/**
 * Estima tempo de entrega baseado na distância
 */
export function estimateDeliveryTime(
  distanceKm: number,
  preparationTimeMin: number = 15
): { min: number; max: number } {
  // Tempo base: preparo + 3 min por km
  const travelTime = Math.ceil(distanceKm * 3);

  return {
    min: preparationTimeMin + travelTime,
    max: preparationTimeMin + travelTime + 10, // margem de 10 min
  };
}

/**
 * Verifica se endereço está dentro do raio de entrega
 */
export function isWithinDeliveryRadius(distanceKm: number, maxRadiusKm: number): boolean {
  return distanceKm <= maxRadiusKm;
}

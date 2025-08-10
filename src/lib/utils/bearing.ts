/**
 * Calculate the bearing from one point to another in degrees (0-360)
 * 0° = North, 90° = East, 180° = South, 270° = West
 */
export function calculateBearing(
  fromLat: number,
  fromLon: number,
  toLat: number,
  toLon: number
): number {
  const φ1 = (fromLat * Math.PI) / 180; // φ, λ in radians
  const φ2 = (toLat * Math.PI) / 180;
  const Δλ = ((toLon - fromLon) * Math.PI) / 180;

  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);

  const θ = Math.atan2(y, x);

  return ((θ * 180) / Math.PI + 360) % 360; // in degrees
}

/**
 * Convert compass direction letter to degrees
 * N = 0°, E = 90°, S = 180°, W = 270°
 */
export function directionToDegrees(direction: string): number {
  const directions: Record<string, number> = {
    'N': 0,
    'NE': 45,
    'E': 90,
    'SE': 135,
    'S': 180,
    'SW': 225,
    'W': 270,
    'NW': 315
  };
  
  return directions[direction.toUpperCase()] || 0;
}

/**
 * Calculate the rotation angle for the plane icon based on:
 * - The bearing from user location to aircraft
 * - The direction the user is facing
 * 
 * Returns rotation in degrees where:
 * - 0° = pointing up (12 o'clock)
 * - 90° = pointing right (3 o'clock)
 * - 180° = pointing down (6 o'clock)
 * - 270° = pointing left (9 o'clock)
 */
export function calculatePlaneRotation(
  userLat: number,
  userLon: number,
  planeLat: number,
  planeLon: number,
  userFacingDirection: string
): number {
  // Calculate bearing from user to plane (0° = North)
  const bearingToPlane = calculateBearing(userLat, userLon, planeLat, planeLon);
  
  // Get the direction the user is facing in degrees
  const userFacingDegrees = directionToDegrees(userFacingDirection);
  
  // Calculate relative bearing (how much to turn from facing direction)
  let relativeBearing = bearingToPlane - userFacingDegrees;
  
  // Normalize to 0-360 range
  if (relativeBearing < 0) {
    relativeBearing += 360;
  }
  
  // Convert to screen rotation:
  // - If plane is in the direction user is facing (0° relative), point up (0° rotation)
  // - If plane is to the right (90° relative), point right (90° rotation)
  // - If plane is behind (180° relative), point down (180° rotation)
  // - If plane is to the left (270° relative), point left (270° rotation)
  
  return relativeBearing;
}

/**
 * Get a human-readable description of where the plane is relative to the user
 */
export function getRelativeDirection(
  userLat: number,
  userLon: number,
  planeLat: number,
  planeLon: number,
  userFacingDirection: string
): string {
  const rotation = calculatePlaneRotation(userLat, userLon, planeLat, planeLon, userFacingDirection);
  
  // Convert rotation to clock position
  if (rotation >= 337.5 || rotation < 22.5) return "straight ahead";
  if (rotation >= 22.5 && rotation < 67.5) return "ahead and to the right";
  if (rotation >= 67.5 && rotation < 112.5) return "to your right";
  if (rotation >= 112.5 && rotation < 157.5) return "behind and to the right";
  if (rotation >= 157.5 && rotation < 202.5) return "behind you";
  if (rotation >= 202.5 && rotation < 247.5) return "behind and to the left";
  if (rotation >= 247.5 && rotation < 292.5) return "to your left";
  if (rotation >= 292.5 && rotation < 337.5) return "ahead and to the left";
  
  return "nearby";
}

/**
 * P0.8.2 - 3D Star Rendering Tests
 * 
 * Tests for color calculation, size scaling, and LOD management
 */

import {
  bprpToTemperature,
  temperatureToRGB,
  getStarColor,
  spectralTypeToRGB,
  REFERENCE_STAR_COLORS,
} from '../rendering/ColorCalculator';

import {
  getMagnitudeSize,
  getMagnitudeBrightness,
  getMagnitudeGlow,
  getMagnitudeHaloSize,
  getStarRenderingParams,
  validateMagnitude,
  REFERENCE_STAR_SIZES,
} from '../rendering/SizeCalculator';

import {
  StarLODManager,
  createLODManagerForProfile,
} from '../stars/StarLODManager';

describe('ColorCalculator', () => {
  describe('bprpToTemperature', () => {
    test('should return Sun-like temperature for BP-RP ≈ 0.65', () => {
      const temp = bprpToTemperature(0.656);
      expect(temp).toBeGreaterThan(5500);
      expect(temp).toBeLessThan(6000);
    });
    
    test('should return hot temperature for negative BP-RP (blue stars)', () => {
      const temp = bprpToTemperature(-0.15); // Vega
      expect(temp).toBeGreaterThan(7000);
    });
    
    test('should return cool temperature for positive BP-RP (red stars)', () => {
      const temp = bprpToTemperature(1.5); // Red star
      expect(temp).toBeLessThan(4000);
    });
    
    test('should clamp to valid range for extreme values', () => {
      const tooHot = bprpToTemperature(-10);
      const tooCold = bprpToTemperature(10);
      
      expect(tooHot).toBeGreaterThanOrEqual(2500);
      expect(tooCold).toBeLessThanOrEqual(15000);
    });
    
    test('should handle invalid input', () => {
      expect(bprpToTemperature(NaN)).toBe(5778);
      expect(bprpToTemperature(null)).toBe(5778);
      expect(bprpToTemperature(undefined)).toBe(5778);
    });
  });
  
  describe('temperatureToRGB', () => {
    test('should return bluish color for hot star (10000K)', () => {
      const rgb = temperatureToRGB(10000);
      expect(rgb.b).toBeGreaterThan(rgb.r);
      expect(rgb.r).toBeGreaterThan(0);
    });
    
    test('should return reddish color for cool star (3500K)', () => {
      const rgb = temperatureToRGB(3500);
      expect(rgb.r).toBeGreaterThan(rgb.b);
      expect(rgb.b).toBeGreaterThan(0);
    });
    
    test('should return nearly white for Sun (5778K)', () => {
      const rgb = temperatureToRGB(5778);
      expect(rgb.r).toBeGreaterThan(0.8);
      expect(rgb.g).toBeGreaterThan(0.8);
      expect(rgb.b).toBeGreaterThan(0.7);
    });
    
    test('should clamp RGB values to [0, 1]', () => {
      const rgb1 = temperatureToRGB(2000);
      const rgb2 = temperatureToRGB(15000);
      
      [rgb1, rgb2].forEach(rgb => {
        expect(rgb.r).toBeGreaterThanOrEqual(0);
        expect(rgb.r).toBeLessThanOrEqual(1);
        expect(rgb.g).toBeGreaterThanOrEqual(0);
        expect(rgb.g).toBeLessThanOrEqual(1);
        expect(rgb.b).toBeGreaterThanOrEqual(0);
        expect(rgb.b).toBeLessThanOrEqual(1);
      });
    });
  });
  
  describe('getStarColor', () => {
    test('should use BP-RP if available', () => {
      const colorBPRP = getStarColor(0.656);
      const colorSpectral = getStarColor(NaN, 'G2V');
      
      // Both should be similar (sun-like)
      expect(colorBPRP.r).toBeGreaterThan(0.8);
      expect(colorSpectral.r).toBeGreaterThan(0.8);
    });
    
    test('should fallback to spectral type', () => {
      const colorA = getStarColor(NaN, 'A0V');
      const colorM = getStarColor(NaN, 'M1Ib');
      
      // A-type should be hotter (bluer)
      expect(colorA.b).toBeGreaterThan(colorM.b);
    });
    
    test('should return default if both unavailable', () => {
      const color = getStarColor(NaN);
      expect(color.r).toBeCloseTo(1, 1);
      expect(color.g).toBeCloseTo(0.95, 1);
    });
  });
  
  describe('spectralTypeToRGB', () => {
    test('should return hot color for O-type', () => {
      const color = spectralTypeToRGB('O5V');
      expect(color.b).toBeGreater(color.r);
    });
    
    test('should return cool color for M-type', () => {
      const color = spectralTypeToRGB('M5V');
      expect(color.r).toBeGreater(color.b);
    });
    
    test('should be case-insensitive', () => {
      const color1 = spectralTypeToRGB('A0V');
      const color2 = spectralTypeToRGB('a0v');
      
      expect(color1.r).toBeCloseTo(color2.r, 5);
      expect(color1.g).toBeCloseTo(color2.g, 5);
    });
  });
  
  describe('Reference colors', () => {
    test('Sirius (A1V) should be white-blue', () => {
      const color = getStarColor(0.005); // Sirius BP-RP
      expect(color.b).toBeLessThan(color.r); // Slightly blue, but not too extreme
      expect(color.g).toBeGreaterThan(0.8);
    });
    
    test('Betelgeuse (M1Ib) should be orange-red', () => {
      const color = getStarColor(1.5);
      expect(color.r).toBeGreater(color.b);
      expect(color.b).toBeLessThan(0.5);
    });
  });
});

describe('SizeCalculator', () => {
  describe('getMagnitudeSize', () => {
    test('should be larger for brighter stars (lower magnitude)', () => {
      const sizeSirius = getMagnitudeSize(-1.46, 'medium');
      const sizeAverage = getMagnitudeSize(5, 'medium');
      const sizeDim = getMagnitudeSize(10, 'medium');
      
      expect(sizeSirius).toBeGreater(sizeAverage);
      expect(sizeAverage).toBeGreater(sizeDim);
    });
    
    test('should scale with magnitude differences', () => {
      // Magnitude difference of 5 = ~100x brightness = ~10x size
      const size0 = getMagnitudeSize(0, 'medium');
      const size5 = getMagnitudeSize(5, 'medium');
      
      const ratio = size0 / size5;
      expect(ratio).toBeGreaterThan(5);
      expect(ratio).toBeLessThan(15);
    });
    
    test('should be clamped between min and max', () => {
      const extremeBright = getMagnitudeSize(-10, 'medium');
      const extremeDim = getMagnitudeSize(20, 'medium');
      
      expect(extremeBright).toBeLessThanOrEqual(16);
      expect(extremeDim).toBeGreaterThanOrEqual(0.5);
    });
    
    test('should vary by LOD level', () => {
      const magnitude = 5;
      const sizes = {
        detail: getMagnitudeSize(magnitude, 'detail'),
        near: getMagnitudeSize(magnitude, 'near'),
        medium: getMagnitudeSize(magnitude, 'medium'),
        far: getMagnitudeSize(magnitude, 'far'),
      };
      
      // Detail should have largest base size
      expect(sizes.detail).toBeGreater(sizes.near);
      expect(sizes.near).toBeGreater(sizes.medium);
      expect(sizes.medium).toBeGreater(sizes.far);
    });
    
    test('should return 0 for skip LOD', () => {
      expect(getMagnitudeSize(5, 'skip')).toBe(0);
    });
    
    test('should handle invalid magnitude gracefully', () => {
      expect(getMagnitudeSize(NaN, 'medium')).toBeGreaterThan(0);
      expect(getMagnitudeSize(null, 'medium')).toBeGreaterThan(0);
    });
  });
  
  describe('getMagnitudeBrightness', () => {
    test('should be higher for brighter stars', () => {
      const brightBrightness = getMagnitudeBrightness(-1.46, 'medium');
      const dimBrightness = getMagnitudeBrightness(10, 'medium');
      
      expect(brightBrightness).toBeGreater(dimBrightness);
    });
    
    test('should be clamped to [0, 1]', () => {
      const brightness = getMagnitudeBrightness(-100, 'medium');
      expect(brightness).toBeGreaterThanOrEqual(0);
      expect(brightness).toBeLessThanOrEqual(1);
    });
  });
  
  describe('getMagnitudeGlow', () => {
    test('should increase with brightness (lower magnitude)', () => {
      const glowBright = getMagnitudeGlow(-1.46);
      const glowDim = getMagnitudeGlow(10);
      
      expect(glowBright).toBeGreater(glowDim);
    });
    
    test('should be in range [0, 1]', () => {
      const glow1 = getMagnitudeGlow(-10);
      const glow2 = getMagnitudeGlow(20);
      
      expect(glow1).toBeGreaterThanOrEqual(0);
      expect(glow1).toBeLessThanOrEqual(1);
      expect(glow2).toBeGreaterThanOrEqual(0);
      expect(glow2).toBeLessThanOrEqual(1);
    });
  });
  
  describe('getMagnitudeHaloSize', () => {
    test('should increase with brightness', () => {
      const haloBright = getMagnitudeHaloSize(-1.46);
      const haloDim = getMagnitudeHaloSize(10);
      
      expect(haloBright).toBeGreater(haloDim);
    });
    
    test('should be in range [1, 3]', () => {
      const halo1 = getMagnitudeHaloSize(-10);
      const halo2 = getMagnitudeHaloSize(20);
      
      expect(halo1).toBeGreaterThanOrEqual(1);
      expect(halo1).toBeLessThanOrEqual(3);
      expect(halo2).toBeGreaterThanOrEqual(1);
      expect(halo2).toBeLessThanOrEqual(3);
    });
  });
  
  describe('validateMagnitude', () => {
    test('should accept valid magnitudes', () => {
      const result = validateMagnitude(5);
      expect(result.valid).toBe(true);
    });
    
    test('should reject invalid types', () => {
      const result = validateMagnitude('5');
      expect(result.valid).toBe(false);
    });
    
    test('should clamp extreme values', () => {
      const result = validateMagnitude(100);
      expect(result.valid).toBe(false);
      expect(result.clampedMagnitude).toBeLessThanOrEqual(20);
    });
  });
});

describe('StarLODManager', () => {
  let manager;
  
  beforeEach(() => {
    manager = new StarLODManager();
  });
  
  describe('getLODLevel', () => {
    test('should return detail for very close stars', () => {
      expect(manager.getLODLevel(1)).toBe('detail');
    });
    
    test('should return near for 2-10 pc', () => {
      expect(manager.getLODLevel(5)).toBe('near');
    });
    
    test('should return medium for 10-100 pc', () => {
      expect(manager.getLODLevel(50)).toBe('medium');
    });
    
    test('should return far for 100-500 pc', () => {
      expect(manager.getLODLevel(200)).toBe('far');
    });
    
    test('should return skip for > 500 pc', () => {
      expect(manager.getLODLevel(1000)).toBe('skip');
    });
    
    test('should handle boundary cases', () => {
      expect(manager.getLODLevel(2.0)).toBe('near');
      expect(manager.getLODLevel(1.99)).toBe('detail');
      expect(manager.getLODLevel(100)).toBe('far');
      expect(manager.getLODLevel(99.99)).toBe('medium');
    });
  });
  
  describe('checkBudget', () => {
    test('should report star within budget initially', () => {
      const result = manager.checkBudget(5, 'near');
      expect(result.withinBudget).toBe(true);
      expect(result.count).toBe(0);
    });
    
    test('should track priority based on distance', () => {
      const near = manager.checkBudget(5, 'near');
      const far = manager.checkBudget(9, 'near');
      
      expect(near.priority).toBeLessThan(far.priority);
    });
  });
  
  describe('count tracking', () => {
    test('should add stars to count', () => {
      manager.addStar('medium');
      manager.addStar('medium');
      manager.addStar('far');
      
      expect(manager.counts.medium).toBe(2);
      expect(manager.counts.far).toBe(1);
    });
    
    test('should reset counts', () => {
      manager.addStar('medium');
      manager.resetCounts();
      
      expect(manager.counts.medium).toBe(0);
    });
  });
  
  describe('performance tracking', () => {
    test('should reduce quality when over budget', () => {
      const originalQuality = manager.qualityFactor;
      
      // Simulate slow frame
      manager.updateFrameTiming(20); // > 16.67 ms
      manager.updateFrameTiming(20);
      
      expect(manager.qualityFactor).toBeLessThan(originalQuality);
    });
    
    test('should improve quality when under budget', () => {
      manager.qualityFactor = 0.7;
      
      // Simulate fast frame
      manager.updateFrameTiming(10); // < 16.67 ms
      manager.updateFrameTiming(10);
      
      expect(manager.qualityFactor).toBeGreater(0.7);
    });
  });
  
  describe('device profiles', () => {
    test('low profile should have small budgets', () => {
      const low = createLODManagerForProfile('low');
      const high = createLODManagerForProfile('high');
      
      expect(low.budgets.medium).toBeLessThan(high.budgets.medium);
    });
    
    test('high profile should have large budgets', () => {
      const high = createLODManagerForProfile('high');
      
      expect(high.budgets.detail).toBeGreaterThanOrEqual(500);
      expect(high.budgets.far).toBeGreaterThanOrEqual(100000);
    });
  });
  
  describe('getStats', () => {
    test('should return statistics', () => {
      manager.addStar('detail');
      manager.addStar('medium');
      manager.addStar('medium');
      
      const stats = manager.getStats();
      
      expect(stats.totalStars).toBe(3);
      expect(stats.detail).toBe(1);
      expect(stats.medium).toBe(2);
    });
  });
});

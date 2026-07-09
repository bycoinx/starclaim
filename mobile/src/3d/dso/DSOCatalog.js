/**
 * P0.8.4 - DSO Catalog Data Model
 * 
 * Manages Deep Sky Object catalog with indexing and search
 */

export class DSOCatalog {
  constructor(dsoData = []) {
    this.dsos = dsoData;
    this.messierIndex = {};
    this.ngcIndex = {};
    this.nameIndex = {};
    this.buildIndexes();
  }
  
  /**
   * Build search indexes
   */
  buildIndexes() {
    this.messierIndex = {};
    this.ngcIndex = {};
    this.nameIndex = {};
    
    for (const dso of this.dsos) {
      if (dso.messierNumber) {
        this.messierIndex[dso.messierNumber] = dso;
      }
      if (dso.ngcNumber) {
        this.ngcIndex[dso.ngcNumber] = dso;
      }
      if (dso.commonName) {
        this.nameIndex[dso.commonName.toLowerCase()] = dso;
      }
    }
  }
  
  /**
   * Get DSO by Messier number
   */
  getByMessier(number) {
    return this.messierIndex[number] || null;
  }
  
  /**
   * Get DSO by NGC number
   */
  getByNGC(number) {
    return this.ngcIndex[number] || null;
  }
  
  /**
   * Get DSO by common name
   */
  getByName(name) {
    return this.nameIndex[name.toLowerCase()] || null;
  }
  
  /**
   * Get DSOs in 3D sphere
   */
  getNearby(x, y, z, radius) {
    const results = [];
    
    for (const dso of this.dsos) {
      if (!dso.voyageX || !dso.voyageY || !dso.voyageZ) continue;
      
      const dx = dso.voyageX - x;
      const dy = dso.voyageY - y;
      const dz = dso.voyageZ - z;
      const distance = Math.sqrt(dx*dx + dy*dy + dz*dz);
      
      if (distance <= radius) {
        results.push({
          dso,
          distance,
        });
      }
    }
    
    results.sort((a, b) => a.distance - b.distance);
    return results;
  }
  
  /**
   * Get DSOs visible from camera
   * Respects visibility rules (distance, magnitude)
   */
  getVisible(cameraX, cameraY, cameraZ, cameraDistance) {
    const results = [];
    
    for (const dso of this.dsos) {
      // Check visibility rules
      if (dso.visibility) {
        if (cameraDistance < dso.visibility.minDistance) continue;
        if (cameraDistance > dso.visibility.maxDistance) continue;
        if (dso.magnitude && dso.magnitude > dso.visibility.minMagnitude) continue;
      }
      
      // Check if within ~2000 pc search radius
      if (dso.voyageX && dso.voyageY && dso.voyageZ) {
        const dx = dso.voyageX - cameraX;
        const dy = dso.voyageY - cameraY;
        const dz = dso.voyageZ - cameraZ;
        const distance = Math.sqrt(dx*dx + dy*dy + dz*dz);
        
        if (distance <= 2000) {
          results.push(dso);
        }
      }
    }
    
    return results;
  }
  
  /**
   * Get all DSOs of a specific type
   */
  getByType(type) {
    return this.dsos.filter(dso => dso.type === type);
  }
  
  /**
   * Get brightest DSOs (lowest magnitude)
   */
  getBrightestDSOs(limit = 50) {
    return [...this.dsos]
      .filter(dso => dso.magnitude !== undefined)
      .sort((a, b) => a.magnitude - b.magnitude)
      .slice(0, limit);
  }
  
  /**
   * Get DSOs by magnitude range
   */
  getByMagnitudeRange(minMag, maxMag) {
    return this.dsos.filter(
      dso => dso.magnitude >= minMag && dso.magnitude <= maxMag
    );
  }
  
  /**
   * Get all Messier objects
   */
  getAllMessier() {
    return this.dsos.filter(dso => dso.messierNumber !== undefined);
  }
  
  /**
   * Get statistics
   */
  getStats() {
    const messierCount = Object.keys(this.messierIndex).length;
    const ngcCount = Object.keys(this.ngcIndex).length;
    const typeStats = {};
    
    for (const dso of this.dsos) {
      if (dso.type) {
        typeStats[dso.type] = (typeStats[dso.type] || 0) + 1;
      }
    }
    
    return {
      totalDSOs: this.dsos.length,
      messierObjects: messierCount,
      ngcObjects: ngcCount,
      typeDistribution: typeStats,
    };
  }
  
  /**
   * Export catalog as JSON (for caching)
   */
  toJSON() {
    return {
      dsos: this.dsos,
      stats: this.getStats(),
    };
  }
}

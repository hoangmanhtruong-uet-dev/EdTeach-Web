/**
 * PhET & Tongjiang 3D Simulations Library
 *
 * Single source of truth & helper re-exports for 3D simulations.
 * Ensuring 100% free open access under Creative Commons Attribution-NonCommercial 4.0
 * International License (CC BY-NC 4.0).
 *
 * Proprietary value-add features (Pedagogical Whiteboard Overlay, AI Simulation Assistant,
 * and Automated Quiz/Worksheet Generator) are monetized under EduTest PRO.
 */

export * from "@/data/labs";

import {
  LABS,
  type LabLesson,
  type LabSubject,
  getLab,
  labsBySubject,
  labFileUrl,
  labCoverUrl,
  PHET_CC_ATTRIBUTION,
} from "@/data/labs";

/**
 * All 54 PhET & 3D simulations are 100% open access without paywall.
 */
export function isOpenAccessSimulation(_slug: string): boolean {
  return true;
}

/**
 * Helper to get attribution citation metadata for display
 */
export function getSimulationAttribution(lab: LabLesson): {
  source: string;
  license: string;
  licenseUrl: string;
  notice: string;
} {
  return {
    source: "PhET Interactive Simulations (University of Colorado Boulder) & Tongjiang Lab",
    license: "CC BY-NC 4.0",
    licenseUrl: PHET_CC_ATTRIBUTION.licenseUrl,
    notice: `Mô phỏng "${lab.titleVi}" được cung cấp mở miễn phí 100% cho mục đích giáo dục phi thương mại theo giấy phép CC BY-NC 4.0.`,
  };
}

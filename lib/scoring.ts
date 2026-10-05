
export interface SinbadParams {
  site: boolean; // Is it forefoot/midfoot (0) or hindfoot (1)
  ischemia: boolean; // Clinical evidence of ischemia (1) or none (0)
  neuropathy: boolean; // Loss of protective sensation (1) or none (0)
  bacterialInfection: boolean; // Presence of infection (1) or none (0)
  areaGreaterThan5cm2: boolean; // Area > 5 cm2 (1) or <= 5 (0)
  depthToCavityOrBone: boolean; // Deep ulcer (1) or superficial (0)
}

export function calculateSinbadScore(params: SinbadParams): number {
  let score = 0;
  if (params.site) score += 1;
  if (params.ischemia) score += 1;
  if (params.neuropathy) score += 1;
  if (params.bacterialInfection) score += 1;
  if (params.areaGreaterThan5cm2) score += 1;
  if (params.depthToCavityOrBone) score += 1;
  return score;
}

export function determineIwgdfGrade(
  hasInfectionSigns: boolean,
  erythemaSizeMm: number,
  isDeepUlcer: boolean,
  hasSirs: boolean
): { grade: number; label: string; severity: "mild" | "moderate" | "severe" | "uninfected" } {
  if (!hasInfectionSigns) {
    return { grade: 1, label: "Enfekte Değil (Uninfected)", severity: "uninfected" };
  }
  if (hasSirs) {
    return { grade: 4, label: "Ağır Enfeksiyon (Severe Systemic)", severity: "severe" };
  }
  if (erythemaSizeMm > 20 || isDeepUlcer) {
    return { grade: 3, label: "Orta Enfeksiyon (Moderate Deep)", severity: "moderate" };
  }
  return { grade: 2, label: "Hafif Enfeksiyon (Mild Superficial)", severity: "mild" };
}

export function determineWagnerGrade(isSuperficial: boolean, isDeep: boolean, osteomyelitis: boolean, gangreneLocalized: boolean, gangreneExtensive: boolean): number {
  if (gangreneExtensive) return 5;
  if (gangreneLocalized) return 4;
  if (osteomyelitis || isDeep) return 3; // Osteomiyelit, apse veya derin penetrasyon
  if (isDeep && !osteomyelitis) return 2; // Ligament, tendon, eklem kapsülü penetrasyonu
  if (isSuperficial) return 1; // Yüzeysel ülser
  return 0; // Pre-ülseratif lezyonlar / intakt cilt
}


export interface CdssInputData {
  visitReason: string;
  abiScore: number;
  hasLops: boolean;
  hasPneumothorax: boolean;
  hasBleomycinHistory: boolean;
  hasActiveEpilepsy: boolean;
  isProbeToBone: boolean;
  esrValue?: number; // Sedimantasyon
  crpValue?: number;  // C-Reaktif Protein
  areaCm2: number;
  depthCm: number;
}

export interface CdssOutput {
  ulcerType: "Nöropatik" | "Nöroiskemik" | "İskemik" | "Belirlenemedi";
  hbotStatus: "MUTLAK_KONTRENDİKE" | "GÖRECELİ_KONTRENDİKE" | "UYGUN";
  hbotWarnings: string[];
  osteomyelitisRisk: "Yüksek" | "Orta" | "Düşük";
  sutQuotaCode: string;
  sutQuotaDetails: string;
  recommendedPlan: {
    offloading: string;
    debridement: string;
    dressing: string;
    hbotProtocol: string;
  };
}

export function runCdssEngine(data: CdssInputData): CdssOutput {
  const warnings: string[] = [];
  let status: "MUTLAK_KONTRENDİKE" | "GÖRECELİ_KONTRENDİKE" | "UYGUN" = "UYGUN";

  // 1. HBOT Güvenlik & Kontrendikasyon Analizi
  if (data.hasPneumothorax) {
    status = "MUTLAK_KONTRENDİKE";
    warnings.push("Aktif tedavi edilmemiş pnömotoraks mevcuttur. HBOT KESİNLİKLE UYGULANAMAZ!");
  }
  if (data.hasBleomycinHistory) {
    status = "MUTLAK_KONTRENDİKE";
    warnings.push("Geçmişte Bleomisin kullanımı mevcuttur. Akciğer toksisitesi riski nedeniyle HBOT kontrendikedir.");
  }
  if (data.hasActiveEpilepsy) {
    if (status !== "MUTLAK_KONTRENDİKE") status = "GÖRECELİ_KONTRENDİKE";
    warnings.push("Aktif/Kontrolsüz Epilepsi mevcuttur. Oksijen toksisitesi nöbet eşiğini düşürebilir. Antikonvülzan profilaksisi önerilir.");
  }

  // 2. Ülser Sınıflandırma
  let ulcerType: "Nöropatik" | "Nöroiskemik" | "İskemik" | "Belirlenemedi" = "Belirlenemedi";
  if (data.abiScore >= 0.9) {
    ulcerType = data.hasLops ? "Nöropatik" : "Belirlenemedi";
  } else if (data.abiScore >= 0.5 && data.abiScore < 0.9) {
    ulcerType = "Nöroiskemik";
  } else if (data.abiScore < 0.5) {
    ulcerType = "İskemik";
  }

  // 3. Osteomiyelit Olasılığı Hesaplama
  let osteomyelitisRisk: "Yüksek" | "Orta" | "Düşük" = "Düşük";
  if (data.isProbeToBone && data.esrValue && data.esrValue > 70) {
    osteomyelitisRisk = "Yüksek";
    warnings.push("Kemik teması pozitif ve ESR > 70 mm/saat. Yüksek osteomiyelit şüphesi! İleri görüntüleme (MRG veya Kemik Biyopsisi) planlayınız.");
  } else if (data.isProbeToBone || (data.esrValue && data.esrValue > 50)) {
    osteomyelitisRisk = "Orta";
  }

  // 4. SUT (Sağlık Uygulama Tebliği) Eşleşmesi ve Kota Bilgisi
  let sutQuotaCode = "-";
  let sutQuotaDetails = "SUT Endikasyon Dışı Başvuru";

  switch (data.visitReason) {
    case "SUT_DIABETIC_FOOT":
      sutQuotaCode = "703.110";
      sutQuotaDetails = "Diyabetik Ayak Ülseri: İlk sevk raporu ile en fazla 30 seans. Klinik iyileşme raporlanırsa +30 seans ek onay alınabilir (Maksimum 60 seans kota).";
      break;
    case "SUT_OSTEOMYELITIS":
      sutQuotaCode = "703.070";
      sutQuotaDetails = "Kronik Refrakter Osteomiyelit: Maksimum 40 seans kota. Ortodontik/Ortopedik cerrahi planlaması ile koordineli yürütülmelidir.";
      break;
    case "SUT_CARBON_MONOXIDE":
      sutQuotaCode = "703.010";
      sutQuotaDetails = "Karbonmonoksit Zehirlenmesi: Acil endikasyon. İlk 24 saat içinde 3 seansa kadar ardışık acil HBOT protokolü uygulanır. Kota sınırı yoktur.";
      break;
    case "SUT_SUDDEN_DEAFNESS":
      sutQuotaCode = "703.150";
      sutQuotaDetails = "Ani İşitme Kaybı: İlk 14 gün içinde başvuru şartı mevcuttur. Genellikle 15-20 seans protokol planlanır.";
      break;
    case "WELLNESS":
      sutQuotaCode = "SUT-DIŞI";
      sutQuotaDetails = "Zindelik / Performans: Sosyal Güvenlik Kurumu (SGK) ödeme kapsamında değildir. Özel faturalandırma uygulanır.";
      break;
  }

  // 5. Algoritmik Tedavi Planlama Önerileri
  let offloading = "Basınç dağıtıcı tabanlık veya geçici alçı botu önerilmez.";
  if (ulcerType === "Nöropatik" || ulcerType === "Nöroiskemik") {
    offloading = "Total Kontakt Alçı (TCC) veya Non-weight Bearing Off-loading Cihazı (Altın Standart)";
  }

  let debridement = "Yara yatağında nekrotik doku yoksa debridman gereksizdir.";
  if (data.depthCm > 0.2) {
    debridement = "Keskin/Cerrahi Debridman (Hiperkeratotik kenarlar temizlenmeli, nekrotik odak bırakılmamalıdır).";
  }

  let dressing = "Nem dengesini koruyan basit yara örtüsü.";
  if (data.crpValue && data.crpValue > 10) {
    dressing = "Gümüş içerikli antimikrobiyal hidrofiber / köpük pansuman (Nem ve akıntı kontrolü için).";
  } else if (data.areaCm2 > 5) {
    dressing = "Kollajen aktif yara örtüleri veya Negatif Basınçlı Yara Tedavisi (NPWT) geçişi düşünülebilir.";
  }

  let hbotProtocol = "HBOT Endike Değil";
  if (status === "UYGUN" && data.visitReason !== "WELLNESS") {
    hbotProtocol = "2.4 ATA basınçta, %100 Oksijen solunumu ile 90-120 dakika, günde 1 veya 2 seans protokolü.";
  } else if (data.visitReason === "WELLNESS") {
    hbotProtocol = "Mild-HBOT (1.5 - 2.0 ATA), 60 dakika, haftada 2-3 seans hücresel oksijenasyon protokolü.";
  }

  return {
    ulcerType,
    hbotStatus: status,
    hbotWarnings: warnings,
    osteomyelitisRisk,
    sutQuotaCode,
    sutQuotaDetails,
    recommendedPlan: {
      offloading,
      debridement,
      dressing,
      hbotProtocol
    }
  };
}

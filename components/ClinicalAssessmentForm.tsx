
import React, { useState, useEffect } from "react";
import { calculateSinbadScore, determineIwgdfGrade, determineWagnerGrade } from "../lib/scoring";
import { applyWoundWatermark } from "../lib/watermark";

interface ClinicalAssessmentFormProps {
  protocolNumber: string;
  patientName: string;
  onSave: (formData: any) => Promise<void>;
}

export const ClinicalAssessmentForm: React.FC<ClinicalAssessmentFormProps> = ({
  protocolNumber,
  patientName,
  onSave
}) => {
  // Otoskopi & Genel Bulgular
  const [otosocopyRight, setOtosocopyRight] = useState("Normal");
  const [otosocopyLeft, setOtosocopyLeft] = useState("Normal");
  const [lungAuscultation, setLungAuscultation] = useState("Normal");
  const [hasWheezing, setHasWheezing] = useState(false);

  // Nörovasküler & Ayak
  const [adpPulse, setAdpPulse] = useState("Normal");
  const [atpPulse, setAtpPulse] = useState("Normal");
  const [abiScore, setAbiScore] = useState<number>(1.0);
  const [hasLops, setHasLops] = useState(false); // Semmes-Weinstein kaybı
  const [tuningForkScore, setTuningForkScore] = useState<number>(8); // 128 Hz diyapozon skoru (0-8)
  const [footDeformity, setFootDeformity] = useState("None");

  // Yara Boyutları
  const [length, setLength] = useState<number>(0);
  const [width, setWidth] = useState<number>(0);
  const [depth, setDepth] = useState<number>(0);
  const [area, setArea] = useState<number>(0);

  // T.I.M.E. Doku Kompozisyonu (Toplamı %100 Olacak Şekilde Kontrollü)
  const [tissueGranulation, setTissueGranulation] = useState<number>(40); // Kırmızı
  const [tissueEpithelization, setTissueEpithelization] = useState<number>(20); // Pembe
  const [tissueSlough, setTissueSlough] = useState<number>(30); // Sarı
  const [tissueNecrosis, setTissueNecrosis] = useState<number>(10); // Siyah

  // Enfeksiyon Değerlendirme
  const [erythemaSizeMm, setErythemaSizeMm] = useState<number>(0);
  const [hasFoulOdor, setHasOdor] = useState(false);
  const [hasPurulentExudate, setHasPurulentExudate] = useState(false);
  const [isProbeToBone, setIsProbeToBone] = useState(false);
  const [hasSirs, setHasSirs] = useState(false);

  // Otomatik Skorlama Sonuçları
  const [wagnerGrade, setWagnerGrade] = useState<number>(0);
  const [sinbadScore, setSinbadScore] = useState<number>(0);
  const [iwgdfGrade, setIwgdfGrade] = useState<number>(1);
  const [iwgdfLabel, setIwgdfLabel] = useState<string>("");

  // Fotoğraf Entegrasyonu
  const [watermarkedImage, setWatermarkedImage] = useState<string | null>(null);
  const [isProcessingImg, setIsProcessingImg] = useState(false);

  // Alanı otomatik hesapla ($cm^2$)
  useEffect(() => {
    setArea(parseFloat((length * width).toFixed(2)));
  }, [length, width]);

  // Sliders toplama düzeltmesi
  const handleTissueChange = (type: "G" | "E" | "S" | "N", val: number) => {
    const currentSum = tissueGranulation + tissueEpithelization + tissueSlough + tissueNecrosis;
    let tempG = tissueGranulation;
    let tempE = tissueEpithelization;
    let tempS = tissueSlough;
    let tempN = tissueNecrosis;

    if (type === "G") tempG = val;
    else if (type === "E") tempE = val;
    else if (type === "S") tempS = val;
    else if (type === "N") tempN = val;

    const otherSum = (type !== "G" ? tempG : 0) + (type !== "E" ? tempE : 0) + (type !== "S" ? tempS : 0) + (type !== "N" ? tempN : 0);
    const remaining = 100 - val;

    if (otherSum > 0) {
      const ratio = remaining / otherSum;
      if (type !== "G") tempG = Math.round(tempG * ratio);
      if (type !== "E") tempE = Math.round(tempE * ratio);
      if (type !== "S") tempS = Math.round(tempS * ratio);
      if (type !== "N") tempN = Math.round(tempN * ratio);
    } else {
      const split = Math.round(remaining / 3);
      if (type !== "G") tempG = split;
      if (type !== "E") tempE = split;
      if (type !== "S") tempS = split;
      if (type !== "N") tempN = split;
    }

    // %100'e tam eşitleme garantisi
    const finalSum = tempG + tempE + tempS + tempN;
    if (finalSum !== 100) {
      const diff = 100 - finalSum;
      if (type !== "G") tempG += diff;
      else tempE += diff;
    }

    setTissueGranulation(tempG);
    setTissueEpithelization(tempE);
    setTissueSlough(tempS);
    setTissueNecrosis(tempN);
  };

  // Otomatik Skorları Güncelleme
  useEffect(() => {
    // SINBAD
    const sinbad = calculateSinbadScore({
      site: footDeformity !== "None",
      ischemia: abiScore < 0.9,
      neuropathy: hasLops,
      bacterialInfection: erythemaSizeMm > 0 || hasPurulentExudate,
      areaGreaterThan5cm2: area > 5,
      depthToCavityOrBone: depth > 0.5 || isProbeToBone
    });
    setSinbadScore(sinbad);

    // IWGDF
    const iwgdf = determineIwgdfGrade(
      erythemaSizeMm > 0 || hasPurulentExudate,
      erythemaSizeMm,
      depth > 0.5 || isProbeToBone,
      hasSirs
    );
    setIwgdfGrade(iwgdf.grade);
    setIwgdfLabel(iwgdf.label);

    // WAGNER
    const wagner = determineWagnerGrade(
      area > 0 && depth <= 0.2,
      depth > 0.2,
      isProbeToBone,
      footDeformity === "Charcot" && depth > 0.8,
      false
    );
    setWagnerGrade(wagner);
  }, [footDeformity, abiScore, hasLops, erythemaSizeMm, hasPurulentExudate, area, depth, isProbeToBone, hasSirs]);

  // Fotoğraf Yükleme ve Filigranlama
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingImg(true);
    try {
      const dateToday = new Date().toLocaleDateString("tr-TR");
      const watermarkedDataUrl = await applyWoundWatermark(file, protocolNumber, patientName, dateToday);
      setWatermarkedImage(watermarkedDataUrl);
    } catch (err) {
      alert("Fotoğraf işlenirken hata oluştu: " + err);
    } finally {
      setIsProcessingImg(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6 bg-slate-50/50 rounded-xl border space-y-6">
      <div className="bg-white p-6 rounded-lg border shadow-sm">
        <h2 className="text-xl font-bold text-slate-800">Sualtı ve Hiperbarik Hekimliği Objektif Klinik Muayene</h2>
        <p className="text-xs text-slate-500 mt-1">Hasta: {patientName} | Protokol No: {protocolNumber}</p>
      </div>

      {/* 1. Fizik Muayene Kartı */}
      <div className="bg-white p-6 rounded-lg border shadow-sm space-y-4">
        <h3 className="text-lg font-semibold text-slate-800 border-b pb-2">👂 KBB Otoskopisi & Akciğer Oskültasyonu</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Sağ Kulak Zarı (TM)</label>
            <select value={otosocopyRight} onChange={(e) => setOtosocopyRight(e.target.value)} className="w-full p-2 border rounded bg-white text-sm">
              <option value="Normal">Normal / İntakt</option>
              <option value="Hyperemic">Hiperemik</option>
              <option value="Perforated">Perfore</option>
              <option value="Fluid">Seröz Efüzyon / Sıvı</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Sol Kulak Zarı (TM)</label>
            <select value={otosocopyLeft} onChange={(e) => setOtosocopyLeft(e.target.value)} className="w-full p-2 border rounded bg-white text-sm">
              <option value="Normal">Normal / İntakt</option>
              <option value="Hyperemic">Hiperemik</option>
              <option value="Perforated">Perfore</option>
              <option value="Fluid">Seröz Efüzyon / Sıvı</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Akciğer Sesleri</label>
            <select value={lungAuscultation} onChange={(e) => setLungAuscultation(e.target.value)} className="w-full p-2 border rounded bg-white text-sm">
              <option value="Normal">Normal Veziküler Solunum</option>
              <option value="Ronchi">Ral / Ronküs Duyuluyor (Riskli)</option>
              <option value="Asymmetric">Asimetrik Akciğer Sesleri (Pnömotoraks Şüphesi)</option>
            </select>
          </div>
        </div>
      </div>

      {/* 2. Nörovasküler ve Diyabetik Ayak */}
      <div className="bg-white p-6 rounded-lg border shadow-sm space-y-4">
        <h3 className="text-lg font-semibold text-slate-800 border-b pb-2">🦶 Alt Ekstremite / Periferik Damar ve LOPS</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Arteria Dorsalis Pedis (ADP)</label>
            <select value={adpPulse} onChange={(e) => setAdpPulse(e.target.value)} className="w-full p-2 border rounded bg-white text-sm">
              <option value="Normal">Normal Palpe Ediliyor</option>
              <option value="Weak">Zayıf / Filiform</option>
              <option value="Absent">Alınamıyor (İskemi Şüphesi)</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Ankle-Brachial Index (ABI)</label>
            <input type="number" step="0.05" value={abiScore} onChange={(e) => setAbiScore(parseFloat(e.target.value))} className="w-full p-2 border rounded text-sm" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">128 Hz Diyapozon Skoru (0-8)</label>
            <input type="number" min="0" max="8" value={tuningForkScore} onChange={(e) => setTuningForkScore(parseInt(e.target.value))} className="w-full p-2 border rounded text-sm" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Biyomekanik Deformite</label>
            <select value={footDeformity} onChange={(e) => setFootDeformity(e.target.value)} className="w-full p-2 border rounded bg-white text-sm">
              <option value="None">Yok / Normal</option>
              <option value="Charcot">Charcot Eklemi</option>
              <option value="ClawToe">Pençe Parmak / Çekiç Parmak</option>
            </select>
          </div>
        </div>
        <div className="flex items-center space-x-2 pt-2">
          <input type="checkbox" checked={hasLops} onChange={(e) => setHasLops(e.target.checked)} className="rounded text-blue-600" />
          <span className="text-sm text-slate-600 font-semibold">10g Semmes-Weinstein Monofilaman Testinde Koruyucu His Kaybı (LOPS) Var</span>
        </div>
      </div>

      {/* 3. T.I.M.E.R.S. Yara Modülü */}
      <div className="bg-white p-6 rounded-lg border shadow-sm space-y-6">
        <h3 className="text-lg font-semibold text-slate-800 border-b pb-2">📐 TIMERS Yara Ölçüm ve Doku Analizi</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Uzunluk (cm)</label>
            <input type="number" step="0.1" value={length} onChange={(e) => setLength(parseFloat(e.target.value))} className="w-full p-2 border rounded text-sm" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Genişlik (cm)</label>
            <input type="number" step="0.1" value={width} onChange={(e) => setWidth(parseFloat(e.target.value))} className="w-full p-2 border rounded text-sm" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Derinlik (cm)</label>
            <input type="number" step="0.1" value={depth} onChange={(e) => setDepth(parseFloat(e.target.value))} className="w-full p-2 border rounded text-sm" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Hesaplanan Alan (cm²)</label>
            <input type="text" readOnly value={area} className="w-full p-2 border rounded bg-slate-100 text-sm font-bold text-slate-700" />
          </div>
        </div>

        {/* %100 Kilitli Slider Bölümü */}
        <div className="p-4 bg-slate-50 border rounded-lg space-y-4">
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">Doku Kompozisyonu Analizi (Toplam %100 olmalıdır)</h4>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-emerald-700">Granülasyon Dokusu (Kırmızı): %{tissueGranulation}</span>
              </div>
              <input type="range" value={tissueGranulation} onChange={(e) => handleTissueChange("G", parseInt(e.target.value))} className="w-full accent-emerald-600" />
            </div>
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-pink-600">Epitelizasyon Dokusu (Pembe): %{tissueEpithelization}</span>
              </div>
              <input type="range" value={tissueEpithelization} onChange={(e) => handleTissueChange("E", parseInt(e.target.value))} className="w-full accent-pink-500" />
            </div>
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-amber-600">Slough / Fibrin (Sarı): %{tissueSlough}</span>
              </div>
              <input type="range" value={tissueSlough} onChange={(e) => handleTissueChange("S", parseInt(e.target.value))} className="w-full accent-amber-500" />
            </div>
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-slate-800">Nekroz (Siyah): %{tissueNecrosis}</span>
              </div>
              <input type="range" value={tissueNecrosis} onChange={(e) => handleTissueChange("N", parseInt(e.target.value))} className="w-full accent-slate-900" />
            </div>
          </div>
        </div>
      </div>

      {/* 4. Otomatik Skorlama Sonuçları Paneli */}
      <div className="bg-white p-6 rounded-lg border shadow-sm grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-4 border-l-4 border-emerald-500 bg-emerald-50/20">
          <h4 className="text-xs font-bold text-emerald-800 uppercase">Wagner Evresi</h4>
          <p className="text-3xl font-extrabold text-emerald-950 mt-1">Evre {wagnerGrade}</p>
          <p className="text-xs text-slate-500 mt-1">Ayak yarası derinliği ve osteomiyelit bulgularına göre otomatik hesaplanmıştır.</p>
        </div>
        <div className="p-4 border-l-4 border-indigo-500 bg-indigo-50/20">
          <h4 className="text-xs font-bold text-indigo-800 uppercase">SINBAD Skoru</h4>
          <p className="text-3xl font-extrabold text-indigo-950 mt-1">{sinbadScore} / 6</p>
          <p className="text-xs text-slate-500 mt-1">Yerleşim, iskemi, nöropati, enfeksiyon, alan ve derinlik skorlarının toplamıdır.</p>
        </div>
        <div className="p-4 border-l-4 border-amber-500 bg-amber-50/20">
          <h4 className="text-xs font-bold text-amber-800 uppercase">IWGDF Enfeksiyon Derecesi</h4>
          <p className="text-xl font-bold text-amber-950 mt-1">{iwgdfLabel}</p>
          <p className="text-xs text-slate-500 mt-2">Eritem genişliği, fluktuasyon ve SIRS bulguları analiz edilmiştir.</p>
        </div>
      </div>

      {/* 5. Barkodlu Yara Fotoğrafı Entegrasyonu */}
      <div className="bg-white p-6 rounded-lg border shadow-sm space-y-4">
        <h3 className="text-lg font-semibold text-slate-800 border-b pb-2">📸 Barkodlu Yara Fotoğraf Kaydı</h3>
        <div className="flex flex-col md:flex-row gap-6 items-center">
          <div className="w-full md:w-1/2 space-y-3">
            <p className="text-sm text-slate-600">
              Kamera veya arşivden yara fotoğrafını sisteme yükleyin. Sistem, hastanın protokol numarası ve barkod çizgilerini içeren yasal güvenlik filigranını otomatik olarak basacaktır.
            </p>
            <input type="file" accept="image/*" capture="environment" onChange={handlePhotoUpload} className="w-full p-2 border rounded text-xs bg-slate-100" />
            {isProcessingImg && <p className="text-xs text-blue-600 animate-pulse font-semibold">Canvas filigranı işleniyor, lütfen bekleyin...</p>}
          </div>
          <div className="w-full md:w-1/2 flex justify-center border rounded-lg bg-slate-100 p-2 min-h-[200px] items-center">
            {watermarkedImage ? (
              <img src={watermarkedImage} alt="Filigranlı Yara" className="max-h-[300px] rounded shadow-md object-contain border" />
            ) : (
              <span className="text-xs text-slate-400">Fotoğraf yüklenmedi veya işlenmedi.</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

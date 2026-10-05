
import React, { useState } from "react";
import { runCdssEngine, CdssInputData } from "../lib/cdssEngine";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  AreaChart,
  Area,
  BarChart,
  Bar
} from "recharts";

// Örnek zaman serisi trend verileri (4 Haftalık Seans Takibi)
const initialTrendData = [
  { week: "1. Hafta", area: 12.4, targetArea: 12.4, hba1c: 8.4, crp: 45, compliance: 100 },
  { week: "2. Hafta", area: 9.1, targetArea: 9.3, hba1c: 7.9, crp: 28, compliance: 90 },
  { week: "3. Hafta", area: 6.8, targetArea: 7.0, hba1c: 7.2, crp: 12, compliance: 100 },
  { week: "4. Hafta", area: 4.2, targetArea: 6.2, hba1c: 6.5, crp: 4, compliance: 95 }
];

interface SoapCdssDashboardProps {
  patientName: string;
  protocolNumber: string;
  age: number;
  comorbidities: string[];
  complaint: string;
  initialCdssData: CdssInputData;
}

export const SoapCdssDashboard: React.FC<SoapCdssDashboardProps> = ({
  patientName,
  protocolNumber,
  age,
  comorbidities,
  complaint,
  initialCdssData
}) => {
  const [cdssParams, setCdssParams] = useState<CdssInputData>(initialCdssData);
  const [trendData] = useState(initialTrendData);
  const [activeTab, setActiveTab] = useState<"cdss" | "trends">("cdss");

  // Karar motorunu çalıştır
  const cdssResult = runCdssEngine(cdssParams);

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6 bg-slate-50 rounded-2xl border border-slate-200/80">
      
      {/* En Üst SOAP Hızlı Özet Paneli */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        
        {/* Subjective (S) */}
        <div className="bg-white p-4 rounded-xl border border-blue-100 shadow-sm">
          <div className="flex items-center space-x-2 text-blue-600 font-bold text-xs uppercase tracking-wider mb-2">
            <span>💬 Subjective (S)</span>
          </div>
          <div className="space-y-1.5 text-sm">
            <p><strong className="text-slate-700">Hasta:</strong> {patientName} ({age} Yaş)</p>
            <p><strong className="text-slate-700">Şikayet:</strong> {complaint}</p>
            <p className="text-xs text-slate-500"><strong>Komorbiditeler:</strong> {comorbidities.join(", ")}</p>
          </div>
        </div>

        {/* Objective (O) */}
        <div className="bg-white p-4 rounded-xl border border-emerald-100 shadow-sm">
          <div className="flex items-center space-x-2 text-emerald-600 font-bold text-xs uppercase tracking-wider mb-2">
            <span>🔍 Objective (O)</span>
          </div>
          <div className="space-y-1 text-sm">
            <p><strong className="text-slate-700">Yara Boyutu:</strong> {cdssParams.areaCm2} cm² (Derinlik: {cdssParams.depthCm} cm)</p>
            <p><strong className="text-slate-700">ABI Skoru:</strong> {cdssParams.abiScore}</p>
            <p><strong className="text-slate-700">Laboratuvar:</strong> CRP: {cdssParams.crpValue || "-"} mg/L, Sedim: {cdssParams.esrValue || "-"} mm/h</p>
          </div>
        </div>

        {/* Assessment (A) */}
        <div className="bg-white p-4 rounded-xl border border-purple-100 shadow-sm">
          <div className="flex items-center space-x-2 text-purple-600 font-bold text-xs uppercase tracking-wider mb-2">
            <span>🧠 Assessment (A)</span>
          </div>
          <div className="space-y-1 text-xs">
            <p className="flex justify-between">
              <strong className="text-slate-600">Ülser Tipi:</strong> 
              <span className="font-bold text-purple-700">{cdssResult.ulcerType}</span>
            </p>
            <p className="flex justify-between">
              <strong className="text-slate-600">Osteomiyelit Riski:</strong> 
              <span className={`font-bold ${cdssResult.osteomyelitisRisk === "Yüksek" ? "text-red-600" : "text-slate-700"}`}>
                {cdssResult.osteomyelitisRisk}
              </span>
            </p>
            <p className="flex justify-between">
              <strong className="text-slate-600">HBOT Güvenliği:</strong> 
              <span className={`font-bold ${cdssResult.hbotStatus === "MUTLAK_KONTRENDİKE" ? "text-red-600" : "text-emerald-600"}`}>
                {cdssResult.hbotStatus}
              </span>
            </p>
          </div>
        </div>

        {/* Plan (P) */}
        <div className="bg-white p-4 rounded-xl border border-amber-100 shadow-sm">
          <div className="flex items-center space-x-2 text-amber-600 font-bold text-xs uppercase tracking-wider mb-2">
            <span>📋 Plan (P)</span>
          </div>
          <div className="space-y-1 text-xs truncate">
            <p><strong>Off-loading:</strong> {cdssResult.recommendedPlan.offloading}</p>
            <p><strong>Debridman:</strong> {cdssResult.recommendedPlan.debridement}</p>
            <p><strong>HBOT:</strong> {cdssResult.recommendedPlan.hbotProtocol}</p>
          </div>
        </div>
      </div>

      {/* İnteraktif Tab Menü Seçiçi */}
      <div className="flex space-x-2 border-b pb-1">
        <button
          onClick={() => setActiveTab("cdss")}
          className={`px-4 py-2 text-sm font-semibold rounded-t-lg transition ${activeTab === "cdss" ? "bg-white text-blue-600 border-t border-x" : "text-slate-600 hover:text-slate-800"}`}
        >
          🤖 Karar Destek Karar Motoru (CDSS)
        </button>
        <button
          onClick={() => setActiveTab("trends")}
          className={`px-4 py-2 text-sm font-semibold rounded-t-lg transition ${activeTab === "trends" ? "bg-white text-blue-600 border-t border-x" : "text-slate-600 hover:text-slate-800"}`}
        >
          📊 Klinik Trend Grafikleri
        </button>
      </div>

      {/* SEKME 1: Karar Destek Motoru İnteraktif Paneli */}
      {activeTab === "cdss" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* CDSS Parametre Düzenleyici Form Alanı */}
          <div className="bg-white p-6 rounded-xl border space-y-4 shadow-sm">
            <h3 className="text-md font-bold text-slate-800 border-b pb-2">🔬 Parametre Düzenleyici (Simülasyon)</h3>
            
            <div className="space-y-3 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Ankle-Brachial Index (ABI)</label>
                <input
                  type="number"
                  step="0.05"
                  value={cdssParams.abiScore}
                  onChange={(e) => setCdssParams({ ...cdssParams, abiScore: parseFloat(e.target.value) })}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Sedimantasyon (ESR mm/h)</label>
                <input
                  type="number"
                  value={cdssParams.esrValue || ""}
                  onChange={(e) => setCdssParams({ ...cdssParams, esrValue: parseInt(e.target.value) })}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  checked={cdssParams.isProbeToBone}
                  onChange={(e) => setCdssParams({ ...cdssParams, isProbeToBone: e.target.checked })}
                  className="rounded text-blue-600"
                />
                <span className="text-xs text-slate-600 font-semibold">Yarada Kemik Teması Pozitif</span>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={cdssParams.hasPneumothorax}
                  onChange={(e) => setCdssParams({ ...cdssParams, hasPneumothorax: e.target.checked })}
                  className="rounded text-red-600"
                />
                <span className="text-xs text-red-700 font-bold">Aktif Pnömotoraks Var</span>
              </div>
            </div>
          </div>

          {/* Karar Destek Çıktı Ekranı */}
          <div className="lg:col-span-2 space-y-4">
            
            {/* CDSS Uyarı Barları */}
            {cdssResult.hbotWarnings.length > 0 && (
              <div className="p-4 bg-rose-50 border-l-4 border-rose-600 text-rose-800 rounded-r-lg space-y-1 shadow-sm">
                <h4 className="font-bold text-sm">⚠️ CDSS Klinik Güvenlik Blokajı / Uyarılar</h4>
                <ul className="list-disc list-inside text-xs space-y-1">
                  {cdssResult.hbotWarnings.map((warn, index) => (
                    <li key={index}>{warn}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* SUT ve Mevzuat Bilgisi */} 
            <div className="bg-white p-6 rounded-xl border shadow-sm space-y-3">
              <div className="flex justify-between items-center border-b pb-2">
                <h4 className="font-bold text-slate-800 text-sm">📜 Sağlık Uygulama Tebliği (SUT) Uyumluluk Doğrulaması</h4>
                <span className="px-2.5 py-1 bg-blue-100 text-blue-800 font-mono text-xs rounded font-bold">
                  ICD/SUT Kodu: {cdssResult.sutQuotaCode}
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">{cdssResult.sutQuotaDetails}</p>
            </div>

            {/* Detaylı Algoritmik Tedavi Planı Önerisi */}
            <div className="bg-white p-6 rounded-xl border shadow-sm space-y-4">
              <h4 className="font-bold text-slate-800 text-sm border-b pb-2">🔬 Algoritmik Yara Bakım ve HBOT Protokolü</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-3 bg-slate-50 rounded-lg">
                  <span className="font-bold text-slate-600 block mb-1">Yük Dağıtma (Off-loading) Önerisi:</span>
                  <p className="text-slate-800">{cdssResult.recommendedPlan.offloading}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <span className="font-bold text-slate-600 block mb-1">Debridman ve Pansuman Stratejisi:</span>
                  <p className="text-slate-800">{cdssResult.recommendedPlan.debridement}</p>
                  <p className="text-slate-800 mt-1 font-semibold">{cdssResult.recommendedPlan.dressing}</p>
                </div>
                <div className="p-3 bg-blue-50/50 rounded-lg md:col-span-2">
                  <span className="font-bold text-blue-800 block mb-1">Önerilen HBOT Protokolü:</span>
                  <p className="text-blue-950 font-medium">{cdssResult.recommendedPlan.hbotProtocol}</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* SEKME 2: Klinik Trend Grafikleri */} 
      {activeTab === "trends" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Grafik A: Yara Alanı Küçülme Trendi ve Klinik Hedef Çizgisi */}
          <div className="bg-white p-6 rounded-xl border shadow-sm space-y-2">
            <h3 className="text-sm font-bold text-slate-800">📐 Yara Alanı Değişimi Zaman Serisi (cm²)</h3>
            <p className="text-xs text-slate-500">Kesikli kırmızı çizgi, 4 haftada %50 klinik küçülme eşiğini (hedefi) göstermektedir.</p>
            <div className="h-72 w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="week" stroke="#94a3b8" fontSize={12} />
                  <YAxis stroke="#94a3b8" fontSize={12} />
                  <Tooltip />
                  <Legend fontSize={12} />
                  <Line type="monotone" dataKey="area" stroke="#0f766e" strokeWidth={3} name="Ölçülen Alan (cm²)" />
                  <Line type="monotone" dataKey="targetArea" stroke="#ef4444" strokeDasharray="5 5" strokeWidth={2} name="Hedef Alan (cm²)" />
                  <ReferenceLine y={6.2} stroke="#f59e0b" strokeDasharray="3 3" label={{ value: 'Kritik Sınır', position: 'top', fill: '#d97706', fontSize: 10 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Grafik B: İnflamasyon ve Metabolik Göstergeler (HbA1c & CRP) */}
          <div className="bg-white p-6 rounded-xl border shadow-sm space-y-2">
            <h3 className="text-sm font-bold text-slate-800">🩸 HbA1c ve CRP İnflamasyon Seviyeleri</h3>
            <p className="text-xs text-slate-500">HBOT ve yara bakımı süresince metabolik kontrol ve enfeksiyon azalış trendi.</p>
            <div className="h-72 w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="colorCrp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="week" stroke="#94a3b8" fontSize={12} />
                  <YAxis stroke="#94a3b8" fontSize={12} />
                  <Tooltip />
                  <Legend fontSize={12} />
                  <Area type="monotone" dataKey="crp" stroke="#6366f1" fillOpacity={1} fill="url(#colorCrp)" name="CRP (mg/L)" />
                  <Line type="monotone" dataKey="hba1c" stroke="#e11d48" strokeWidth={2.5} name="HbA1c (%)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Grafik C: Seans Katılım & Tedavi Uyumluluk Yüzdesi */}
          <div className="bg-white p-6 rounded-xl border shadow-sm space-y-2 lg:col-span-2">
            <h3 className="text-sm font-bold text-slate-800">🗓️ HBOT Seans Katılım ve Tedavi Uyum Oranı (%)</h3>
            <p className="text-xs text-slate-500">Hastanın planlanan seanslara devamlılık ve uyum grafiği.</p>
            <div className="h-56 w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="week" stroke="#94a3b8" fontSize={12} />
                  <YAxis stroke="#94a3b8" fontSize={12} domain={[0, 100]} />
                  <Tooltip />
                  <Bar dataKey="compliance" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} name="Uyum Yüzdesi (%)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>
      )}

    </div>
  );
};

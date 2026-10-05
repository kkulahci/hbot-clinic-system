
import React, { useState } from "react";

export interface FormFieldSchema {
  id: string;
  label: string;
  type: "text" | "number" | "select" | "vas_scale" | "audiogram";
  required: boolean;
  options?: string[]; // select için seçenekler
  placeholder?: string;
  minVal?: number;
  maxVal?: number;
}

export interface DynamicCrfSchema {
  id: string;
  formName: string;
  triggerRule: "PRE_HBOT" | "POST_10_SEANS" | "POST_30_DAYS";
  inclusionCriteria: {
    minAge?: number;
    maxAge?: number;
    allowedIndications?: string[];
  };
  fields: FormFieldSchema[];
}

interface DynamicCrfRendererProps {
  schema: DynamicCrfSchema;
  onSubmitResponse: (formData: Record<string, any>) => Promise<void>;
  userRole: "PATIENT" | "NURSE" | "DOCTOR" | "ADMIN";
}

export const DynamicCrfRenderer: React.FC<DynamicCrfRendererProps> = ({
  schema,
  onSubmitResponse,
  userRole
}) => {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Odyogram frekans tanımları
  const frequencies = [250, 500, 1000, 2000, 4000, 8000];

  const handleInputChange = (fieldId: string, val: any) => {
    setFormData((prev) => ({ ...prev, [fieldId]: val }));
  };

  const handleAudiogramChange = (fieldId: string, ear: "left" | "right", freq: number, val: number) => {
    const currentAudiogram = formData[fieldId] || { left: {}, right: {} };
    const updatedEarData = { ...currentAudiogram[ear], [freq]: val };
    const updatedAudiogram = { ...currentAudiogram, [ear]: updatedEarData };
    handleInputChange(fieldId, updatedAudiogram);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    
    // Temel validasyon kontrolü
    for (const field of schema.fields) {
      if (field.required && (formData[field.id] === undefined || formData[field.id] === "")) {
        setErrorMsg(`Lütfen gerekli alanı doldurunuz: ${field.label}`);
        return;
      }
    }

    setIsSubmitting(true);
    try {
      await onSubmitResponse(formData);
      alert("Bilimsel araştırma verileri başarıyla kaydedildi!");
    } catch (err: any) {
      setErrorMsg(err?.message || "Veriler gönderilirken bir hata oluştu.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded-2xl border border-slate-200/80 shadow-sm space-y-6">
      
      {/* Çalışma Başlığı ve Bilgilendirme */}
      <div className="border-b pb-4">
        <div className="flex justify-between items-center">
          <span className="px-2.5 py-1 bg-indigo-100 text-indigo-800 rounded text-xs font-bold uppercase tracking-wider">
            🧪 Aktif Bilimsel Çalışma
          </span>
          <span className="text-xs text-slate-500 font-mono">
            Tetikleme Kuralı: {schema.triggerRule}
          </span>
        </div>
        <h2 className="text-xl font-bold text-slate-800 mt-2">{schema.formName}</h2>
        <p className="text-xs text-slate-500 mt-1">
          Sistem kriterleri doğrultusunda bu formun doldurulması zorunludur. Rol yetkiniz: <strong className="text-slate-700">{userRole}</strong>
        </p>
      </div>

      {errorMsg && (
        <div className="p-3 bg-rose-50 border-l-4 border-rose-500 text-rose-800 text-xs rounded-r">
          {errorMsg}
        </div>
      )}

      {/* Dinamik Form Alanları */}
      <form onSubmit={handleFormSubmit} className="space-y-6">
        {schema.fields.map((field) => {
          return (
            <div key={field.id} className="space-y-2">
              <label className="block text-sm font-bold text-slate-700">
                {field.label} {field.required && <span className="text-red-500">*</span>}
              </label>

              {/* 1. Normal Metin Alanı */}
              {field.type === "text" && (
                <input
                  type="text"
                  placeholder={field.placeholder || "Yanıtınızı buraya yazınız..."}
                  value={formData[field.id] || ""}
                  onChange={(e) => handleInputChange(field.id, e.target.value)}
                  className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
                />
              )}

              {/* 2. Sayısal Alan */}
              {field.type === "number" && (
                <input
                  type="number"
                  min={field.minVal}
                  max={field.maxVal}
                  placeholder={field.placeholder || "Değer giriniz"}
                  value={formData[field.id] || ""}
                  onChange={(e) => handleInputChange(field.id, parseFloat(e.target.value))}
                  className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
                />
              )}

              {/* 3. Çoktan Seçmeli Açılır Liste */}
              {field.type === "select" && (
                <select
                  value={formData[field.id] || ""}
                  onChange={(e) => handleInputChange(field.id, e.target.value)}
                  className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm bg-white"
                >
                  <option value="">-- Seçiniz --</option>
                  {field.options?.map((opt, i) => (
                    <option key={i} value={opt}>{opt}</option>
                  ))}
                </select>
              )}

              {/* 4. Görsel Analog Skala (VAS Ağrı Skalası) */}
              {field.type === "vas_scale" && (
                <div className="p-4 bg-slate-50 border rounded-lg space-y-2">
                  <div className="flex justify-between text-xs font-semibold text-slate-600">
                    <span>0 (Hiç Ağrı Yok)</span>
                    <span className="text-indigo-600 font-bold">Mevcut Seçim: {formData[field.id] ?? "Belirtilmedi"}</span>
                    <span>10 (Dayanılmaz Ağrı)</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    step="1"
                    value={formData[field.id] ?? 5}
                    onChange={(e) => handleInputChange(field.id, parseInt(e.target.value))}
                    className="w-full accent-indigo-600"
                  />
                </div>
              )}

              {/* 5. Kompleks Odyogram Modülü (Ani İşitme Kaybı Çalışmaları İçin) */}
              {field.type === "audiogram" && (
                <div className="p-4 bg-slate-50 border rounded-lg space-y-4">
                  <span className="text-xs font-bold text-slate-600 uppercase tracking-wider block">Hava Yolu İşitme Eşikleri (dB) Girişi</span>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Sağ Kulak */}
                    <div className="bg-white p-3 rounded border border-red-100 space-y-2">
                      <span className="text-xs font-bold text-red-600 block border-b pb-1">🔴 SAĞ KULAK (OD)</span>
                      {frequencies.map((freq) => (
                        <div key={freq} className="flex justify-between items-center text-xs">
                          <span>{freq} Hz:</span>
                          <input
                            type="number"
                            min="0"
                            max="120"
                            placeholder="dB"
                            value={formData[field.id]?.right?.[freq] ?? ""}
                            onChange={(e) => handleAudiogramChange(field.id, "right", freq, parseInt(e.target.value))}
                            className="w-20 p-1 border rounded text-right"
                          />
                        </div>
                      ))}
                    </div>
                    
                    {/* Sol Kulak */}
                    <div className="bg-white p-3 rounded border border-blue-100 space-y-2">
                      <span className="text-xs font-bold text-blue-600 block border-b pb-1">🔵 SOL KULAK (OS)</span>
                      {frequencies.map((freq) => (
                        <div key={freq} className="flex justify-between items-center text-xs">
                          <span>{freq} Hz:</span>
                          <input
                            type="number"
                            min="0"
                            max="120"
                            placeholder="dB"
                            value={formData[field.id]?.left?.[freq] ?? ""}
                            onChange={(e) => handleAudiogramChange(field.id, "left", freq, parseInt(e.target.value))}
                            className="w-20 p-1 border rounded text-right"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        <div className="flex justify-end pt-4 border-t">
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 rounded-lg text-white font-semibold text-sm shadow-md transition"
          >
            {isSubmitting ? "Kaydediliyor..." : "Araştırma Cevabını Gönder"}
          </button>
        </div>
      </form>
    </div>
  );
};

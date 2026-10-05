
import React, { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AnamnesisSchema, AnamnesisFormValues } from "@/types/anamnesis";

interface AnamnesisFormProps {
  initialData?: Partial<AnamnesisFormValues>;
  userRole: "PATIENT" | "NURSE" | "DOCTOR" | "ADMIN";
  onSubmit: (data: AnamnesisFormValues) => Promise<void>;
}

export const AnamnesisForm: React.FC<AnamnesisFormProps> = ({
  initialData,
  userRole,
  onSubmit
}) => {
  const [step, setStep] = useState(1);

  const {
    register,
    handleSubmit,
    watch,
    control,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm<AnamnesisFormValues>({
    resolver: zodResolver(AnamnesisSchema),
    defaultValues: {
      workflowStatus: "DRAFT_PATIENT",
      medications: [],
      ...initialData
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "medications"
  });

  // Dinamik Tetikleyiciler
  const watchHasDiabetes = watch("hasDiabetes");
  const watchVisitReason = watch("visitReason");
  
  // Kırmızı Bayraklar (Mutlak / Göreceli Kontrendikasyon İzleme)
  const watchPneumothorax = watch("hasPneumothorax");
  const watchBleomycin = watch("hasBleomycinHistory");
  const watchEpilepsy = watch("hasActiveEpilepsy");
  const watchHeartFailure = watch("hasSevereHeartFailure");
  const watchClaustrophobia = watch("hasClaustrophobia");

  const hasAnyRedFlag = watchPneumothorax || watchBleomycin || watchEpilepsy || watchHeartFailure || watchClaustrophobia;

  // Rol kısıtlamaları
  const isPatient = userRole === "PATIENT";
  const isNurse = userRole === "NURSE";
  const isDoctor = userRole === "DOCTOR" || userRole === "ADMIN";

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-xl shadow-lg border border-slate-100">
      
      {/* Kırmızı Bayrak Alert Barı */}
      {hasAnyRedFlag && (
        <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-md text-red-800 animate-pulse">
          <h4 className="font-bold text-md flex items-center">
            ⚠️ KRİTİK GÜVENLİK UYARISI / RED FLAGS
          </h4>
          <p className="text-sm mt-1">
            Hastada HBOT için risk teşkil edebilecek mutlak veya göreceli kontrendikasyon durumu tespit edilmiştir:
            {watchPneumothorax && " [Aktif/Geçirilmiş Pnömotoraks]"}
            {watchBleomycin && " [Bleomisin Kemoterapi Geçmişi]"}
            {watchEpilepsy && " [Aktif/Kontrolsüz Epilepsi]"}
            {watchHeartFailure && " [İleri Derece Kalp Yetmezliği]"}
            {watchClaustrophobia && " [İleri Derece Klostrofobi]"}
          </p>
          <p className="text-xs mt-1 font-semibold text-red-600">
            * Hekim onayı ve detaylı klinik değerlendirme şarttır.
          </p>
        </div>
      )}

      {/* Başlık ve Durum Göstergesi */}
      <div className="flex justify-between items-center border-b pb-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Hasta Kabul ve Anamnez Formu</h2>
          <p className="text-sm text-slate-500">Sualtı ve Hiperbarik Tıp Klinik Değerlendirme Takibi</p>
        </div>
        <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">
          Rol: {userRole}
        </span>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        
        {/* Adım 1: Temel Şikayet ve Başvuru Nedeni */}
        {step === 1 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-700">Adım 1: Başvuru ve Şikayet Bilgileri</h3>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Başvuru Nedeni</label>
              <select
                {...register("visitReason")}
                className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="">-- Seçiniz --</option>
                <option value="SUT_DIABETIC_FOOT">Diyabetik Ayak Yarası (SUT Endikasyonu)</option>
                <option value="SUT_OSTEOMYELITIS">Kronik Refrakter Osteomiyelit (SUT Endikasyonu)</option>
                <option value="SUT_CARBON_MONOXIDE">Karbonmonoksit Zehirlenmesi (SUT Endikasyonu)</option>
                <option value="SUT_SUDDEN_DEAFNESS">Ani İşitme Kaybı (SUT Endikasyonu)</option>
                <option value="WELLNESS">Zindelik, Anti-aging veya Atletik Performans (Wellness)</option>
                <option value="DIVING_ACCIDENT">Dekompresyon Hastalığı / Dalış Kazası</option>
                <option value="SUT_OTHER">Diğer SUT Dışı / SUT Endikasyonlu Durumlar</option>
              </select>
              {errors.visitReason && <p className="text-xs text-red-500 mt-1">{errors.visitReason.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Şikayetiniz Nedir? (Tıbbi jargon kullanmadan kısaca yazınız)
              </label>
              <textarea
                {...register("complaintDescription")}
                className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 h-28"
                placeholder="Örn: Sağ ayağımın altında 2 aydır geçmeyen yara var, son 1 haftadır akıntısı arttı."
              />
              {errors.complaintDescription && <p className="text-xs text-red-500 mt-1">{errors.complaintDescription.message}</p>}
            </div>

            {/* Sağlık Güvenlik Kontrolleri (Hasta Girişi Sırasında Basitleştirilmiş) */}
            <div className="p-4 bg-slate-50 rounded-lg space-y-3">
              <h4 className="font-semibold text-sm text-slate-700">Önemli Sağlık Durumları (Mutlak Kontrendikasyon Taraması)</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <label className="flex items-center space-x-2 text-sm text-slate-600">
                  <input type="checkbox" {...register("hasPneumothorax")} className="rounded text-blue-600" />
                  <span>Akciğer Sönmesi (Pnömotoraks) geçmişim var.</span>
                </label>
                
                <label className="flex items-center space-x-2 text-sm text-slate-600">
                  <input type="checkbox" {...register("hasBleomycinHistory")} className="rounded text-blue-600" />
                  <span>Kanser tedavisi (Bleomisin) gördüm/görüyorum.</span>
                </label>

                <label className="flex items-center space-x-2 text-sm text-slate-600">
                  <input type="checkbox" {...register("hasActiveEpilepsy")} className="rounded text-blue-600" />
                  <span>Sara nöbeti (Epilepsi) geçmişim var.</span>
                </label>

                <label className="flex items-center space-x-2 text-sm text-slate-600">
                  <input type="checkbox" {...register("hasSevereHeartFailure")} className="rounded text-blue-600" />
                  <span>Ağır Kalp Yetmezliği tanım var.</span>
                </label>

                <label className="flex items-center space-x-2 text-sm text-slate-600">
                  <input type="checkbox" {...register("hasClaustrophobia")} className="rounded text-blue-600" />
                  <span>Kapalı alan korkum (Klostrofobi) var.</span>
                </label>
              </div>
            </div>

            {/* Diyabet Tetikleyicisi */}
            <div className="flex items-center space-x-2 p-3 bg-blue-50/50 rounded-lg">
              <input type="checkbox" {...register("hasDiabetes")} id="hasDiabetes" className="rounded text-blue-600" />
              <label htmlFor="hasDiabetes" className="text-sm font-medium text-slate-700">
                Şeker Hastalığı (Diyabet) teşhisim var.
              </label>
            </div>
          </div>
        )}

        {/* Adım 2: Adaptif ve Koşullu Dinamik Bölümler */}
        {step === 2 && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-slate-700">Adım 2: Duruma Özel Tıbbi Detaylar</h3>

            {/* Koşul A: Diyabetik Ayak Tarama Formu (IWGDF) */}
            {watchHasDiabetes && (
              <div className="p-4 border border-amber-200 bg-amber-50/20 rounded-lg space-y-4">
                <h4 className="font-bold text-sm text-amber-800 flex items-center">👣 IWGDF Diyabetik Ayak Ön Tarama Soruları</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label className="flex items-center space-x-2 text-sm">
                    <input type="checkbox" {...register("iwgdfScreening.hasFootUlcerHistory")} />
                    <span>Daha önce ayak yarası geçirdiniz mi?</span>
                  </label>
                  <label className="flex items-center space-x-2 text-sm">
                    <input type="checkbox" {...register("iwgdfScreening.hasAmputationHistory")} />
                    <span>Ayak/Bacak amputasyon geçmişiniz var mı?</span>
                  </label>
                  <label className="flex items-center space-x-2 text-sm">
                    <input type="checkbox" {...register("iwgdfScreening.lossOfProtectiveSensation")} />
                    <span>Ayaklarınızda hissizlik veya karıncalanma var mı?</span>
                  </label>
                  <label className="flex items-center space-x-2 text-sm">
                    <input type="checkbox" {...register("iwgdfScreening.footDeformity")} />
                    <span>Ayak yapısında şekil bozukluğu var mı?</span>
                  </label>
                </div>
              </div>
            )}

            {/* Koşul B: Dalış Kazası Detayları */}
            {watchVisitReason === "DIVING_ACCIDENT" && (
              <div className="p-4 border border-sky-200 bg-sky-50/20 rounded-lg space-y-4">
                <h4 className="font-bold text-sm text-sky-800">🤿 Dalış Profili ve Semptom Detayları</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Maksimum Derinlik (Metre)</label>
                    <input type="number" {...register("divingDetails.maxDepthMeters", { valueAsNumber: true })} className="p-2 border rounded w-full" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Gaz Karışımı (Örn: Hava, Nitrox, Trimix)</label>
                    <input type="text" {...register("divingDetails.gasType")} className="p-2 border rounded w-full" />
                  </div>
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" {...register("divingDetails.decompressionViolation")} />
                    <span className="text-sm">Dekompresyon (Deko) İhlali Var mı?</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" {...register("divingDetails.onSiteOxygenGiven")} />
                    <span className="text-sm">Olay yerinde Oksijen desteği verildi mi?</span>
                  </div>
                </div>
              </div>
            )}

            {/* Koşul C: Wellness / Anti-Aging Uyarı Penceresi ve Puanlama */}
            {watchVisitReason === "WELLNESS" && (
              <div className="p-4 border border-purple-200 bg-purple-50/20 rounded-lg space-y-4">
                <h4 className="font-bold text-sm text-purple-800">✨ Zindelik ve Hücresel Yenilenme Beklentileri</h4>
                <div className="p-3 bg-purple-100 text-purple-950 text-xs rounded-md">
                  <strong>Bilgilendirme:</strong> HBOT anti-aging ve sporcu toparlanması için SUT kapsamında olmayan, kliniklerce onaylanan bir Wellness desteğidir.
                </div>
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-600">Tedaviden beklenti düzeyiniz nedir? (1-10)</label>
                  <input type="range" min="1" max="10" {...register("wellnessExpectations.expectationScore", { valueAsNumber: true })} className="w-full" />
                </div>
              </div>
            )}

            {/* Aktif / Sürekli İlaç Giriş Tablosu */}
            <div className="space-y-3">
              <h4 className="font-bold text-sm text-slate-700">Kullandığınız İlaçlar</h4>
              {fields.map((field, index) => (
                <div key={field.id} className="grid grid-cols-1 md:grid-cols-4 gap-2 items-center bg-slate-50 p-2 rounded">
                  <input {...register(`medications.${index}.name` as const)} placeholder="İlaç Adı" className="p-2 border rounded text-sm" />
                  <input {...register(`medications.${index}.dosage` as const)} placeholder="Doz (Örn: 500mg)" className="p-2 border rounded text-sm" />
                  <input {...register(`medications.${index}.frequency` as const)} placeholder="Sıklık (Örn: 1x1)" className="p-2 border rounded text-sm" />
                  <button type="button" onClick={() => remove(index)} className="text-red-500 hover:text-red-700 text-xs text-left md:text-center">
                    Sil
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => append({ name: "", dosage: "", frequency: "", isTemporary: false })}
                className="text-xs bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded border"
              >
                + Yeni İlaç Ekle
              </button>
            </div>
          </div>
        )}

        {/* Adım 3: Triyaj ve Vital Bulgular (Yalnızca Hemşire ve Hekim Tarafından Düzenlenebilir) */}
        {step === 3 && (isNurse || isDoctor) && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-700">Adım 3: Triyaj & Vital Bulgular (Klinik Giriş)</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Sistolik TA (mmHg)</label>
                <input type="number" {...register("vitals.systolicBP", { valueAsNumber: true })} className="p-2 border rounded w-full" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Diyastolik TA (mmHg)</label>
                <input type="number" {...register("vitals.diastolicBP", { valueAsNumber: true })} className="p-2 border rounded w-full" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Nabız (Dk)</label>
                <input type="number" {...register("vitals.pulse", { valueAsNumber: true })} className="p-2 border rounded w-full" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Kan Şekeri (mg/dL)</label>
                <input type="number" {...register("vitals.glucose", { valueAsNumber: true })} className="p-2 border rounded w-full" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Vücut Ateşi (°C)</label>
                <input type="number" step="0.1" {...register("vitals.temperature", { valueAsNumber: true })} className="p-2 border rounded w-full" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">SpO2 (%)</label>
                <input type="number" {...register("vitals.spo2", { valueAsNumber: true })} className="p-2 border rounded w-full" />
              </div>
            </div>

            <div className="p-3 bg-sky-50 rounded-lg">
              <label className="flex items-center space-x-2 text-sm text-sky-800 font-semibold">
                <input type="checkbox" {...register("vitals.earValsalvaTest")} />
                <span>Kulak Eşitleme / Valsalva Manevrası Başarılı</span>
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">İş Akışı Durum Güncellemesi</label>
              <select
                {...register("workflowStatus")}
                className="w-full p-2 border rounded-lg bg-white"
              >
                <option value="DRAFT_PATIENT">DRAFT_PATIENT (Taslak - Hasta)</option>
                <option value="TRIAGED">TRIAGED (Triyajlandı - Hemşire Onaylı)</option>
                {isDoctor && <option value="LOCKED">LOCKED (Kilitli/Onaylandı - Hekim)</option>}
              </select>
            </div>
          </div>
        )}

        {/* Gezinme ve Gönderim Butonları */}
        <div className="flex justify-between border-t pt-4 mt-6">
          {step > 1 && (
            <button type="button" onClick={() => setStep(step - 1)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded text-slate-700 text-sm">
              Geri
            </button>
          )}
          
          {step < 3 && (step !== 2 || isNurse || isDoctor) && (
            <button type="button" onClick={() => setStep(step + 1)} className="ml-auto px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white text-sm">
              İleri
            </button>
          )}

          {(step === 2 && isPatient) || (step === 3 && (isNurse || isDoctor)) ? (
            <button
              type="submit"
              disabled={isSubmitting}
              className="ml-auto px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 rounded-lg text-white font-semibold text-sm shadow-md"
            >
              {isSubmitting ? "Kaydediliyor..." : "Kaydet ve Tamamla"}
            </button>
          ) : null}
        </div>
      </form>
    </div>
  );
};

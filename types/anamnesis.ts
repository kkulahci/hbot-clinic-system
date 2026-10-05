
import { z } from "zod";

export const MedicationSchema = z.object({
  name: z.string().min(1, "İlaç adı boş bırakılamaz"),
  dosage: z.string().min(1, "Doz belirtilmelidir"),
  frequency: z.string().min(1, "Sıklık belirtilmelidir"),
  startDate: z.string().optional(),
  isTemporary: z.boolean().default(false),
});

export const AnamnesisSchema = z.object({
  // Genel Başvuru Bilgileri
  visitReason: z.enum([
    "SUT_DIABETIC_FOOT",
    "SUT_OSTEOMYELITIS",
    "SUT_CARBON_MONOXIDE",
    "SUT_SUDDEN_DEAFNESS",
    "SUT_OTHER",
    "WELLNESS",
    "DIVING_ACCIDENT"
  ], { required_error: "Lütfen başvuru nedenini seçiniz" }),
  
  complaintDescription: z.string().min(10, "Lütfen şikayetinizi detaylıca açıklayınız (en az 10 karakter)."),

  // Kırmızı Bayraklar (Mutlak / Göreceli Kontrendikasyonlar)
  hasPneumothorax: z.boolean().default(false),
  hasBleomycinHistory: z.boolean().default(false),
  hasActiveEpilepsy: z.boolean().default(false),
  hasSevereHeartFailure: z.boolean().default(false),
  hasClaustrophobia: z.boolean().default(false),

  // Diyabet ve Tetiklenen IWGDF Soruları
  hasDiabetes: z.boolean().default(false),
  iwgdfScreening: z.object({
    hasFootUlcerHistory: z.boolean().default(false),
    hasAmputationHistory: z.boolean().default(false),
    lossOfProtectiveSensation: z.boolean().default(false),
    peripheralArterialDisease: z.boolean().default(false),
    footDeformity: z.boolean().default(false),
  }).optional(),

  // Dalış Kazası Detayları
  divingDetails: z.object({
    maxDepthMeters: z.number().nonnegative().optional(),
    gasType: z.string().optional(),
    decompressionViolation: z.boolean().default(false),
    onSiteOxygenGiven: z.boolean().default(false),
    symptomsOnsetMinutes: z.number().nonnegative().optional(),
  }).optional(),

  // Wellness/Performans Beklentileri
  wellnessExpectations: z.object({
    antiAgingFocus: z.boolean().default(false),
    cognitiveEnhancement: z.boolean().default(false),
    athleticRecovery: z.boolean().default(false),
    expectationScore: z.number().min(1).max(10).default(5),
  }).optional(),

  // İlaçlar
  medications: z.array(MedicationSchema).default([]),

  // Hemşire Triyaj / Vital Bulgular (Hemşire ve Üstü Roller için)
  vitals: z.object({
    systolicBP: z.number().nonnegative().optional(),
    diastolicBP: z.number().nonnegative().optional(),
    pulse: z.number().nonnegative().optional(),
    glucose: z.number().nonnegative().optional(),
    temperature: z.number().nonnegative().optional(),
    spo2: z.number().min(0).max(100).optional(),
    earValsalvaTest: z.boolean().default(true),
  }).optional(),

  // İş Akışı Durumu
  workflowStatus: z.enum(["DRAFT_PATIENT", "TRIAGED", "LOCKED"]).default("DRAFT_PATIENT"),
});

export type AnamnesisFormValues = z.infer<typeof AnamnesisSchema>;

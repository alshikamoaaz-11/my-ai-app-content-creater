export type CategoryOption = {
  value: string;
  label: string;
  templateHint: string;
};

export const CATEGORIES: CategoryOption[] = [
  {
    value: "cashback_rewards",
    label: "استرداد نقدي / مكافآت",
    templateHint: "القالب رقم 1 (عرض استرداد نقدي / مكافآت)",
  },
  {
    value: "bare_partner_card",
    label: "بطاقة شريك مختصرة",
    templateHint: "القالب رقم 2 (بطاقة شريك مختصرة، سطر واحد فقط)",
  },
  {
    value: "app_download_account",
    label: "تحميل التطبيق / فتح حساب",
    templateHint: "القالب رقم 3 (تحميل التطبيق / فتح حساب)",
  },
  {
    value: "holiday_greeting",
    label: "تهنئة بمناسبة",
    templateHint: "القالب رقم 4 (تهنئة بمناسبة)",
  },
  {
    value: "prize_sweepstakes",
    label: "مسابقة / سحب على جوائز",
    templateHint: "القالب رقم 5 (مسابقة / سحب على جوائز)",
  },
  {
    value: "banking_tip_security",
    label: "نصيحة مصرفية / تحذير أمني",
    templateHint: "القالب رقم 6 (نصيحة مصرفية / تحذير أمني)",
  },
  {
    value: "engagement_poll",
    label: "استطلاع رأي",
    templateHint: "القالب رقم 7 (استطلاع رأي)",
  },
];

export type MechanicOption = {
  value: string;
  label: string;
};

export const MECHANICS: MechanicOption[] = [
  { value: "cashback", label: "استرداد نقدي" },
  { value: "points_redemption", label: "استبدال نقاط" },
  { value: "discount_percent", label: "خصم %" },
  { value: "none", label: "لا يوجد" },
];

export function findCategory(value: string): CategoryOption | undefined {
  return CATEGORIES.find((c) => c.value === value);
}

export function findMechanic(value: string): MechanicOption | undefined {
  return MECHANICS.find((m) => m.value === value);
}

/**
 * Lebanon Districts (Aqdya) — 26 Districts grouped by 9 Governorates
 *
 * Each district has trilingual labels (en/ar/fr) and representative
 * coordinates for the Haversine proximity engine.
 */

export interface District {
    id: string;
    labels: { en: string; ar: string; fr: string };
    /** Approximate center point for Haversine distance */
    lat: number;
    lng: number;
}

export interface Governorate {
    id: string;
    labels: { en: string; ar: string; fr: string };
    districts: District[];
}

export const LEBANON_GOVERNORATES: Governorate[] = [
    // ───── 1. Beirut ─────
    {
        id: 'beirut',
        labels: { en: 'Beirut', ar: 'بيروت', fr: 'Beyrouth' },
        districts: [
            { id: 'beirut_city', labels: { en: 'Beirut', ar: 'بيروت', fr: 'Beyrouth' }, lat: 33.8938, lng: 35.5018 },
        ],
    },

    // ───── 2. Mount Lebanon ─────
    {
        id: 'mount_lebanon',
        labels: { en: 'Mount Lebanon', ar: 'جبل لبنان', fr: 'Mont-Liban' },
        districts: [
            { id: 'baabda', labels: { en: 'Baabda', ar: 'بعبدا', fr: 'Baabda' }, lat: 33.8339, lng: 35.5444 },
            { id: 'aley', labels: { en: 'Aley', ar: 'عاليه', fr: 'Aley' }, lat: 33.8100, lng: 35.5975 },
            { id: 'chouf', labels: { en: 'Chouf', ar: 'الشوف', fr: 'Chouf' }, lat: 33.6900, lng: 35.5800 },
            { id: 'matn', labels: { en: 'Matn', ar: 'المتن', fr: 'Matn' }, lat: 33.8833, lng: 35.5667 },
        ],
    },

    // ───── 3. Keserwan-Jbeil ─────
    {
        id: 'keserwan_jbeil',
        labels: { en: 'Keserwan-Jbeil', ar: 'كسروان - جبيل', fr: 'Kesrouan-Jbeil' },
        districts: [
            { id: 'keserwan', labels: { en: 'Keserwan', ar: 'كسروان', fr: 'Kesrouan' }, lat: 33.9814, lng: 35.6378 },
            { id: 'jbeil', labels: { en: 'Jbeil (Byblos)', ar: 'جبيل', fr: 'Jbeil (Byblos)' }, lat: 34.1200, lng: 35.6500 },
        ],
    },

    // ───── 4. North Lebanon ─────
    {
        id: 'north',
        labels: { en: 'North Lebanon', ar: 'لبنان الشمالي', fr: 'Liban-Nord' },
        districts: [
            { id: 'tripoli', labels: { en: 'Tripoli', ar: 'طرابلس', fr: 'Tripoli' }, lat: 34.4360, lng: 35.8497 },
            { id: 'koura', labels: { en: 'Koura', ar: 'الكورة', fr: 'Koura' }, lat: 34.3197, lng: 35.8200 },
            { id: 'zgharta', labels: { en: 'Zgharta', ar: 'زغرتا', fr: 'Zghorta' }, lat: 34.3989, lng: 35.8953 },
            { id: 'bsharri', labels: { en: 'Bsharri', ar: 'بشري', fr: 'Bcharré' }, lat: 34.2508, lng: 36.0119 },
            { id: 'batroun', labels: { en: 'Batroun', ar: 'البترون', fr: 'Batroun' }, lat: 34.2553, lng: 35.6581 },
            { id: 'minnieh_dannieh', labels: { en: 'Minnieh-Dannieh', ar: 'المنية - الضنية', fr: 'Minieh-Danniyé' }, lat: 34.4500, lng: 36.0500 },
        ],
    },

    // ───── 5. Akkar ─────
    {
        id: 'akkar',
        labels: { en: 'Akkar', ar: 'عكار', fr: 'Akkar' },
        districts: [
            { id: 'akkar_district', labels: { en: 'Akkar', ar: 'عكار', fr: 'Akkar' }, lat: 34.5333, lng: 36.0833 },
        ],
    },

    // ───── 6. Beqaa ─────
    {
        id: 'beqaa',
        labels: { en: 'Beqaa', ar: 'البقاع', fr: 'Bekaa' },
        districts: [
            { id: 'zahle', labels: { en: 'Zahle', ar: 'زحلة', fr: 'Zahlé' }, lat: 33.8467, lng: 35.9022 },
            { id: 'west_beqaa', labels: { en: 'West Beqaa', ar: 'البقاع الغربي', fr: 'Bekaa-Ouest' }, lat: 33.6333, lng: 35.7333 },
            { id: 'rashaya', labels: { en: 'Rashaya', ar: 'راشيا', fr: 'Rachaya' }, lat: 33.4972, lng: 35.8444 },
        ],
    },

    // ───── 7. Baalbek-Hermel ─────
    {
        id: 'baalbek_hermel',
        labels: { en: 'Baalbek-Hermel', ar: 'بعلبك - الهرمل', fr: 'Baalbek-Hermel' },
        districts: [
            { id: 'baalbek', labels: { en: 'Baalbek', ar: 'بعلبك', fr: 'Baalbek' }, lat: 34.0047, lng: 36.2110 },
            { id: 'hermel', labels: { en: 'Hermel', ar: 'الهرمل', fr: 'Hermel' }, lat: 34.3956, lng: 36.3856 },
        ],
    },

    // ───── 8. South Lebanon ─────
    {
        id: 'south',
        labels: { en: 'South Lebanon', ar: 'لبنان الجنوبي', fr: 'Liban-Sud' },
        districts: [
            { id: 'sidon', labels: { en: 'Sidon (Saida)', ar: 'صيدا', fr: 'Sidon (Saïda)' }, lat: 33.5600, lng: 35.3714 },
            { id: 'tyre', labels: { en: 'Tyre (Sour)', ar: 'صور', fr: 'Tyr (Sour)' }, lat: 33.2705, lng: 35.2038 },
            { id: 'jezzine', labels: { en: 'Jezzine', ar: 'جزين', fr: 'Jezzine' }, lat: 33.5444, lng: 35.5850 },
        ],
    },

    // ───── 9. Nabatieh ─────
    {
        id: 'nabatieh',
        labels: { en: 'Nabatieh', ar: 'النبطية', fr: 'Nabatieh' },
        districts: [
            { id: 'nabatieh_district', labels: { en: 'Nabatieh', ar: 'النبطية', fr: 'Nabatieh' }, lat: 33.3778, lng: 35.4839 },
            { id: 'hasbaya', labels: { en: 'Hasbaya', ar: 'حاصبيا', fr: 'Hasbaya' }, lat: 33.3981, lng: 35.6850 },
            { id: 'marjayoun', labels: { en: 'Marjayoun', ar: 'مرجعيون', fr: 'Marjayoun' }, lat: 33.3603, lng: 35.5906 },
            { id: 'bint_jbeil', labels: { en: 'Bint Jbeil', ar: 'بنت جبيل', fr: 'Bint Jbeil' }, lat: 33.1206, lng: 35.4353 },
        ],
    },
];

/** Flatten all districts */
export function getAllDistricts(): District[] {
    return LEBANON_GOVERNORATES.flatMap((gov) => gov.districts);
}

/** Get a district by ID */
export function getDistrictById(id: string): District | undefined {
    return getAllDistricts().find((d) => d.id === id);
}

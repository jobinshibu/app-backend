import db from '../api/server/models/index.js';
import SearchService from '../api/server/services/search.js';
import moment from 'moment';

async function findOrCreate(model, where, defaults = {}) {
  try {
    const [record] = await model.findOrCreate({ where, defaults: { ...where, ...defaults } });
    return record;
  } catch (error) {
    console.warn(`Failed to create ${model.name}:`, error.message);
    // Try to find existing record
    const existing = await model.findOne({ where });
    if (existing) {
      return existing;
    }
    throw error;
  }
}

async function main() {
  try {
    console.log('Starting seed...');

    const {
      Language,
      Specialities,
      Service,
      Zones,
      Cities,
      Role,
      EstablishmentType,
      Establishment,
      Nationalities,
      ProfessionType,
      Profession,
      ProfessionLanguage,
      ProfessionSpeciality,
      ProfessionDepartment,
      profession_working_hours,
      EstablishmentService,
      EstablishmentBannerImages,
      Biomarker,
      BiomarkerGroup,
      Package,
      PackageBiomarker,
      PackageCategory,
      PackageGroup,
      PackageAddon,
      PharmacyBrand,
      PharmacyCategory,
      PharmacyInventory,
      PharmacyProduct,
      GroupBiomarker,
      InsuranceCompany,
      InsuranceNetwork,
      InsurancePlan,
      InsurancePlanCategory,
      InsurancePlanCategoryBenefit,
      InsurancePlanEstablishment,
      InsuranceSpeciality,
      InsurancePlanSpeciality,
      Benefit,
      PackageBundle,
      PackageBundleItem,
      Customer,
      PillpackPrescription,
      PillpackMedicine,
      PillpackSubscription,
      PillpackDosePack,
      PillpackAdherence,
      PillpackCaregiver,
      Brands,
      EstablishmentBrands

    } = db;

    // 1) Reference data
    const [english, arabic, hindi, malayalam] = await Promise.all([
      findOrCreate(Language, { language: 'English' }),
      findOrCreate(Language, { language: 'Arabic' }),
      findOrCreate(Language, { language: 'Hindi' }),
      findOrCreate(Language, { language: 'Malayalam' })
    ]);

    const [cardiology, dermatology, pediatrics, orthopedics] = await Promise.all([
      findOrCreate(Specialities, { name: 'Cardiology' }),
      findOrCreate(Specialities, { name: 'Dermatology' }),
      findOrCreate(Specialities, { name: 'Pediatrics' }),
      findOrCreate(Specialities, { name: 'Orthopedics' })
    ]);

    const [zoneA, zoneB, zoneC, zoneD] = await Promise.all([
      findOrCreate(Zones, { name: 'Zone A' }),
      findOrCreate(Zones, { name: 'Zone B' }),
      findOrCreate(Zones, { name: 'Zone C' }),
      findOrCreate(Zones, { name: 'Zone D' })
    ]);

    const [cityA, cityB, cityC, cityD] = await Promise.all([
      findOrCreate(Cities, { name: 'City A' }, { zone_id: zoneA.id }),
      findOrCreate(Cities, { name: 'City B' }, { zone_id: zoneB.id }),
      findOrCreate(Cities, { name: 'City C' }, { zone_id: zoneC.id }),
      findOrCreate(Cities, { name: 'City D' }, { zone_id: zoneD.id })
    ]);

    const [hospital, clinic, diagnostics, pharmacy] = await Promise.all([
      findOrCreate(EstablishmentType, { name: 'Hospital' }),
      findOrCreate(EstablishmentType, { name: 'Clinic' }),
      findOrCreate(EstablishmentType, { name: 'Laboratory' }),
      findOrCreate(EstablishmentType, { name: 'Pharmacy' })
    ]);

    const [india, uae, usa, uk] = await Promise.all([
      findOrCreate(Nationalities, { name: 'India' }),
      findOrCreate(Nationalities, { name: 'UAE' }),
      findOrCreate(Nationalities, { name: 'USA' }),
      findOrCreate(Nationalities, { name: 'UK' })
    ]);


    // 2) Establishments
    const ests = await Promise.all([
      findOrCreate(Establishment, {
        licence_no: 'EST-0001',
        name: 'Sunrise Hospital'
      }, {
        establishment_type: hospital.id,
        address: '123 Health St',
        city_id: cityA.id,
        zone_id: zoneA.id,
        pin_code: '560001',
        latitude: '12.9716',
        longitude: '77.5946',
        email: 'sunrise@example.com',
        mobile_country_code: '+91',
        contact_number: '9000000001',
        is_24_by_7_working: 1
      }),
      findOrCreate(Establishment, {
        licence_no: 'EST-0002',
        name: 'Green Clinic'
      }, {
        establishment_type: clinic.id,
        address: '456 Wellness Rd',
        city_id: cityB.id,
        zone_id: zoneB.id,
        pin_code: '560002',
        latitude: '12.9720',
        longitude: '77.5950',
        email: 'greenclinic@example.com',
        mobile_country_code: '+91',
        contact_number: '9000000002',
        is_24_by_7_working: 0
      }),
      findOrCreate(Establishment, {
        licence_no: 'EST-0003',
        name: 'City Diagnostics'
      }, {
        establishment_type: diagnostics.id,
        address: '789 Scan Ave',
        city_id: cityC.id,
        zone_id: zoneC.id,
        pin_code: '560003',
        latitude: '12.9730',
        longitude: '77.5960',
        email: 'citydiag@example.com',
        mobile_country_code: '+91',
        contact_number: '9000000003',
        is_24_by_7_working: 0
      }),
      findOrCreate(Establishment, {
        licence_no: 'EST-0004',
        name: 'Trusted Pharmacy'
      }, {
        establishment_type: pharmacy.id,
        address: '321 Med Lane',
        city_id: cityD.id,
        zone_id: zoneD.id,
        pin_code: '560004',
        latitude: '12.9740',
        longitude: '77.5970',
        email: 'trustedpharma@example.com',
        mobile_country_code: '+91',
        contact_number: '9000000004',
        is_24_by_7_working: 0
      })
    ]);
    // 3) Establishment Banner Images
    await Promise.all([
      findOrCreate(EstablishmentBannerImages, {
        establishment_id: ests[0].id,
        image: 'sunrise_hospital_banner1.png'
      }, {
        linkUrl: 'https://sunrisehospital.example.com/promo',
        type: 'banner'
      }),
      findOrCreate(EstablishmentBannerImages, {
        establishment_id: ests[1].id,
        image: 'green_clinic_banner1.png'
      }, {
        linkUrl: 'https://greenclinic.example.com/offers',
        type: 'banner'
      }),
      findOrCreate(EstablishmentBannerImages, {
        establishment_id: ests[2].id,
        image: 'city_diagnostics_banner1.png'
      }, {
        linkUrl: null,
        type: 'banner'
      }),
      findOrCreate(EstablishmentBannerImages, {
        establishment_id: ests[3].id,
        image: 'trusted_pharmacy_banner1.png'
      }, {
        linkUrl: 'https://trustedpharmacy.example.com/discounts',
        type: 'banner'
      })
    ]);


    const [consultation, ecg, xray, bloodTest] = await Promise.all([
      findOrCreate(Service, { name: 'Consultation', serviceType: 'forWomen' }, {
        categoryId: cardiology.id,
        description: 'General consultation with a specialist',
        hospitalDetails: {
          id: ests[0].id, lat: ests[0].latitude, long: ests[0].longitude,
          name: ests[0].name, address: ests[0].address, phone: ests[0].contact_number
        },
        price: 100, discountPrice: 80, resultTime: '30 mins',
        homeSampleCollection: false, testOverview: [], timeSchedule: '09:00 AM - 06:00 PM',
        image: '/upload/services/consultation.png'
      }),
      findOrCreate(Service, { name: 'ECG', serviceType: 'forMen' }, {
        categoryId: cardiology.id,
        description: 'Electrocardiogram heart test',
        hospitalDetails: {
          id: ests[1].id, lat: ests[1].latitude, long: ests[1].longitude,
          name: ests[1].name, address: ests[1].address, phone: ests[1].contact_number
        },
        price: 150, discountPrice: 120, resultTime: '1 hour',
        homeSampleCollection: false, testOverview: [
          { title: 'Heart Function', description: 'Measures heart rhythm' }
        ],
        timeSchedule: '10:00 AM - 05:00 PM',
        image: '/upload/services/ecg.png'
      }),
      findOrCreate(Service, { name: 'X-Ray', serviceType: 'forSeniors' }, {
        categoryId: orthopedics.id,
        description: 'Bone and joint X-ray test',
        hospitalDetails: {
          id: ests[2].id, lat: ests[2].latitude, long: ests[2].longitude,
          name: ests[2].name, address: ests[2].address, phone: ests[2].contact_number
        },
        price: 200, discountPrice: 150, resultTime: '2 hours',
        homeSampleCollection: false, testOverview: [
          { title: 'Bone Scan', description: 'Identifies fractures and issues' }
        ],
        timeSchedule: '08:00 AM - 04:00 PM',
        image: '/upload/services/xray.png'
      }),
      findOrCreate(Service, { name: 'Blood Test', serviceType: 'forKid' }, {
        categoryId: pediatrics.id,
        description: 'Complete blood test with home collection',
        hospitalDetails: {
          id: ests[3].id, lat: ests[3].latitude, long: ests[3].longitude,
          name: ests[3].name, address: ests[3].address, phone: ests[3].contact_number
        },
        price: 80, discountPrice: 60, resultTime: '1 day',
        homeSampleCollection: true, testOverview: [
          { title: 'CBC', description: 'Complete Blood Count' }
        ],
        timeSchedule: '07:00 AM - 01:00 PM',
        image: '/upload/services/bloodtest.png'
      })
    ]);

    // 4) Profession types
    const [doctor, therapist] = await Promise.all([
      findOrCreate(ProfessionType, { name: 'Doctor' }),
      findOrCreate(ProfessionType, { name: 'Therapist' })
    ]);

    // 5) Professions (Doctors)
    const profs = await Promise.all([
      findOrCreate(Profession, {
        first_name: 'Alice',
        last_name: 'Heart',
        email: 'alice.heart@example.com'
      }, {
        profession_type_id: doctor.id,
        specialist: 'Cardiologist',
        designation: 'Senior Consultant',
        educational_qualification: 'MD',
        working_since_month: 1,
        working_since_year: '2012',
        nationality_id: india.id,
        gender: 'female'
      }),
      findOrCreate(Profession, {
        first_name: 'Basil',
        last_name: 'Skin',
        email: 'basil.skin@example.com'
      }, {
        profession_type_id: doctor.id,
        specialist: 'Dermatologist',
        designation: 'Consultant',
        educational_qualification: 'MD',
        working_since_month: 5,
        working_since_year: '2015',
        nationality_id: uae.id,
        gender: 'male'
      }),
      findOrCreate(Profession, {
        first_name: 'Charlie',
        last_name: 'Kids',
        email: 'charlie.kids@example.com'
      }, {
        profession_type_id: doctor.id,
        specialist: 'Pediatrician',
        designation: 'Attending',
        educational_qualification: 'MD',
        working_since_month: 8,
        working_since_year: '2018',
        nationality_id: usa.id,
        gender: 'male'
      }),
      findOrCreate(Profession, {
        first_name: 'Diana',
        last_name: 'Bones',
        email: 'diana.bones@example.com'
      }, {
        profession_type_id: doctor.id,
        specialist: 'Orthopedic Surgeon',
        designation: 'Consultant',
        educational_qualification: 'MS',
        personal_visit_only: true,
        working_since_month: 3,
        working_since_year: '2010',
        nationality_id: uk.id,
        gender: 'female'
      })
    ]);


    // 6) Link professions to languages
    await Promise.all([
      findOrCreate(ProfessionLanguage, { proffession_id: profs[0].id, language_id: english.id }),
      findOrCreate(ProfessionLanguage, { proffession_id: profs[0].id, language_id: arabic.id }),
      findOrCreate(ProfessionLanguage, { proffession_id: profs[1].id, language_id: english.id }),
      findOrCreate(ProfessionLanguage, { proffession_id: profs[1].id, language_id: hindi.id }),
      findOrCreate(ProfessionLanguage, { proffession_id: profs[2].id, language_id: english.id }),
      findOrCreate(ProfessionLanguage, { proffession_id: profs[3].id, language_id: english.id })
    ]);

    // 7) Link professions to specialities
    await Promise.all([
      findOrCreate(ProfessionSpeciality, { proffession_id: profs[0].id, speciality_id: cardiology.id }),
      findOrCreate(ProfessionSpeciality, { proffession_id: profs[1].id, speciality_id: dermatology.id }),
      findOrCreate(ProfessionSpeciality, { proffession_id: profs[2].id, speciality_id: pediatrics.id }),
      findOrCreate(ProfessionSpeciality, { proffession_id: profs[3].id, speciality_id: orthopedics.id })
    ]);

    // 8) Link professions to establishments via departments (without department specifics)
    await Promise.all([
      findOrCreate(ProfessionDepartment, { proffession_id: profs[0].id, establishment_id: ests[0].id }),
      findOrCreate(ProfessionDepartment, { proffession_id: profs[1].id, establishment_id: ests[1].id }),
      findOrCreate(ProfessionDepartment, { proffession_id: profs[2].id, establishment_id: ests[2].id }),
      findOrCreate(ProfessionDepartment, { proffession_id: profs[3].id, establishment_id: ests[3].id })
    ]);

    await Promise.all([
      findOrCreate(Role, { name: 'Super Admin' }),
    ]);

    // 9) Working hours for today for each profession
    const today = new Date().getDay(); // 0-6
    await Promise.all(
      profs.map((p, idx) => findOrCreate(
        profession_working_hours,
        { profession_id: p.id, day_of_week: today },
        { start_time: '09:00:00', end_time: '17:00:00', is_day_off: false }
      ))
    );

    // 10) Establishment services
    await Promise.all([
      findOrCreate(EstablishmentService, { establishment_id: ests[0].id, service_id: consultation.id }),
      findOrCreate(EstablishmentService, { establishment_id: ests[0].id, service_id: ecg.id }),
      findOrCreate(EstablishmentService, { establishment_id: ests[1].id, service_id: consultation.id }),
      findOrCreate(EstablishmentService, { establishment_id: ests[2].id, service_id: xray.id })
    ]);

    // 11) Insert establishment_specialities
    await db.EstablishmentSpeciality.bulkCreate([
      { establishment_id: 2, speciality_id: 1 }, // Green Clinic with Cardiology
      { establishment_id: 2, speciality_id: 2 }  // Green Clinic with Dermatology
    ]);

    // 12) Insert professions_specialities (assuming profession IDs exist)
    await db.ProfessionSpeciality.bulkCreate([
      { proffession_id: 1, speciality_id: 1 }, // Doctor 1 with Cardiology
      { proffession_id: 2, speciality_id: 1 }, // Doctor 2 with Cardiology
      { proffession_id: 3, speciality_id: 2 }  // Doctor 3 with Dermatology
    ]);

    //------------------------------------------------------------------------------------------

    // 1. PackageCategory (3 categories)
    const [bloodTestCat, vitaminCheckCat, healthCheckCat] = await Promise.all([
      findOrCreate(PackageCategory, { name: 'Blood Tests' }, { description: 'Basic blood tests', icon: 'blood-test-icon.png' }),
      findOrCreate(PackageCategory, { name: 'Vitamin Check' }, { description: 'Vitamin level checks', icon: 'vitamin-icon.png' }),
      findOrCreate(PackageCategory, { name: 'Full Health Check' }, { description: 'Comprehensive health packages', icon: 'health-check-icon.png' })
    ]);

    // 2. Biomarker (5 biomarkers) - Now matches your exact table schema
    const [vitD, vitB12, folate, thiamine, glucose] = await Promise.all([
      findOrCreate(Biomarker, { id: 'BM1', name: 'Vitamin D Total' }, {
        description: 'Measures total Vitamin D levels in blood',
        image: null,
        significance: 'Essential for bone health, immune function, and calcium absorption',
        type: 'Quantitative',
        specimen: 'Blood',
        unit: 'ng/mL',
        category: 'Vitamins',
        fasting_required: false,
        fasting_time_hours: null,
        critical_min: null,
        critical_max: null,
        normal_min: 30,
        normal_max: 100,
        base_price: 50.0,
        selling_price: 45.0
      }),
      findOrCreate(Biomarker, { id: 'BM2', name: 'Vitamin B12' }, {
        description: 'Measures Vitamin B12 (Cobalamin) levels',
        image: null,
        significance: 'Important for nerve function and red blood cell formation',
        type: 'Quantitative',
        specimen: 'Blood',
        unit: 'pg/mL',
        category: 'Vitamins',
        fasting_required: false,
        fasting_time_hours: null,
        critical_min: null,
        critical_max: null,
        normal_min: 200,
        normal_max: 900,
        base_price: 40.0,
        selling_price: 35.0
      }),
      findOrCreate(Biomarker, { id: 'BM3', name: 'Folate (Vitamin B9)' }, {
        description: 'Measures folate levels in blood',
        image: null,
        significance: 'Critical for DNA synthesis and red blood cell formation',
        type: 'Quantitative',
        specimen: 'Blood',
        unit: 'ng/mL',
        category: 'Vitamins',
        fasting_required: false,
        fasting_time_hours: null,
        critical_min: null,
        critical_max: null,
        normal_min: 3,
        normal_max: 17,
        base_price: 30.0,
        selling_price: 25.0
      }),
      findOrCreate(Biomarker, { id: 'BM4', name: 'Vitamin B1 (Thiamine)' }, {
        description: 'Measures Thiamine levels',
        image: null,
        significance: 'Essential for energy metabolism and nerve function',
        type: 'Quantitative',
        specimen: 'Blood',
        unit: 'nmol/L',
        category: 'Vitamins',
        fasting_required: false,
        fasting_time_hours: null,
        critical_min: null,
        critical_max: null,
        normal_min: 70,
        normal_max: 180,
        base_price: 35.0,
        selling_price: 30.0
      }),
      findOrCreate(Biomarker, { id: 'BM5', name: 'Fasting Blood Glucose' }, {
        description: 'Measures blood sugar level after fasting',
        image: null,
        significance: 'Primary test for diabetes diagnosis and monitoring',
        type: 'Quantitative',
        specimen: 'Blood',
        unit: 'mg/dL',
        category: 'Blood Sugar',
        fasting_required: true,
        fasting_time_hours: 8,
        critical_min: null,
        critical_max: null,
        normal_min: 70,
        normal_max: 99,
        base_price: 20.0,
        selling_price: 15.0
      })
    ]);

    // 3. BiomarkerGroup (2 groups)
    const [vitaminPanel, bloodSugarPanel] = await Promise.all([
      findOrCreate(BiomarkerGroup, { id: 'BG1', name: 'Vitamin Panel' }, {
        description: 'Group for vitamin biomarkers',
        base_price: 100.0,
        selling_price: 90.0
      }),
      findOrCreate(BiomarkerGroup, { id: 'BG2', name: 'Blood Sugar Panel' }, {
        description: 'Group for blood sugar tests',
        base_price: 50.0,
        selling_price: 45.0
      })
    ]);

    // 4. GroupBiomarker (link biomarkers to groups)
    await db.GroupBiomarker.bulkCreate([
      { group_id: vitaminPanel.id, biomarker_id: vitD.id },
      { group_id: vitaminPanel.id, biomarker_id: vitB12.id },
      { group_id: vitaminPanel.id, biomarker_id: folate.id },
      { group_id: vitaminPanel.id, biomarker_id: thiamine.id },
      { group_id: bloodSugarPanel.id, biomarker_id: glucose.id }
    ], { ignoreDuplicates: true });

    // 5. Package (3 packages)
    const [basicHealth, vitaminCheck, fullHealth] = await Promise.all([
      findOrCreate(Package, { id: '1000001', name: 'Basic Health Check' }, {
        sub_title: 'Essential tests',
        selling_price: 200.0,
        category_id: bloodTestCat.id,
        establishment_id: 1  // Assume existing establishment ID
      }),
      findOrCreate(Package, { id: '1000002', name: 'Vitamin Check Package' }, {
        sub_title: 'Vitamin levels',
        selling_price: 150.0,
        category_id: vitaminCheckCat.id,
        establishment_id: 1
      }),
      findOrCreate(Package, { id: '1000003', name: 'Full Health Check' }, {
        sub_title: 'Comprehensive',
        selling_price: 500.0,
        category_id: healthCheckCat.id,
        establishment_id: 1
      })
    ]);

    // 6. PackageBiomarker (link biomarkers to packages)
    await db.PackageBiomarker.bulkCreate([
      { package_id: basicHealth.id, biomarker_id: glucose.id },
      { package_id: vitaminCheck.id, biomarker_id: vitD.id },
      { package_id: vitaminCheck.id, biomarker_id: vitB12.id },
      { package_id: fullHealth.id, biomarker_id: vitD.id },
      { package_id: fullHealth.id, biomarker_id: glucose.id }
    ], { ignoreDuplicates: true });

    // 7. PackageGroup (link groups to packages)
    await db.PackageGroup.bulkCreate([
      { package_id: vitaminCheck.id, group_id: vitaminPanel.id },
      { package_id: fullHealth.id, group_id: vitaminPanel.id },
      { package_id: fullHealth.id, group_id: bloodSugarPanel.id }
    ], { ignoreDuplicates: true });

    // 8. PackageAddon (add-ons)
    await db.PackageAddon.bulkCreate([
      { package_id: basicHealth.id, biomarker_id: vitD.id, recommended: true, why_recommended: 'Optional vitamin check' },
      { package_id: vitaminCheck.id, addon_package_id: basicHealth.id, recommended: false }
    ], { ignoreDuplicates: true });

    // 9. PharmacyBrand (3 brands)
    const [pfizer, johnson, neutrogena] = await Promise.all([
      findOrCreate(db.PharmacyBrand, { name: 'Pfizer' }, { logo: 'pfizer-logo.png' }),
      findOrCreate(db.PharmacyBrand, { name: 'Johnson & Johnson' }, { logo: 'jnj-logo.png' }),
      findOrCreate(db.PharmacyBrand, { name: 'Neutrogena' }, { logo: 'neutrogena-logo.png' })
    ]);

    // 10. PharmacyCategory (3 categories)
    const [painRelief, vitamins, skinCare] = await Promise.all([
      findOrCreate(db.PharmacyCategory, { name: 'Pain Relief' }, { icon: 'pain-icon.png', is_quick_link: true, sort_order: 1 }),
      findOrCreate(db.PharmacyCategory, { name: 'Vitamins' }, { icon: 'vitamins-icon.png', is_quick_link: true, sort_order: 2 }),
      findOrCreate(db.PharmacyCategory, { name: 'Skin Care' }, { icon: 'skin-icon.png', is_quick_link: true, sort_order: 3 })
    ]);

    // 11. PharmacyProduct (5 products)
    const [paracetamol, vitaminC, cetirizine, ibuprofen, sunscreen] = await Promise.all([
      findOrCreate(db.PharmacyProduct, { name: 'Paracetamol' }, {
        brand_id: pfizer.id,
        category_id: painRelief.id,
        image: 'paracetamol.jpg',
        base_price: 10.0,
        selling_price: 8.0,
        is_prescription_required: false,
        stock_global: 100
      }),
      findOrCreate(db.PharmacyProduct, { name: 'Vitamin C' }, {
        brand_id: johnson.id,
        category_id: vitamins.id,
        image: 'vitc.jpg',
        base_price: 20.0,
        selling_price: 18.0,
        is_prescription_required: false,
        stock_global: 200
      }),
      findOrCreate(db.PharmacyProduct, { name: 'Cetirizine' }, {
        brand_id: pfizer.id,
        category_id: painRelief.id,
        image: 'cetirizine.jpg',
        base_price: 15.0,
        selling_price: 12.0,
        is_prescription_required: true,
        stock_global: 150
      }),
      findOrCreate(db.PharmacyProduct, { name: 'Ibuprofen' }, {
        brand_id: pfizer.id,
        category_id: painRelief.id,
        image: 'ibuprofen.jpg',
        base_price: 25.0,
        selling_price: 22.0,
        is_prescription_required: false,
        stock_global: 120
      }),
      findOrCreate(db.PharmacyProduct, { name: 'Sunscreen SPF50' }, {
        brand_id: neutrogena.id,
        category_id: skinCare.id,
        image: 'sunscreen.jpg',
        base_price: 50.0,
        selling_price: 45.0,
        is_prescription_required: false,
        stock_global: 80
      })
    ]);

    // 12. PharmacyInventory (link products to pharmacies - assume pharmacy ID 1 exists)
    await db.PharmacyInventory.bulkCreate([
      { pharmacy_id: 1, product_id: paracetamol.id, stock: 50, price: 9.0 },
      { pharmacy_id: 1, product_id: vitaminC.id, stock: 100, price: 19.0 },
      { pharmacy_id: 1, product_id: cetirizine.id, stock: 75, price: 13.0 },
      { pharmacy_id: 1, product_id: ibuprofen.id, stock: 60, price: 23.0 },
      { pharmacy_id: 1, product_id: sunscreen.id, stock: 40, price: 46.0 }
    ], { ignoreDuplicates: true });

    // -----------------------------------------------------------------------------
    // NEW INSURANCE MODULE SEEDING (WITHOUT BenefitCategory TABLE)
    // -----------------------------------------------------------------------------

    // 1. Insurance Companies
    const [ngi, adnic, daman] = await Promise.all([
      findOrCreate(InsuranceCompany, { name: 'NGI' }, { email: 'support@ngi.com' }),
      findOrCreate(InsuranceCompany, { name: 'ADNIC' }, { email: 'support@adnic.com' }),
      findOrCreate(InsuranceCompany, { name: 'Daman' }, { email: 'support@daman.com' }),
    ]);

    // 2. Insurance Networks
    const [nextCare, neuron, medNet] = await Promise.all([
      findOrCreate(InsuranceNetwork, { name: 'NextCare', company_id: ngi.id }),
      findOrCreate(InsuranceNetwork, { name: 'Neuron', company_id: adnic.id }),
      findOrCreate(InsuranceNetwork, { name: 'MedNet', company_id: daman.id }),
    ]);

    // 3. Insurance Plans
    const [gnPlan, rnPlan, bluePlan] = await Promise.all([
      findOrCreate(
        InsurancePlan,
        { name: 'GN', network_id: nextCare.id },
        {
          annual_limit: 'AED 1,000,000',
          area_of_cover: 'Worldwide',
          sub_title: 'Premium Health Insurance',
          description: 'Comprehensive coverage for you and your family.',
          selling_price: 2499.00,
          strike_price: 2999.00,
          cover_amount: 1000000,
          features: ["Direct Billing", "Worldwide Coverage", "Maternity Included"],
          discount_text: "Save 15% today",
          special_for_customers: true,
          recommended: true
        }
      ),
      findOrCreate(
        InsurancePlan,
        { name: 'RN', network_id: nextCare.id },
        {
          annual_limit: 'AED 750,000',
          area_of_cover: 'UAE Only',
          sub_title: 'Standard Health Insurance',
          description: 'Great value for essential health needs.',
          selling_price: 1499.00,
          strike_price: 1799.00,
          cover_amount: 750000,
          features: ["UAE Coverage", "DHA Approved", "Emergency Care"],
          discount_text: "10% off with card",
          special_for_customers: false,
          recommended: true
        }
      ),
      findOrCreate(
        InsurancePlan,
        { name: 'Blue', network_id: neuron.id },
        {
          annual_limit: 'AED 500,000',
          area_of_cover: 'UAE Only',
          sub_title: 'Basic Health Insurance',
          description: 'Perfect for individuals & workers.',
          selling_price: 999.00,
          strike_price: 1200.00,
          cover_amount: 500000,
          features: ["Network Hospitals", "Basic Essentials", "Quick Approval"],
          discount_text: null,
          special_for_customers: true,
          recommended: false
        }
      ),
    ]);

    // 4. Benefits Master
    const [
      roomBoard,
      maternity,
      chronic,
      radiology,
      consultationBenefit,
      pharmacyBenefit,
      dentalFilling,
      opticalTesting,
    ] = await Promise.all([
      findOrCreate(Benefit, { name: 'Room & Board' }, { description: 'Hospital stay, room charges' }),
      findOrCreate(Benefit, { name: 'Maternity' }, { description: 'Maternity & delivery services' }),
      findOrCreate(Benefit, { name: 'Chronic Disease Care' }, { description: 'Chronic condition treatment' }),
      findOrCreate(Benefit, { name: 'Radiology' }, { description: 'X-ray, MRI, CT' }),
      findOrCreate(Benefit, { name: 'Consultation' }, { description: 'Doctor consultation' }),
      findOrCreate(Benefit, { name: 'Pharmacy' }, { description: 'Medication coverage' }),
      findOrCreate(Benefit, { name: 'Dental Filling' }, { description: 'Basic dental procedures' }),
      findOrCreate(Benefit, { name: 'Optical Test' }, { description: 'Eye examination' }),
    ]);

    // 5. Plan Categories (NO benefit_category)
    const gnCategories = await Promise.all([
      findOrCreate(
        InsurancePlanCategory,
        { plan_id: gnPlan.id, description: 'Inpatient Coverage' },
        { co_payment_info: '10% co-pay' }
      ),
      findOrCreate(
        InsurancePlanCategory,
        { plan_id: gnPlan.id, category_name: 'outpatient', description: 'Outpatient Coverage' },
        { co_payment_info: '20% co-pay' }
      ),
      findOrCreate(
        InsurancePlanCategory,
        { plan_id: gnPlan.id, category_name: 'optical', description: 'Dental Coverage' },
        { co_payment_info: '10% co-pay' }
      ),
      findOrCreate(
        InsurancePlanCategory,
        { plan_id: gnPlan.id, category_name: 'dental', description: 'Optical Coverage' },
        { co_payment_info: 'Yearly limit AED 200' }
      ),
    ]);

    const [inpatientCat, outpatientCat, dentalCat, opticalCat] = gnCategories;

    // 6. Attach benefits to categories
    await Promise.all([
      findOrCreate(
        InsurancePlanCategoryBenefit,
        { plan_category_id: inpatientCat.id, benefit_id: roomBoard.id },
        { included: true, notes: '100% coverage' }
      ),
      findOrCreate(
        InsurancePlanCategoryBenefit,
        { plan_category_id: inpatientCat.id, benefit_id: chronic.id },
        { included: true }
      ),
      findOrCreate(
        InsurancePlanCategoryBenefit,
        { plan_category_id: outpatientCat.id, benefit_id: consultationBenefit.id },
        { included: true, notes: '20% co-pay applies' }
      ),
      findOrCreate(
        InsurancePlanCategoryBenefit,
        { plan_category_id: outpatientCat.id, benefit_id: pharmacyBenefit.id },
        { included: true }
      ),
      findOrCreate(
        InsurancePlanCategoryBenefit,
        { plan_category_id: outpatientCat.id, benefit_id: radiology.id },
        { included: true }
      ),
      findOrCreate(
        InsurancePlanCategoryBenefit,
        { plan_category_id: dentalCat.id, benefit_id: dentalFilling.id },
        { included: true, notes: '1 filling/year' }
      ),
      findOrCreate(
        InsurancePlanCategoryBenefit,
        { plan_category_id: opticalCat.id, benefit_id: opticalTesting.id },
        { included: true, notes: 'Up to AED 200 per year' }
      ),
    ]);

    // 7. Plan ↔ Establishment Linking (Existing commented out or handled elsewhere)

    // -----------------------------------------------------------------------------
    // BRAND SEEDING
    // -----------------------------------------------------------------------------

    // 1. Brands
    const [brand1, brand2, brand3] = await Promise.all([
      findOrCreate(Brands, { name: 'HealthPlus' }, { icon: 'healthplus.png', description: 'Premium health products' }),
      findOrCreate(Brands, { name: 'MedLife' }, { icon: 'medlife.png', description: 'Trusted medical partner' }),
      findOrCreate(Brands, { name: 'CareFirst' }, { icon: 'carefirst.png', description: 'First in care' })
    ]);

    // 2. Link Brands to Establishments
    // Assuming ests array from section 2 is available (ests[0] = Sunrise, ests[1] = Green Clinic, etc.)
    if (ests && ests.length > 0) {
      await Promise.all([
        findOrCreate(EstablishmentBrands, { establishment_id: ests[0].id, brand_id: brand1.id }),
        findOrCreate(EstablishmentBrands, { establishment_id: ests[0].id, brand_id: brand2.id }),
        findOrCreate(EstablishmentBrands, { establishment_id: ests[1].id, brand_id: brand2.id }),
        findOrCreate(EstablishmentBrands, { establishment_id: ests[1].id, brand_id: brand3.id })
      ]);
    }

    await Promise.all([
      findOrCreate(InsurancePlanEstablishment, {
        plan_id: gnPlan.id,
        establishment_id: ests[0].id,
      }),
      findOrCreate(InsurancePlanEstablishment, {
        plan_id: gnPlan.id,
        establishment_id: ests[1].id,
      }),
      findOrCreate(InsurancePlanEstablishment, {
        plan_id: gnPlan.id,
        establishment_id: ests[2].id,
      }),
      findOrCreate(InsurancePlanEstablishment, {
        plan_id: rnPlan.id,
        establishment_id: ests[2].id,
      }),
      findOrCreate(InsurancePlanEstablishment, {
        plan_id: bluePlan.id,
        establishment_id: ests[3].id,
      }),
    ]);

    // -----------------------------------------------------------------------------
    // NEW BUNDLE SEEDING
    // -----------------------------------------------------------------------------

    // 1. Create a Package Bundle
    const [corporateBundle] = await Promise.all([
      findOrCreate(PackageBundle, { id: 'BUN001', name: 'Corporate Wellness Bundle' }, {
        sub_title: 'Complete employee care',
        description: 'Includes health checkups and vitamins for employees.',
        base_price: 1500.0,
        selling_price: 1200.0,
        validity_days: 365,
        label: 'Best Value',
        individual_restriction: false,
        visible: true,
        // establishment_id: ests[0].id, // Optional
        // category_id: healthCheckCat.id // Optional
      })
    ]);

    // 2. Link Packages to Bundle
    await db.PackageBundleItem.bulkCreate([
      { bundle_id: corporateBundle.id, package_id: basicHealth.id, qty: 5 }, // 5 Basic Health Checks
      { bundle_id: corporateBundle.id, package_id: vitaminCheck.id, qty: 3 }, // 3 Vitamin Checks
      { bundle_id: corporateBundle.id, package_id: fullHealth.id, qty: 1 }   // 1 Full Health Check
    ], { ignoreDuplicates: true });

    console.log('✅ Bundle seeding completed');

    //CREATE SPECIALITIES
    const [
      specEmergency,
      specMaternity,
      specDental,
      specOptical,
      specChronicCare,
      specPhysiotherapy
    ] = await Promise.all([
      findOrCreate(
        InsuranceSpeciality,
        { name: "Emergency" },
        { description: "Emergency & ambulance coverage", icon: "emergency.png" }
      ),
      findOrCreate(
        InsuranceSpeciality,
        { name: "Maternity" },
        { description: "Maternity & newborn care", icon: "maternity.png" }
      ),
      findOrCreate(
        InsuranceSpeciality,
        { name: "Dental" },
        { description: "Dental care & procedures", icon: "dental.png" }
      ),
      findOrCreate(
        InsuranceSpeciality,
        { name: "Optical" },
        { description: "Optical exams & eyewear", icon: "optical.png" }
      ),
      findOrCreate(
        InsuranceSpeciality,
        { name: "Chronic Care" },
        { description: "Chronic condition management", icon: "chronic.png" }
      ),
      findOrCreate(
        InsuranceSpeciality,
        { name: "Physiotherapy" },
        { description: "Physiotherapy sessions", icon: "physio.png" }
      )
    ]);

    // -----------------------------------------------------------------------------
    // LINK SPECIALITIES TO INSURANCE PLANS
    // (Only link plans that exist in your earlier seeding: gnPlan, rnPlan, bluePlan)
    // -----------------------------------------------------------------------------

    await Promise.all([
      // GN PLAN
      findOrCreate(
        InsurancePlanSpeciality,
        { plan_id: gnPlan.id, speciality_id: specEmergency.id }
      ),
      findOrCreate(
        InsurancePlanSpeciality,
        { plan_id: gnPlan.id, speciality_id: specMaternity.id }
      ),
      findOrCreate(
        InsurancePlanSpeciality,
        { plan_id: gnPlan.id, speciality_id: specChronicCare.id }
      ),

      // RN PLAN
      findOrCreate(
        InsurancePlanSpeciality,
        { plan_id: rnPlan.id, speciality_id: specDental.id }
      ),
      findOrCreate(
        InsurancePlanSpeciality,
        { plan_id: rnPlan.id, speciality_id: specOptical.id }
      ),

      // BLUE PLAN
      findOrCreate(
        InsurancePlanSpeciality,
        { plan_id: bluePlan.id, speciality_id: specEmergency.id }
      ),
      findOrCreate(
        InsurancePlanSpeciality,
        { plan_id: bluePlan.id, speciality_id: specPhysiotherapy.id }
      )
    ]);




    // -----------------------------------------------------------------------------
    // PILLPACK SEEDING
    // -----------------------------------------------------------------------------
    console.log('Seeding Pillpack data...');

    // 1. Sample Pillpack Customer
    const pillpackUser = await findOrCreate(Customer, { email: 'pillpack.user@example.com' }, {
      first_name: 'Pillpack',
      last_name: 'User',
      mobile_country_code: '+971',
      mobile_no: 501234567,
      gender: 'male',
      dateOfBirth: '1985-05-15'
    });

    const caregiverUser = await findOrCreate(Customer, { email: 'caregiver.user@example.com' }, {
      first_name: 'Caregiver',
      last_name: 'User',
      mobile_country_code: '+971',
      mobile_no: 509876543,
      gender: 'female',
      dateOfBirth: '1990-10-20'
    });

    // 2. Sample Prescription
    const prescription = await findOrCreate(PillpackPrescription, {
      customer_id: pillpackUser.id,
      doctor_name: 'Dr. John Doe'
    }, {
      prescription_file: 'prescription_sample.jpg',
      upload_method: 'file',
      status: 'verified',
      ocr_data: JSON.stringify({
        medicines: [
          { name: 'Paracetamol', dosage: '500mg', frequency: 'Daily' },
          { name: 'Vitamin C', dosage: '1000mg', frequency: 'Daily' }
        ]
      })
    });

    // 3. Sample Medicines
    const med1 = await findOrCreate(PillpackMedicine, {
      prescription_id: prescription.id,
      medicine_name: 'Paracetamol'
    }, {
      product_id: paracetamol.id,
      pharmacy_id: ests[3].id, // Trusted Pharmacy
      dosage: '500mg',
      frequency: 'Daily',
      timing: JSON.stringify(['morning']),
      duration_days: 30,
      status: 'mapped'
    });

    const med2 = await findOrCreate(PillpackMedicine, {
      prescription_id: prescription.id,
      medicine_name: 'Vitamin C'
    }, {
      product_id: vitaminC.id,
      pharmacy_id: ests[3].id,
      dosage: '1000mg',
      frequency: 'Daily',
      timing: JSON.stringify(['morning']),
      duration_days: 30,
      status: 'mapped'
    });

    // 4. Sample Subscription
    const subscription = await findOrCreate(PillpackSubscription, {
      customer_id: pillpackUser.id,
      prescription_id: prescription.id
    }, {
      start_date: moment().format('YYYY-MM-DD'),
      next_refill_date: moment().add(30, 'days').format('YYYY-MM-DD'),
      status: 'active',
      total_amount: 150.00
    });

    // 5. Sample Dose Packs (Next 3 days)
    const dosePacks = [];
    for (let i = 0; i < 3; i++) {
      const date = moment().add(i, 'days').format('YYYY-MM-DD');
      dosePacks.push(
        findOrCreate(PillpackDosePack, {
          subscription_id: subscription.id,
          pack_date: date,
          time_slot: 'morning'
        }, {
          medicines: JSON.stringify([
            { name: 'Paracetamol', dosage: '500mg' },
            { name: 'Vitamin C', dosage: '1000mg' }
          ]),
          packing_status: i === 0 ? 'packed' : 'pending'
        })
      );
    }
    await Promise.all(dosePacks);

    // 6. Sample Adherence (Yesterday)
    await findOrCreate(PillpackAdherence, {
      customer_id: pillpackUser.id,
      subscription_id: subscription.id,
      dose_date: moment().subtract(1, 'days').format('YYYY-MM-DD'),
      time_slot: 'morning'
    }, {
      scheduled_time: '09:00:00',
      status: 'taken',
      taken_at: moment().subtract(1, 'days').set({ hour: 9, minute: 30 }).toDate()
    });

    // 7. Caregiver Relationship
    await findOrCreate(PillpackCaregiver, {
      customer_id: pillpackUser.id,
      caregiver_id: caregiverUser.id
    }, {
      permissions: JSON.stringify(['view_adherence', 'mark_taken']),
      status: 'accepted'
    });

    console.log('✅ Pillpack seeding completed');

    await SearchService.syncSearchData();

    console.log('Seed completed successfully.');
    process.exit(0);
  } catch (err) {
    console.error('Seed failed:', err);
    process.exit(1);
  }
}

main();

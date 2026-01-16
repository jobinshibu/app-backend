// controllers/InsuranceController.js
import httpStatus from "http-status";
import APIResponse from "../utils/APIResponse.js";
import db from "../models/index.js";
import { Op } from "sequelize";
import Joi from "joi";
import userValidator from '../validators/user.js';

class InsuranceController {

    // ------------------------------------------------------------
    // ADD CUSTOMER INSURANCE
    // ------------------------------------------------------------
    async addCustomerInsurance(req, res) {
        try {
            const {
                company_id,
                network_id,
                plan_id,
                policy_number,
                policy_holder_name,
                end_date,
                policy_type
            } = req.body;

            const customerId = req.user.id;

            // -------- VALIDATIONS ---------

            // 1. Validate customer
            const customer = await db.Customer.findByPk(customerId);
            if (!customer) {
                return res.status(404).json(new APIResponse({}, "Customer not found", 404));
            }

            // 2. Validate company
            const company = await db.InsuranceCompany.findByPk(company_id);
            if (!company) {
                return res.status(400).json(new APIResponse({}, "Invalid insurance company", 400));
            }

            // 3. Validate network belongs to company
            const network = await db.InsuranceNetwork.findOne({
                where: { id: network_id, company_id }
            });

            if (!network) {
                return res.status(400).json(new APIResponse({}, "Invalid insurance network", 400));
            }

            // 4. Validate plan belongs to network
            const plan = await db.InsurancePlan.findOne({
                where: { id: plan_id, network_id }
            });

            if (!plan) {
                return res.status(400).json(new APIResponse({}, "Invalid insurance plan", 400));
            }

            // 6. Prevent duplicate active policy
            const existing = await db.CustomerInsurance.findOne({
                where: {
                    customer_id: customerId,
                    plan_id,
                    status: "ACTIVE"
                }
            });

            if (existing) {
                return res.status(409).json(
                    new APIResponse({}, "Active policy already exists for this plan", 409)
                );
            }

            // -------- CREATE INSURANCE RECORD --------
            const record = await db.CustomerInsurance.create({
                customer_id: customerId,
                company_id,
                network_id,
                plan_id,
                policy_number,
                policy_holder_name,
                end_date,
                policy_type,
                status: "ACTIVE"
            });

            return res.status(200).json(
                new APIResponse(record, "Insurance added successfully", 200)
            );

        } catch (err) {
            console.error("Error:", err);
            return res.status(500).json(new APIResponse({}, "Server Error", 500));
        }
    }

    // ------------------------------------------------------------
    // FETCH CUSTOMER INSURANCE DETAILS
    // ------------------------------------------------------------
    async getCustomerInsurance(req, res) {
        try {
            const customerId = req.user.id;

            const data = await db.CustomerInsurance.findAll({
                where: { customer_id: customerId },
                include: [
                    { model: db.InsuranceCompany, as: "company" },
                    { model: db.InsuranceNetwork, as: "network" },
                    {
                        model: db.InsurancePlan,
                        as: "plan",
                        include: [
                            {
                                model: db.InsurancePlanCategory,
                                as: "categories",
                                include: [
                                    {
                                        model: db.InsurancePlanCategoryBenefit,
                                        as: "benefits",
                                        include: [
                                            {
                                                model: db.Benefit,
                                                as: "benefit"
                                            }
                                        ]
                                    }
                                ]
                            },
                            {
                                model: db.InsuranceSpeciality,
                                as: "planSpecialities",
                                through: { attributes: [] }, // Exclude junction table data
                                attributes: ['id', 'name', 'icon', 'description']
                            }
                        ]
                    }
                ]
            });

            return res.status(200).json(
                new APIResponse(data, "Customer insurance info fetched", 200)
            );

        } catch (err) {
            console.error("Error:", err);
            return res.status(500).json(new APIResponse({}, "Server error", 500));
        }
    }

    // ------------------------------------------------------------
    // GET SINGLE CUSTOMER INSURANCE BY ID
    // ------------------------------------------------------------
    async getCustomerInsuranceById(req, res) {
        try {
            const insuranceId = req.params.id;
            const customerId = req.user.id;

            const record = await db.CustomerInsurance.findOne({
                where: { id: insuranceId, customer_id: customerId },
                include: [
                    { model: db.InsuranceCompany, as: "company" },
                    { model: db.InsuranceNetwork, as: "network" },
                    {
                        model: db.InsurancePlan,
                        as: "plan",
                        include: [
                            {
                                model: db.InsurancePlanCategory,
                                as: "categories",
                                attributes: ['id', 'plan_id', 'category_name', 'description', 'co_payment', 'co_payment_info'],
                                include: [
                                    {
                                        model: db.InsurancePlanCategoryBenefit,
                                        as: "benefits",
                                        include: [
                                            { model: db.Benefit, as: "benefit" }
                                        ]
                                    }
                                ]
                            },
                            {
                                model: db.InsuranceSpeciality,
                                as: "planSpecialities",
                                through: { attributes: [] }, // Exclude junction table data
                                attributes: ['id', 'name', 'icon', 'description']
                            }
                        ]
                    }
                ]
            });

            if (!record) {
                return res.status(404).json(
                    new APIResponse({}, "Insurance record not found", 404)
                );
            }

            return res.status(200).json(
                new APIResponse(record, "Insurance record fetched successfully", 200)
            );

        } catch (err) {
            console.error(err);
            return res.status(500).json(new APIResponse({}, "Server error", 500));
        }
    }

    // ------------------------------------------------------------
    // UPDATE CUSTOMER INSURANCE
    // ------------------------------------------------------------
    async updateCustomerInsurance(req, res) {
        try {
            const id = req.params.id;
            const customerId = req.user.id;

            const {
                company_id,
                network_id,
                plan_id,
                policy_number,
                policy_holder_name,
                end_date,
                policy_type
            } = req.body;

            // -----------------------------
            // Validate ownership
            // -----------------------------
            const record = await db.CustomerInsurance.findOne({
                where: { id, customer_id: customerId }
            });

            if (!record) {
                return res.status(404).json(
                    new APIResponse({}, "Insurance record not found or not owned by user", 404)
                );
            }

            // -----------------------------
            // Validate relationships
            // -----------------------------
            // 1. Company validation
            const company = await db.InsuranceCompany.findByPk(company_id);
            if (!company) {
                return res.status(400).json(new APIResponse({}, "Invalid insurance company", 400));
            }

            // 2. Network validation
            const network = await db.InsuranceNetwork.findOne({
                where: { id: network_id, company_id }
            });
            if (!network) {
                return res.status(400).json(new APIResponse({}, "Invalid network for the selected company", 400));
            }

            // 3. Plan validation
            const plan = await db.InsurancePlan.findOne({
                where: { id: plan_id, network_id }
            });
            if (!plan) {
                return res.status(400).json(new APIResponse({}, "Invalid plan for the selected network", 400));
            }

            // -----------------------------
            // Prevent duplicate active policies
            // -----------------------------
            const duplicate = await db.CustomerInsurance.findOne({
                where: {
                    customer_id: customerId,
                    plan_id: plan_id,
                    status: "ACTIVE",
                    id: { [Op.ne]: id }
                }
            });

            if (duplicate) {
                return res.status(409).json(
                    new APIResponse({}, "An active policy already exists for this plan", 409)
                );
            }

            // -----------------------------
            // Validate dates
            // -----------------------------
            if (end_date && isNaN(Date.parse(end_date))) {
                return res.status(400).json(new APIResponse({}, "Invalid end_date", 400));
            }

            // -----------------------------
            // UPDATE RECORD
            // -----------------------------
            await record.update({
                company_id,
                network_id,
                plan_id,
                policy_number: policy_number ?? record.policy_number,
                policy_holder_name: policy_holder_name ?? record.policy_holder_name,
                end_date: end_date ?? record.end_date,
                policy_type: policy_type ?? record.policy_type
            });

            return res.status(200).json(
                new APIResponse(record, "Insurance updated successfully", 200)
            );

        } catch (err) {
            console.error(err);
            return res.status(500).json(new APIResponse({}, "Server error", 500));
        }
    }



    // ------------------------------------------------------------
    // CANCEL CUSTOMER INSURANCE
    // ------------------------------------------------------------
    async deleteCustomerInsurance(req, res) {
        try {
            const { id } = req.params;
            const customerId = req.user.id;

            const updated = await db.CustomerInsurance.update(
                { status: "CANCELLED" },
                { where: { id, customer_id: customerId } }
            );

            if (updated[0] === 0) {
                return res.status(404).json(
                    new APIResponse({}, "Insurance record not found or not owned by user", 404)
                );
            }

            return res.status(200).json(
                new APIResponse({}, "Insurance cancelled", 200)
            );

        } catch (err) {
            console.error("Error:", err);
            return res.status(500).json(new APIResponse({}, "Server error", 500));
        }
    }

    // ------------------------------------------------------------
    // GET ALL INSURANCE PLANS (LIST)
    // ------------------------------------------------------------
    async getAllPlans(req, res) {
        try {
            const plans = await db.InsurancePlan.findAll({
                include: [
                    {
                        model: db.InsuranceNetwork,
                        as: "network",
                        include: [
                            {
                                model: db.InsuranceCompany,
                                as: "company",
                                attributes: ["id", "name", "logo_url"]
                            }
                        ],
                        attributes: ["id", "name"]
                    },
                    {
                        model: db.InsuranceSpeciality,
                        as: "planSpecialities",
                        through: { attributes: [] }, // Exclude junction table data
                        attributes: ['id', 'name', 'icon', 'description']
                    },
                    {
                        model: db.InsurancePlanEstablishment,
                        as: "establishments",
                        attributes: [] // We only need the count
                    }
                ],
                attributes: {
                    include: [
                        [
                            db.sequelize.fn("COUNT", db.sequelize.col("establishments.id")),
                            "establishment_count"
                        ]
                    ]
                },
                group: ["InsurancePlan.id", "network.id", "network->company.id", "planSpecialities.id"],
                order: [["created_at", "DESC"]]
            });

            return res.status(200).json(
                new APIResponse(plans, "Insurance plans fetched successfully", 200)
            );

        } catch (err) {
            console.error("Error:", err);
            return res.status(500).json(new APIResponse({}, "Server error", 500));
        }
    }

    // ------------------------------------------------------------
    // GET PLAN BY ID (FULL DETAILS)
    // ------------------------------------------------------------
    async getPlanById(req, res) {
        try {
            const id = req.params.id;

            const plan = await db.InsurancePlan.findOne({
                where: { id },
                include: [
                    {
                        model: db.InsuranceNetwork,
                        as: "network",
                        attributes: ["id", "name"],
                        include: [
                            {
                                model: db.InsuranceCompany,
                                as: "company",
                                attributes: [
                                    "id",
                                    "name",
                                    "logo_url",
                                    "support_hours"
                                ]
                            }
                        ]
                    },
                    {
                        model: db.InsurancePlanEstablishment,
                        as: "establishments",
                        include: [
                            {
                                model: db.Establishment,
                                as: "establishment",
                                attributes: ["id", "name"]
                            }
                        ]
                    },
                    {
                        model: db.InsurancePlanCategory,
                        as: "categories",
                        attributes: [
                            "id",
                            "category_name",
                            "description",
                            "co_payment",
                            "co_payment_info"
                        ],
                        include: [
                            {
                                model: db.InsurancePlanCategoryBenefit,
                                as: "benefits",
                                attributes: ["included", "notes"],
                                include: [
                                    {
                                        model: db.Benefit,
                                        as: "benefit",
                                        attributes: ["id", "name"]
                                    }
                                ]
                            }
                        ]
                    },
                    {
                        model: db.InsuranceSpeciality,
                        as: "planSpecialities",
                        through: { attributes: [] },
                        attributes: ["id", "name", "icon", "description"]
                    }
                ]
            });

            if (!plan) {
                return res.status(404).json(
                    new APIResponse({}, "Plan not found", 404)
                );
            }

            // ------------------------------------------------------------
            // 🔹 RESPONSE (ONLY DB DATA)
            // ------------------------------------------------------------
            const response = {

                // =============================
                // PLAN HEADER
                // =============================
                plan_header: {
                    plan_id: plan.id,
                    plan_name: plan.name,
                    sub_title: plan.sub_title,
                    company: plan.network?.company
                        ? {
                            id: plan.network.company.id,
                            name: plan.network.company.name,
                            logo_url: plan.network.company.logo_url
                        }
                        : null,
                    network: plan.network
                        ? {
                            id: plan.network.id,
                            name: plan.network.name
                        }
                        : null,
                    is_dha_approved: plan.is_dha_approved ?? null
                },

                // =============================
                // KEY HIGHLIGHTS (DERIVED ONLY)
                // =============================
                highlights: {
                    total_cashless_hospitals: plan.establishments?.length || 0,
                    features: plan.features || []
                },

                // =============================
                // COVERAGE OVERVIEW
                // =============================
                coverage_overview: {
                    description: plan.description,
                    annual_limit: plan.annual_limit,
                    area_of_cover: plan.area_of_cover
                },

                // =============================
                // INCLUDED BENEFITS
                // =============================
                included_benefits: plan.categories.map(cat => ({
                    category: cat.category_name,
                    description: cat.description,
                    co_payment: cat.co_payment,
                    co_payment_info: cat.co_payment_info,
                    benefits: cat.benefits.map(b => ({
                        benefit_id: b.benefit?.id,
                        benefit_name: b.benefit?.name,
                        included: b.included,
                        notes: b.notes
                    }))
                })),

                // =============================
                // HOSPITAL NETWORK
                // =============================
                hospital_network: {
                    total: plan.establishments?.length || 0,
                    hospitals: plan.establishments.map(e => ({
                        id: e.establishment?.id,
                        name: e.establishment?.name
                    }))
                },

                // =============================
                // ELIGIBILITY (FROM DB JSON IF EXISTS)
                // =============================
                eligibility: plan.eligibility || null,

                // =============================
                // POLICY TERM
                // =============================
                policy_term: {
                    years: plan.policy_term_years ?? null,
                    renewable: plan.is_renewable ?? null
                },

                // =============================
                // EXCLUSIONS (FROM DB IF EXISTS)
                // =============================
                exclusions: plan.exclusions || [],

                // =============================
                // CASHLESS CLAIM STEPS
                // =============================
                cashless_claims: plan.cashless_claim_steps || [],

                // =============================
                // PRICING
                // =============================
                pricing: {
                    selling_price: plan.selling_price,
                    strike_price: plan.strike_price,
                    cover_amount: plan.cover_amount,
                    discount_text: plan.discount_text
                },

                // =============================
                // SPECIALITIES
                // =============================
                specialities: plan.planSpecialities || [],

                // =============================
                // SUPPORT INFO
                // =============================
                support_info: plan.network?.company
                    ? {
                        phone: plan.network.company.contact_number,
                        email: plan.network.company.email,
                        availability: plan.network.company.support_hours
                    }
                    : null
            };

            return res.status(200).json(
                new APIResponse(response, "Plan details fetched successfully", 200)
            );

        } catch (err) {
            console.error("Error:", err);
            return res.status(500).json(new APIResponse({}, "Server error", 500));
        }
    }



    async getCompanies(req, res) {
        try {
            const companies = await db.InsuranceCompany.findAll({
                attributes: ["id", "name", "logo_url"],
            });

            return res.status(200).json(
                new APIResponse(companies, "Companies fetched", 200)
            );

        } catch (err) {
            console.error(err);
            return res.status(500).json(new APIResponse({}, "Server error", 500));
        }
    }

    async getNetworksByCompany(req, res) {
        try {
            const { company_id } = req.query;

            if (!company_id) {
                return res.status(400).json(new APIResponse({}, "company_id is required", 400));
            }

            const networks = await db.InsuranceNetwork.findAll({
                where: { company_id },
                attributes: ["id", "name"],
                order: [["name", "ASC"]]
            });

            return res.status(200).json(
                new APIResponse(networks, "Networks fetched successfully", 200)
            );

        } catch (err) {
            console.error(err);
            return res.status(500).json(new APIResponse({}, "Server error", 500));
        }
    }

    async getPlansByNetwork(req, res) {
        try {
            const { network_id } = req.query;

            if (!network_id) {
                return res.status(400).json(new APIResponse({}, "network_id is required", 400));
            }

            const plans = await db.InsurancePlan.findAll({
                where: { network_id },
                attributes: ["id", "name", "annual_limit", "area_of_cover"],
                order: [["name", "ASC"]]
            });

            return res.status(200).json(
                new APIResponse(plans, "Plans fetched successfully", 200)
            );

        } catch (err) {
            console.error(err);
            return res.status(500).json(new APIResponse({}, "Server error", 500));
        }
    }

    // ------------------------------------------------------------
    // OCR PARSE: Match company, network, plan from OCR data
    // ------------------------------------------------------------
    async ocrParse(req, res) {
        try {
            const {
                company_name,
                network_name,
                plan_name,
                policy_number,
                policy_holder_name,
                start_date,
                end_date,
                policy_type
            } = req.body;

            // -------------------------------
            // 1. MATCH COMPANY (exact or like)
            // -------------------------------
            let matchedCompany = null;

            if (company_name) {
                matchedCompany = await db.InsuranceCompany.findOne({
                    where: { name: { [Op.like]: `%${company_name}%` } },
                    attributes: ["id", "name"]
                });
            }

            // -------------------------------
            // 2. MATCH NETWORK (only if company matched)
            // -------------------------------
            let matchedNetwork = null;

            if (matchedCompany && network_name) {
                matchedNetwork = await db.InsuranceNetwork.findOne({
                    where: {
                        company_id: matchedCompany.id,
                        name: { [Op.like]: `%${network_name}%` }
                    },
                    attributes: ["id", "name"]
                });
            }

            // -------------------------------
            // 3. MATCH PLAN (only if network matched)
            // -------------------------------
            let matchedPlan = null;

            if (matchedNetwork && plan_name) {
                matchedPlan = await db.InsurancePlan.findOne({
                    where: {
                        network_id: matchedNetwork.id,
                        name: { [Op.like]: `%${plan_name}%` }
                    },
                    attributes: ["id", "name"]
                });
            }

            // -------------------------------
            // Response
            // -------------------------------
            return res.status(200).json(
                new APIResponse(
                    {
                        matched: {
                            company: matchedCompany,
                            network: matchedNetwork,
                            plan: matchedPlan
                        },
                        extracted: {
                            policy_number,
                            policy_holder_name,
                            start_date,
                            end_date,
                            policy_type
                        }
                    },
                    "OCR parsed successfully",
                    200
                )
            );

        } catch (err) {
            console.error("OCR Parse Error:", err);
            return res.status(500).json(new APIResponse({}, "Server error", 500));
        }
    }

    async getInsuranceSpecialities(req, res) {
        try {
            const specialities = await db.InsuranceSpeciality.findAll({
                attributes: ["id", "name", "icon", "description"],
                order: [["name", "ASC"]]
            });
            return res.status(200).json(
                new APIResponse(specialities, "Specialities fetched successfully", 200)
            );
        } catch (err) {
            console.error("Error:", err);
            return res.status(500).json(new APIResponse({}, "Server error", 500));
        }
    }

    async getInsuranceSpecialityById(req, res) {
        try {
            const id = req.params.id;
            const speciality = await db.InsuranceSpeciality.findOne({
                where: { id },
                attributes: ["id", "name", "icon", "description"],
                include: [
                    {
                        model: db.InsurancePlan,
                        as: "specialityPlans",
                        through: { attributes: [] }, // Exclude junction table data
                        attributes: ['id', 'name', 'annual_limit', 'area_of_cover'],
                        include: [
                            {
                                model: db.InsuranceNetwork,
                                as: "network",
                                attributes: ['id', 'name'],
                                include: [
                                    {
                                        model: db.InsuranceCompany,
                                        as: "company",
                                        attributes: ['id', 'name', 'logo_url']
                                    }
                                ]
                            }
                        ]
                    }
                ]
            });
            if (!speciality) {
                return res.status(404).json(
                    new APIResponse({}, "Speciality not found", 404)
                );
            }
            return res.status(200).json(
                new APIResponse(speciality, "Speciality fetched successfully", 200)
            );
        }
        catch (err) {
            console.error("Error:", err);
            return res.status(500).json(new APIResponse({}, "Server error", 500));
        }
    }

    async createLead(req, res) {
        try {
            const { error, value } = userValidator.createLeadValidator.validate(req.body, {
                abortEarly: false
            });

            if (error) {
                return res.status(httpStatus.BAD_REQUEST).json(
                    new APIResponse({}, error.details.map(d => d.message), httpStatus.BAD_REQUEST)
                );
            }

            const {
                lead_type,
                members,
                family_details,
                city,
                surgical_history,
                medical_history,
                phone,
                email
            } = value;

            // 🔒 Extra safety: ensure members & family_details match
            const memberTypes = members.sort();
            const detailTypes = family_details.map(d => d.type).sort();

            if (JSON.stringify(memberTypes) !== JSON.stringify(detailTypes)) {
                return res.status(httpStatus.BAD_REQUEST).json(
                    new APIResponse({}, "Members and family details mismatch", httpStatus.BAD_REQUEST)
                );
            }

            const lead = await db.InsuranceLead.create({
                customer_id: req.user?.id || null,
                lead_type,
                status: "New",
                family_details,
                city,
                surgical_history,
                medical_history,
                phone,
                email
            });

            return res.status(httpStatus.CREATED).json(
                new APIResponse(
                    { lead_id: lead.id },
                    "Lead created successfully",
                    httpStatus.CREATED
                )
            );

        } catch (err) {
            console.error("Create lead error:", err);
            return res.status(httpStatus.INTERNAL_SERVER_ERROR).json(
                new APIResponse({}, "Server error", httpStatus.INTERNAL_SERVER_ERROR)
            );
        }
    }


    // Handles multi-step updates
    // async updateLead(req, res) {
    //     try {
    //         const { lead_id } = req.params;
    //         const {
    //             step, // "items_selection", "ages", "emirate", "medical_history"
    //             selected_members, // Step 1: ["self", "spouse", "son", "daughter"]
    //             member_ages,      // Step 2: [{ type: "self", age: 30 }, { type: "son", age: 5, index: 1 }]
    //             city,             // Step 3
    //             surgical_history, // Step 3
    //             medical_history,  // Step 4: ["Diabetes", "Thyroid"]
    //             phone,
    //             email
    //         } = req.body;

    //         const lead = await db.InsuranceLead.findByPk(lead_id);
    //         if (!lead) {
    //             return res.status(httpStatus.NOT_FOUND).json(new APIResponse({}, "Lead not found", httpStatus.NOT_FOUND));
    //         }

    //         let nextStep = "complete";
    //         let validationSchema;

    //         // --------------------------------------------------------
    //         // STEP 1: SELECT MEMBERS
    //         // --------------------------------------------------------
    //         if (step === "items_selection") {
    //             validationSchema = Joi.object({
    //                 selected_members: Joi.array().items(
    //                     Joi.string().valid("self", "wife", "husband", "spouse", "son", "daughter", "father", "mother", "father_in_law", "mother_in_law", "grand_mother", "grand_father")
    //                 ).min(1).required()
    //             });

    //             nextStep = "ages";

    //             // Reset family details based on selection, preserving ages if already set? 
    //             // For now, simpler to overwrite or initialize structure.
    //             if (!validationSchema.validate({ selected_members }).error) {
    //                 // Initialize family_details array with structure for next step
    //                 const currentDetails = lead.family_details || [];
    //                 const newDetails = selected_members.map(memberType => {
    //                     // Check if we already have data for this type to preserve it?
    //                     // For simplicity, we create fresh entries or try to match.
    //                     return { type: memberType, age: null };
    //                 });
    //                 lead.family_details = newDetails;
    //                 lead.status = "ages"; // Move status forward
    //             }
    //         }

    //         // --------------------------------------------------------
    //         // STEP 2: ENTER AGES
    //         // --------------------------------------------------------
    //         else if (step === "ages") {
    //             validationSchema = Joi.object({
    //                 member_ages: Joi.array().items(
    //                     Joi.object({
    //                         type: Joi.string().required(),
    //                         age: Joi.number().integer().min(0).max(120).required(),
    //                         index: Joi.number().optional() // In case of multiple sons/daughters
    //                     })
    //                 ).required()
    //             });

    //             nextStep = "emirate";

    //             if (!validationSchema.validate({ member_ages }).error) {
    //                 // Update ages in family_details
    //                 // Assuming member_ages maps correctly to family_details
    //                 // We simply replace family_details with this richer data if it covers everyone

    //                 // Better approach: Merge
    //                 let details = lead.family_details || [];
    //                 // We expect member_ages to provide age for the types in details.

    //                 // Simplification: Just trust the frontend sends the full array or updates
    //                 // Let's assume member_ages IS the full new state of family_details with ages
    //                 lead.family_details = member_ages;
    //                 lead.status = "emirate";
    //             }
    //         }

    //         // --------------------------------------------------------
    //         // STEP 3: EMIRATE & SURGERY
    //         // --------------------------------------------------------
    //         else if (step === "emirate") {
    //             validationSchema = Joi.object({
    //                 city: Joi.string().required(),
    //                 surgical_history: Joi.boolean().required()
    //             });

    //             nextStep = "medical_history";

    //             if (!validationSchema.validate({ city, surgical_history }).error) {
    //                 lead.city = city;
    //                 lead.surgical_history = surgical_history;
    //                 lead.status = "medical_history";
    //             }
    //         }

    //         // --------------------------------------------------------
    //         // STEP 4: MEDICAL HISTORY (FINAL)
    //         // --------------------------------------------------------
    //         else if (step === "medical_history") {
    //             validationSchema = Joi.object({
    //                 medical_history: Joi.array().items(Joi.string()).optional(),
    //                 phone: Joi.string().optional(), // Might be collected here or earlier
    //                 email: Joi.string().optional()
    //             });

    //             nextStep = "complete";

    //             if (!validationSchema.validate({ medical_history }).error) {
    //                 lead.medical_history = medical_history || [];
    //                 if (phone) lead.phone = phone;
    //                 if (email) lead.email = email;
    //                 lead.status = "complete";
    //             }
    //         }
    //         else {
    //             return res.status(httpStatus.BAD_REQUEST).json(new APIResponse({}, "Invalid step provided", 400));
    //         }

    //         // Execute Validation
    //         const { error } = validationSchema.validate(req.body, { allowUnknown: true });
    //         if (error) {
    //             return res.status(httpStatus.BAD_REQUEST).json(new APIResponse({}, error.message, httpStatus.BAD_REQUEST));
    //         }

    //         await lead.save();

    //         return res.status(httpStatus.OK).json(
    //             new APIResponse(
    //                 { lead_id: lead.id, next_step: nextStep, lead_data: lead },
    //                 "Lead updated successfully",
    //                 httpStatus.OK
    //             )
    //         );
    //     } catch (err) {
    //         console.error("Update lead error:", err);
    //         return res.status(httpStatus.INTERNAL_SERVER_ERROR).json(new APIResponse({}, "Server error", httpStatus.INTERNAL_SERVER_ERROR));
    //     }
    // }

}

export default new InsuranceController();




//     try {
//       const { search_text, is_top_insurance } = req.query;

//       const whereClause = {};
//       if (search_text) {
//         whereClause.name = { [Op.iLike]: `%${search_text}%` };
//       }
//       if (is_top_insurance) {
//         whereClause.is_top_insurance = 1;
//       }

//       const insuranceProviders = await db.Insurance.findAll({
//         where: whereClause,
//         include: [
//           {
//             model: db.InsurancePlan,
//             as: 'planList',
//             attributes: ['id', 'name', 'created_by']
//           }
//         ],
//         order: [['name', 'ASC']]
//       });

//       return res
//         .status(httpStatus.OK)
//         .json(new APIResponse(insuranceProviders, 'Insurance providers fetched successfully.', httpStatus.OK));
//     } catch (error) {
//       console.error('getInsuranceProviders error:', error);
//       return res
//         .status(httpStatus.INTERNAL_SERVER_ERROR)
//         .json(new APIResponse([], 'Something went wrong.', httpStatus.INTERNAL_SERVER_ERROR));
//     }
//   }

//   // Get insurance plans by provider ID
//   async getInsurancePlans(req, res) {
//     try {
//       const { insurance_id } = req.params;

//       const plans = await db.InsurancePlan.findAll({
//         where: { insurance_id },
//         order: [['name', 'ASC']]
//       });

//       return res
//         .status(httpStatus.OK)
//         .json(new APIResponse(plans, 'Insurance plans fetched successfully.', httpStatus.OK));
//     } catch (error) {
//       console.error('getInsurancePlans error:', error);
//       return res
//         .status(httpStatus.INTERNAL_SERVER_ERROR)
//         .json(new APIResponse([], 'Something went wrong.', httpStatus.INTERNAL_SERVER_ERROR));
//     }
//   }

//   // Add or update customer insurance
//  // Add or update customer insurance
// async addUpdateCustomerInsurance(req, res) {
//   try {
//     const {
//       insurance_id,
//       plan_id,
//       policy_number,
//       policy_holder_name,
//       policy_type,
//       premium_amount,
//       coverage_amount,
//       start_date,
//       end_date,
//       status = 1
//     } = req.body;

//     const customer_id = req.user?.id || req.body.customer_id;
//     const id = req.params.id; // Extract id from URL params

//     if (!customer_id) {
//       return res
//         .status(httpStatus.BAD_REQUEST)
//         .json(new APIResponse({}, 'Customer ID is required.', httpStatus.BAD_REQUEST));
//     }

//     // Validate required fields
//     if (!insurance_id || !policy_number || !policy_holder_name) {
//       return res
//         .status(httpStatus.BAD_REQUEST)
//         .json(new APIResponse({}, 'Insurance provider, policy number, and policy holder name are required.', httpStatus.BAD_REQUEST));
//     }

//     // Check if customer exists
//     const customer = await db.Customer.findByPk(customer_id);
//     if (!customer) {
//       return res
//         .status(httpStatus.NOT_FOUND)
//         .json(new APIResponse({}, 'Customer not found.', httpStatus.NOT_FOUND));
//     }

//     // Validate insurance and plan exist
//     const insurance = await db.Insurance.findByPk(insurance_id);
//     if (!insurance) {
//       return res
//         .status(httpStatus.NOT_FOUND)
//         .json(new APIResponse({}, 'Insurance provider not found.', httpStatus.NOT_FOUND));
//     }

//     if (plan_id) {
//       const plan = await db.InsurancePlan.findOne({
//         where: { id: plan_id, insurance_id }
//       });
//       if (!plan) {
//         return res
//           .status(httpStatus.NOT_FOUND)
//           .json(new APIResponse({}, 'Insurance plan not found for this provider.', httpStatus.NOT_FOUND));
//       }
//     }

//     const insuranceData = {
//       customer_id,
//       insurance_id,
//       plan_id,
//       policy_number,
//       policy_holder_name,
//       policy_type,
//       premium_amount,
//       coverage_amount,
//       start_date,
//       end_date,
//       status
//     };

//     let result;
//     let message;

//     if (id && +id > 0) {
//       // Update existing insurance
//       const existingInsurance = await db.CustomerInsurance.findOne({
//         where: { id, customer_id }
//       });

//       if (!existingInsurance) {
//         return res
//           .status(httpStatus.NOT_FOUND)
//           .json(new APIResponse({}, 'Customer insurance record not found.', httpStatus.NOT_FOUND));
//       }

//       await db.CustomerInsurance.update(insuranceData, {
//         where: { id, customer_id }
//       });

//       result = await db.CustomerInsurance.findOne({
//         where: { id, customer_id },
//         include: [
//           {
//             model: db.Insurance,
//             as: 'insuranceInfo',
//             attributes: ['id', 'name', 'logo', 'description']
//           },
//           {
//             model: db.InsurancePlan,
//             as: 'planInfo',
//             attributes: ['id', 'name']
//           }
//         ]
//       });

//       message = 'Insurance updated successfully.';
//     } else {
//       // Check if customer already has insurance (optional business rule)
//       // const existingInsurance = await db.CustomerInsurance.findOne({
//       //   where: { customer_id }
//       // });

//       // if (existingInsurance) {
//       //   return res
//       //     .status(httpStatus.CONFLICT)
//       //     .json(new APIResponse({}, 'Customer already has an insurance policy. Use update to modify it.', httpStatus.CONFLICT));
//       // }

//       // Create new insurance
//       result = await db.CustomerInsurance.create(insuranceData);

//       // Fetch with relations
//       result = await db.CustomerInsurance.findOne({
//         where: { id: result.id },
//         include: [
//           {
//             model: db.Insurance,
//             as: 'insuranceInfo',
//             attributes: ['id', 'name', 'logo', 'description']
//           },
//           {
//             model: db.InsurancePlan,
//             as: 'planInfo',
//             attributes: ['id', 'name']
//           }
//         ]
//       });

//       message = 'Insurance added successfully.';
//     }

//     return res
//       .status(httpStatus.OK)
//       .json(new APIResponse(result, message, httpStatus.OK));
//   } catch (error) {
//     console.error('addUpdateCustomerInsurance error:', error);
//     return res
//       .status(httpStatus.INTERNAL_SERVER_ERROR)
//       .json(new APIResponse([], 'Something went wrong.', httpStatus.INTERNAL_SERVER_ERROR));
//   }
// }

//   // Get customer insurance info
//   async getCustomerInsurance(req, res) {
//     try {
//       const customer_id = req.user?.id || req.params.customer_id;

//       if (!customer_id) {
//         return res
//           .status(httpStatus.BAD_REQUEST)
//           .json(new APIResponse({}, 'Customer ID is required.', httpStatus.BAD_REQUEST));
//       }

//       const customerInsurance = await db.CustomerInsurance.findOne({
//         where: { customer_id },
//         include: [
//           {
//             model: db.Insurance,
//             as: 'insuranceInfo',
//             attributes: ['id', 'name', 'logo', 'description', 'third_party_administrator']
//           },
//           {
//             model: db.InsurancePlan,
//             as: 'planInfo',
//             attributes: ['id', 'name']
//           }
//         ]
//       });

//       if (!customerInsurance) {
//         return res
//           .status(httpStatus.NOT_FOUND)
//           .json(new APIResponse({}, 'No insurance found for this customer.', httpStatus.NOT_FOUND));
//       }

//       return res
//         .status(httpStatus.OK)
//         .json(new APIResponse(customerInsurance, 'Customer insurance info fetched successfully.', httpStatus.OK));
//     } catch (error) {
//       console.error('getCustomerInsurance error:', error);
//       return res
//         .status(httpStatus.INTERNAL_SERVER_ERROR)
//         .json(new APIResponse([], 'Something went wrong.', httpStatus.INTERNAL_SERVER_ERROR));
//     }
//   }

//   // Delete customer insurance
//   async deleteCustomerInsurance(req, res) {
//     try {
//       const customer_id = req.user?.id || req.body.customer_id;
//       const { id } = req.params;

//       if (!customer_id) {
//         return res
//           .status(httpStatus.BAD_REQUEST)
//           .json(new APIResponse({}, 'Customer ID is required.', httpStatus.BAD_REQUEST));
//       }

//       const whereClause = { customer_id };
//       if (id) {
//         whereClause.id = id;
//       }

//       const deleted = await db.CustomerInsurance.destroy({
//         where: whereClause
//       });

//       if (deleted === 0) {
//         return res
//           .status(httpStatus.NOT_FOUND)
//           .json(new APIResponse({}, 'Insurance record not found.', httpStatus.NOT_FOUND));
//       }

//       return res
//         .status(httpStatus.OK)
//         .json(new APIResponse({}, 'Insurance deleted successfully.', httpStatus.OK));
//     } catch (error) {
//       console.error('deleteCustomerInsurance error:', error);
//       return res
//         .status(httpStatus.INTERNAL_SERVER_ERROR)
//         .json(new APIResponse([], 'Something went wrong.', httpStatus.INTERNAL_SERVER_ERROR));
//     }
//   }

//   // Submit insurance enquiry
//   async submitInsuranceEnquiry(req, res) {
//     try {
//       const {
//         insurance_id,
//         name,
//         email,
//         phone_code,
//         phone_number,
//         birth_date
//       } = req.body;

//       // Validate required fields
//       if (!name || !email || !phone_code || !phone_number || !birth_date) {
//         return res
//           .status(httpStatus.BAD_REQUEST)
//           .json(new APIResponse({}, 'All fields are required.', httpStatus.BAD_REQUEST));
//       }

//       // Validate insurance exists if provided
//       if (insurance_id) {
//         const insurance = await db.Insurance.findByPk(insurance_id);
//         if (!insurance) {
//           return res
//             .status(httpStatus.NOT_FOUND)
//             .json(new APIResponse({}, 'Insurance provider not found.', httpStatus.NOT_FOUND));
//         }
//       }

//       const enquiry = await db.InsuranceEnquiry.create({
//         insurance_id,
//         name,
//         email,
//         phone_code,
//         phone_number,
//         birth_date
//       });

//       // Fetch with insurance info
//       const enquiryWithInfo = await db.InsuranceEnquiry.findOne({
//         where: { id: enquiry.id },
//         include: [
//           {
//             model: db.Insurance,
//             as: 'insuranceInfo',
//             attributes: ['id', 'name', 'logo']
//           }
//         ]
//       });

//       return res
//         .status(httpStatus.OK)
//         .json(new APIResponse(enquiryWithInfo, 'Insurance enquiry submitted successfully.', httpStatus.OK));
//     } catch (error) {
//       console.error('submitInsuranceEnquiry error:', error);
//       return res
//         .status(httpStatus.INTERNAL_SERVER_ERROR)
//         .json(new APIResponse([], 'Something went wrong.', httpStatus.INTERNAL_SERVER_ERROR));
//     }
//   }

//   // Verify insurance card (OCR simulation)
//   async verifyInsuranceCard(req, res) {
//     try {
//       const { image_base64 } = req.body;

//       if (!image_base64) {
//         return res
//           .status(httpStatus.BAD_REQUEST)
//           .json(new APIResponse({}, 'Insurance card image is required.', httpStatus.BAD_REQUEST));
//       }

//       // Simulate OCR processing
//       // In real implementation, you would integrate with OCR service
//       const mockOcrResult = {
//         policy_number: "POL123456789",
//         policy_holder_name: "John Doe",
//         insurance_provider: "ABC Health Insurance",
//         plan_type: "Premium",
//         expiry_date: "2025-12-31",
//         confidence: 0.85
//       };

//       // Try to match with existing insurance providers
//       const matchedInsurance = await db.Insurance.findOne({
//         where: {
//           name: { [Op.iLike]: `%${mockOcrResult.insurance_provider}%` }
//         },
//         include: [
//           {
//             model: db.InsurancePlan,
//             as: 'planList',
//             where: {
//               name: { [Op.iLike]: `%${mockOcrResult.plan_type}%` }
//             },
//             required: false
//           }
//         ]
//       });

//       const result = {
//         extracted_data: mockOcrResult,
//         matched_provider: matchedInsurance,
//         verification_status: matchedInsurance ? 'verified' : 'manual_review_required'
//       };

//       return res
//         .status(httpStatus.OK)
//         .json(new APIResponse(result, 'Insurance card processed successfully.', httpStatus.OK));
//     } catch (error) {
//       console.error('verifyInsuranceCard error:', error);
//       return res
//         .status(httpStatus.INTERNAL_SERVER_ERROR)
//         .json(new APIResponse([], 'Something went wrong.', httpStatus.INTERNAL_SERVER_ERROR));
//     }
//   }

//   // Get insurance coverage details for establishments
//   async getInsuranceCoverage(req, res) {
//     try {
//       const { insurance_id, establishment_id } = req.query;

//       if (!insurance_id) {
//         return res
//           .status(httpStatus.BAD_REQUEST)
//           .json(new APIResponse({}, 'Insurance ID is required.', httpStatus.BAD_REQUEST));
//       }

//       const whereClause = { insurance_id };
//       if (establishment_id) {
//         whereClause.establishment_id = establishment_id;
//       }

//       const coverage = await db.InsuranceEstablishment.findAll({
//         where: whereClause,
//         include: [
//           {
//             model: db.Insurance,
//             as: 'insuranceInfo',
//             attributes: ['id', 'name', 'logo']
//           },
//           {
//             model: db.Establishment,
//             as: 'establishmentInfo',
//             attributes: ['id', 'name', 'address', 'latitude', 'longitude']
//           }
//         ]
//       });

//       return res
//         .status(httpStatus.OK)
//         .json(new APIResponse(coverage, 'Insurance coverage details fetched successfully.', httpStatus.OK));
//     } catch (error) {
//       console.error('getInsuranceCoverage error:', error);
//       return res
//         .status(httpStatus.INTERNAL_SERVER_ERROR)
//         .json(new APIResponse([], 'Something went wrong.', httpStatus.INTERNAL_SERVER_ERROR));
//     }
//   }

//   // Validate insurance for booking
//   async validateInsuranceForBooking(req, res) {
//     try {
//       const {
//         customer_id,
//         establishment_id,
//         service_id,
//         estimated_amount
//       } = req.body;

//       if (!customer_id || !establishment_id) {
//         return res
//           .status(httpStatus.BAD_REQUEST)
//           .json(new APIResponse({}, 'Customer ID and Establishment ID are required.', httpStatus.BAD_REQUEST));
//       }

//       // Get customer insurance
//       const customerInsurance = await db.CustomerInsurance.findOne({
//         where: { customer_id },
//         include: [
//           {
//             model: db.Insurance,
//             as: 'insuranceInfo'
//           },
//           {
//             model: db.InsurancePlan,
//             as: 'planInfo'
//           }
//         ]
//       });

//       if (!customerInsurance) {
//         return res
//           .status(httpStatus.OK)
//           .json(new APIResponse({
//             is_covered: false,
//             message: 'No insurance found for customer'
//           }, 'Insurance validation completed.', httpStatus.OK));
//       }

//       // Check if establishment accepts this insurance
//       const establishmentInsurance = await db.InsuranceEstablishment.findOne({
//         where: {
//           insurance_id: customerInsurance.insurance_id,
//           establishment_id
//         }
//       });

//       if (!establishmentInsurance) {
//         return res
//           .status(httpStatus.OK)
//           .json(new APIResponse({
//             is_covered: false,
//             message: 'This establishment does not accept your insurance',
//             customer_insurance: customerInsurance
//           }, 'Insurance validation completed.', httpStatus.OK));
//       }

//       // Calculate coverage (simplified logic)
//       const coverage_percentage = 80; // This should come from plan details
//       const covered_amount = estimated_amount ? (estimated_amount * coverage_percentage / 100) : 0;
//       const patient_responsibility = estimated_amount ? (estimated_amount - covered_amount) : 0;

//       const result = {
//         is_covered: true,
//         customer_insurance: customerInsurance,
//         coverage_details: {
//           coverage_percentage,
//           estimated_amount,
//           covered_amount,
//           patient_responsibility
//         },
//         message: 'Insurance is valid and accepted'
//       };

//       return res
//         .status(httpStatus.OK)
//         .json(new APIResponse(result, 'Insurance validation completed.', httpStatus.OK));
//     } catch (error) {
//       console.error('validateInsuranceForBooking error:', error);
//       return res
//         .status(httpStatus.INTERNAL_SERVER_ERROR)
//         .json(new APIResponse([], 'Something went wrong.', httpStatus.INTERNAL_SERVER_ERROR));
//     }
//   }
// }
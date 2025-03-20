const handlers = require("./handelerFactory");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const knex = require("../config/db");

/**
 * Get all commodities with optional filtering and pagination
 */
// exports.getAllPack = catchAsync(async (req, res, next) => {
//   try {
//     // Get pagination parameters
//     const page = parseInt(req.query.page) || 1;
//     const limit = parseInt(req.query.limit) || 10;
//     const offset = (page - 1) * limit;

//     // Transaction for consistency
//     const result = await knex.transaction(async (trx) => {
//       // Get total count for pagination
//       const countQuery = trx("dba.wms_app_pack")
//         .count("* as count")
//         .timeout(5000);

//       // Apply search filter if provided
//       if (req.query.search) {
//         countQuery.where(function () {
//           this.whereILike("company", `%${req.query.search}%`)
//             .orWhereILike("entity_code", `%${req.query.search}%`)
//             .orWhereILike("partner_code", `%${req.query.search}%`)
//             .orWhereILike("commodity", `%${req.query.search}%`);
//         });
//       }

//       // Apply specific filters if provided
//       if (req.query.company) {
//         countQuery.where("company", req.query.company);
//       }
//       if (req.query.entity_code) {
//         countQuery.where("entity_code", req.query.entity_code);
//       }
//       if (req.query.partner_code) {
//         countQuery.where("partner_code", req.query.partner_code);
//       }

//       // Execute count query
//       const [{ count }] = await countQuery;

//       // Fetch commodities with pagination
//       const commoditiesQuery = trx("dba.wms_app_pack")
//         .select("*")
//         .orderBy(req.query.sort_by || "create_date", req.query.sort_order || "desc")
//         .limit(limit)
//         .offset(offset)
//         .timeout(5000);

//       // Apply search filter if provided
//       if (req.query.search) {
//         commoditiesQuery.where(function () {
//           this.whereILike("company", `%${req.query.search}%`)
//             .orWhereILike("entity_code", `%${req.query.search}%`)
//             .orWhereILike("warehouse_code", `%${req.query.search}%`)
//             .orWhereILike("order_ref", `%${req.query.search}%`);
//         });
//       }

//       // Apply specific filters if provided
//       if (req.query.company) {
//         commoditiesQuery.where("company", req.query.company);
//       }
//       if (req.query.entity_code) {
//         commoditiesQuery.where("entity_code", req.query.entity_code);
//       }
//       if (req.query.warehouse_code) {
//         commoditiesQuery.where("warehouse_code", req.query.warehouse_code);
//       }
//       if (req.query.order_ref) {
//         commoditiesQuery.where("order_ref", req.query.order_ref);
//       }

//       const commodities = await commoditiesQuery;

//       return { count, commodities };
//     });

//     // Send response
//     res.status(200).json({
//       status: "success",
//       results: parseInt(result.count),
//       page,
//       limit,
//       data: result.commodities,
//     });
//   } catch (error) {
//     console.error("Error in getAllCommodities:", error);
//     next(new AppError(error.message || "Failed to fetch commodities", 500));
//   }
// });
exports.getAllPack = handlers.getAll("dba.wms_app_pack");

exports.createPack = handlers.createOne("dba.wms_app_pack");
exports.getPack = handlers.getOne("dba.wms_app_pack", "pack_id");
exports.deletePack = handlers.deleteOne("dba.wms_app_pack", "pack_id");
exports.updatePack= handlers.updateOne("dba.wms_app_pack", "pack_id");


const handlers = require("./handelerFactory");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const knex = require("../config/db");

/**
 * Get all commodities with optional filtering and pagination
 */
exports.getAllCommodities = catchAsync(async (req, res, next) => {
  try {
    // Get pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Transaction for consistency
    const result = await knex.transaction(async (trx) => {
      // Get total count for pagination
      const countQuery = trx("dba.wms_commodity")
        .count("* as count")
        .timeout(5000);

      // Apply search filter if provided
      if (req.query.search) {
        countQuery.where(function () {
          this.whereILike("company", `%${req.query.search}%`)
            .orWhereILike("entity_code", `%${req.query.search}%`)
            .orWhereILike("partner_code", `%${req.query.search}%`)
            .orWhereILike("commodity", `%${req.query.search}%`);
        });
      }

      // Apply specific filters if provided
      if (req.query.company) {
        countQuery.where("company", req.query.company);
      }
      if (req.query.entity_code) {
        countQuery.where("entity_code", req.query.entity_code);
      }
      if (req.query.partner_code) {
        countQuery.where("partner_code", req.query.partner_code);
      }

      // Execute count query
      const [{ count }] = await countQuery;

      // Fetch commodities with pagination
      const commoditiesQuery = trx("dba.wms_commodity")
        .select("*")
        .orderBy(req.query.sort_by || "create_date", req.query.sort_order || "desc")
        .limit(limit)
        .offset(offset)
        .timeout(5000);

      // Apply search filter if provided
      if (req.query.search) {
        commoditiesQuery.where(function () {
          this.whereILike("company", `%${req.query.search}%`)
            .orWhereILike("entity_code", `%${req.query.search}%`)
            .orWhereILike("partner_code", `%${req.query.search}%`)
            .orWhereILike("commodity", `%${req.query.search}%`);
        });
      }

      // Apply specific filters if provided
      if (req.query.company) {
        commoditiesQuery.where("company", req.query.company);
      }
      if (req.query.entity_code) {
        commoditiesQuery.where("entity_code", req.query.entity_code);
      }
      if (req.query.partner_code) {
        commoditiesQuery.where("partner_code", req.query.partner_code);
      }

      const commodities = await commoditiesQuery;

      return { count, commodities };
    });

    // Send response
    res.status(200).json({
      status: "success",
      results: parseInt(result.count),
      page,
      limit,
      data: result.commodities,
    });
  } catch (error) {
    console.error("Error in getAllCommodities:", error);
    next(new AppError(error.message || "Failed to fetch commodities", 500));
  }
});

exports.createCommodity = handlers.createOne("dba.wms_commodity");
exports.getCommodity = handlers.getOne("dba.wms_commodity", "commodity");
exports.deleteCommodity = handlers.deleteOne("dba.wms_commodity", "commodity");
exports.updateCommodity= handlers.updateOne("dba.wms_commodity", "commodity");

//   try {
//     const { id } = req.params;
    
//     // Parse the ID to extract composite key components
//     // Format expected: company_entityCode_partnerCode_commodity
//     const [company, entity_code, partner_code, commodity] = id.split('_');
    
//     if (!company || !entity_code || !partner_code || !commodity) {
//       return next(new AppError("Invalid commodity ID format", 400));
//     }

//     // Check if the commodity exists
//     const commodityRecord = await knex("dba.wms_commodity")
//       .where({
//         company,
//         entity_code,
//         partner_code,
//         commodity
//       })
//       .first();

//     if (!commodityRecord) {
//       return next(new AppError("Commodity not found", 404));
//     }

//     // Delete the commodity
//     await knex("dba.wms_commodity")
//       .where({
//         company,
//         entity_code,
//         partner_code,
//         commodity
//       })
//       .del();

//     res.status(204).json({
//       status: "success",
//       data: null,
//     });
//   } catch (error) {
//     console.error("Error deleting commodity:", error);
//     next(new AppError(error.message || "Failed to delete commodity", 500));
//   }
// });
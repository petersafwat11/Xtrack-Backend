const handlers = require("./handelerFactory");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const knex = require("../config/db");

// exports.createCharge = handlers.createOne("dba.qru_charges");

exports.createCharge = catchAsync(async (req, res, next) => {
  // Ensure the surcharge key is an array
  const { surcharges } = req.body;

  // If surcharge is not an array, convert it to an array
  const surchargeArray = Array.isArray(surcharges) ? surcharges : [surcharges];

  // Create a new surcharge type in the database
  const [newSurchargeType] = await knex("dba.qru_charges")
    .insert({
      ...req.body,
      surcharges: surchargeArray, // Use the formatted array
    })
    .returning("*");

  res.status(201).json({
    status: "success",
    data: {
      data: newSurchargeType,
    },
  });
});

exports.getAllCharges = handlers.getAll("dba.qru_charges");
exports.getCharge = handlers.getOne("dba.qru_charges");
exports.updateCharge = handlers.updateOne("dba.qru_charges");
exports.deleteCharge = handlers.deleteOne("dba.qru_charges");

exports.getAllTerms = handlers.getAll("dba.qru_charges_terms_and_conditions");
exports.getTerm = handlers.getOne("dba.qru_charges_terms_and_conditions");
exports.createTerm = handlers.createOne("dba.qru_charges_terms_and_conditions");
exports.updateTerm = handlers.updateOne("dba.qru_charges_terms_and_conditions");
exports.deleteTerm = handlers.deleteOne("dba.qru_charges_terms_and_conditions");

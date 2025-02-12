const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const knex = require("../config/db");
const APIFeatures = require("../utils/apiFeatures");

exports.getAll = (tableName) =>
  catchAsync(async (req, res, next) => {
    const features = new APIFeatures(knex(tableName), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();

    const resultsCount = await knex(tableName).count("*");
    const doc = await features.query;

    res.status(200).json({
      status: "success",
      results: resultsCount[0].count,
      data: {
        data: doc,
      },
    });
  });

exports.deleteOne = (tableName) =>
  catchAsync(async (req, res, next) => {
    const deleted = await knex(tableName).where({ id: req.params.id }).del();

    if (!deleted) {
      return next(new AppError("No document found with that ID", 404));
    }

    res.status(204).json({
      status: "success",
      data: null,
    });
  });

exports.deleteMany = (tableName) =>
  catchAsync(async (req, res, next) => {
    const deleted = await knex(tableName).whereIn("id", req.body).del();

    if (!deleted) {
      return next(
        new AppError("No document found to delete for one or more IDs", 404)
      );
    }

    res.status(204).json({
      status: "success",
      data: null,
    });
  });

exports.updateOne = (tableName) =>
  catchAsync(async (req, res, next) => {
    const updated = await knex(tableName)
      .where({ id: req.params.id })
      .update(req.body)
      .returning("*");

    if (!updated.length) {
      return next(new AppError(`No document found with that ID`, 404));
    }

    res.status(200).json({
      status: "success",
      data: {
        data: updated[0],
      },
    });
  });

exports.createOne = (tableName) =>
  catchAsync(async (req, res, next) => {
    const created = await knex(tableName).insert(req.body).returning("*");

    res.status(201).json({
      status: "success",
      data: {
        data: created[0],
      },
    });
  });

exports.getOne = (tableName) =>
  catchAsync(async (req, res, next) => {
    const doc = await knex(tableName).where({ id: req.params.id }).first();

    if (!doc) {
      return next(new AppError("No document found with that ID", 404));
    }

    res.status(200).json({
      status: "success",
      data: {
        data: doc,
      },
    });
  });

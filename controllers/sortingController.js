const handlers = require("./handelerFactory");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const knex = require("../config/db");

exports.getAllSorting = handlers.getAll("dba.wms_app_sorting");

exports.createSorting = handlers.createOne("dba.wms_app_sorting");
exports.getSorting = handlers.getOne("dba.wms_app_sorting", "sort_id");
exports.deleteSorting = handlers.deleteOne("dba.wms_app_sorting", "sort_id");
exports.updateSorting= handlers.updateOne("dba.wms_app_sorting", "sort_id");

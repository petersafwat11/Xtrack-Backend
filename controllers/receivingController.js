const handlers = require("./handelerFactory");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const knex = require("../config/db");

exports.getAllReceiving = handlers.getAll("dba.wms_app_receiving");

exports.createReceiving = handlers.createOne("dba.wms_app_receiving");
exports.getReceiving = handlers.getOne("dba.wms_app_receiving", "rec_id");
exports.deleteReceiving = handlers.deleteOne("dba.wms_app_receiving", "rec_id");
exports.updateReceiving= handlers.updateOne("dba.wms_app_receiving", "rec_id");

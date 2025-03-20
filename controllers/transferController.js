const handlers = require("./handelerFactory");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const knex = require("../config/db");

exports.getAllTransfer = handlers.getAll("dba.wms_app_transfer");

exports.createTransfer = handlers.createOne("dba.wms_app_transfer");
exports.getTransfer = handlers.getOne("dba.wms_app_transfer", "transfer_id");
exports.deleteTransfer = handlers.deleteOne("dba.wms_app_transfer", "transfer_id");
exports.updateTransfer= handlers.updateOne("dba.wms_app_transfer", "transfer_id");


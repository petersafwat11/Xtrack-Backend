const handlers = require("./handelerFactory");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const knex = require("../config/db");


exports.getAllPut = handlers.getAll("dba.wms_app_putaway");
exports.createPut = handlers.createOne("dba.wms_app_putaway");
exports.getPut = handlers.getOne("dba.wms_app_putaway", "put_id");
exports.deletePut = handlers.deleteOne("dba.wms_app_putaway", "put_id");
exports.updatePut= handlers.updateOne("dba.wms_app_putaway", "put_id");


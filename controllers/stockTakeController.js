const handlers = require("./handelerFactory");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const knex = require("../config/db");

exports.getAllStockTake = handlers.getAll("dba.wms_app_stock_take");
exports.createStockTake = handlers.createOne("dba.wms_app_stock_take");
exports.getStockTake = handlers.getOne("dba.wms_app_stock_take", "stock_take_id");
exports.deleteStockTake = handlers.deleteOne("dba.wms_app_stock_take", "stock_take_id");
exports.updateStockTake= handlers.updateOne("dba.wms_app_stock_take", "stock_take_id");

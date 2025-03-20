const handlers = require("./handelerFactory");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const knex = require("../config/db");

exports.getAllInventoryDetail = handlers.getAll("dba.inventory_detail");
exports.createInventoryDetail = handlers.createOne("dba.inventory_detail");
exports.getInventoryDetail = handlers.getOne("dba.inventory_detail", "row_ref");
exports.deleteInventoryDetail = handlers.deleteOne("dba.inventory_detail", "row_ref");
exports.updateInventoryDetail= handlers.updateOne("dba.inventory_detail", "row_ref");


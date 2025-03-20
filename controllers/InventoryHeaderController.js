const handlers = require("./handelerFactory");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const knex = require("../config/db");
exports.getAllInOrder = handlers.getAll("dba.inventory_header");

exports.createInOrder = handlers.createOne("dba.inventory_header");
exports.getInOrder = handlers.getOne("dba.inventory_header", "order_ref");
exports.deleteInOrder = handlers.deleteOne("dba.inventory_header", "order_ref");
exports.updateInOrder= handlers.updateOne("dba.inventory_header", "order_ref");


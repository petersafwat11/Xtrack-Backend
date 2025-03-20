const handlers = require("./handelerFactory");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const knex = require("../config/db");

exports.getAllPick = handlers.getAll("dba.wms_app_pick");

exports.createPick = handlers.createOne("dba.wms_app_pick");
exports.getPick = handlers.getOne("dba.wms_app_pick", "pick_id");
exports.deletePick = handlers.deleteOne("dba.wms_app_pick", "pick_id");
exports.updatePick= handlers.updateOne("dba.wms_app_pick", "pick_id");


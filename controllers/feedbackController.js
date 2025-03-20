const handlers = require("./handelerFactory");
// const catchAsync = require("../utils/catchAsync");
// const AppError = require("../utils/appError");
// const knex = require("../config/db");

exports.createFeedback = handlers.createOne("dba.xwms_feedback");
// exports.getFeedback = handlers.getOne("dba.xwms_feedback", "feedback_id");
// exports.deleteFeedback = handlers.deleteOne("dba.xwms_feedback", "feedback_id");
// exports.updateFeedback= handlers.updateOne("dba.xwms_feedback", "feedback_id");

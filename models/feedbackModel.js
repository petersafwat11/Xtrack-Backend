const db = require("../config/db"); // Knex connection

const Feedback = {
  // Main table name
  tableName: "dba.xtrack_feedback",
  submitFeedback: async (feedbackData) => {
    const dataWithTimestamp = {
      ...feedbackData,
      create_date: new Date(),
    };

    const [feedback] = await db(Feedback.tableName)
      .insert(dataWithTimestamp)
      .returning("feedback_id");

    return feedback;
  },
};

module.exports = Feedback;

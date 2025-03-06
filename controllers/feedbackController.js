const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");
const knex = require("../config/db");
const nodemailer = require("nodemailer");

exports.submitFeedback = catchAsync(async (req, res, next) => {
  const { user_id, feedback_date, feedback_subject, feedback_description } =
    req.body;

  try {
    // 1. Insert feedback into database
    const [feedback] = await knex("dba.xtrack_feedback")
      .insert({
        user_id,
        feedback_date: new Date(feedback_date),
        feedback_subject,
        feedback_description,
        create_date: new Date(),
      })
      .returning("feedback_id");

    // 2. Create email transporter with hardcoded SMTP config
    const transporter = nodemailer.createTransport({
      host: process.env.smtp_server,
      port: process.env.smtp_port,
      secure: true,
      auth: {
        user: process.env.smtp_username,
        pass: process.env.smtp_password,
      },
      tls: {
        // Do not fail on invalid certs
        rejectUnauthorized: false,
      },
    });

    // 3. Send email
    await transporter.sendMail({
      from: {
        name: "TrackWW Support",
        address: "contact@trackww.com",
      },
      to: "contact@trackww.com",
      subject: feedback_subject,
      html: `
                <p><strong>Submit by:</strong> ${user_id}</p>
                <p><strong>Date:</strong> ${feedback_date}</p>
                <p><strong>Description:</strong> ${feedback_description}</p>
            `,
    });

    res.status(200).json({
      status: "success",
      message: "Feedback submitted. Our support team will contact you",
    });
  } catch (error) {
    console.error("SMTP Error:", error);
    next(new AppError(error.message || "Failed to submit feedback", 500));
  }
});

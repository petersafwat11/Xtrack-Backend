const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");
const Feedback = require("../models/feedbackModel");
const nodemailer = require("nodemailer");

exports.submitFeedback = catchAsync(async (req, res, next) => {
  const { user_id, feedback_date, feedback_subject, feedback_description } =
    req.body;

  // Improved validation with specific error messages
  if (!user_id || !feedback_date || !feedback_subject || !feedback_description) {
    return next(new AppError("All fields are required", 400));
  }
  try {
    // 1. Insert feedback using Feedback model
    const feedbackData = {
      user_id,
      feedback_date: new Date(feedback_date),
      feedback_subject,
      feedback_description,
    };

    const feedback = await Feedback.submitFeedback(feedbackData);

    if (!feedback) {
      return next(new AppError("Failed to save feedback to database", 500));
    }

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
    try {
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
    } catch (emailError) {
      console.error("Email sending failed:", emailError);
      // Continue execution but log the error
      // We still want to return success since feedback was saved
    }

    res.status(200).json({
      status: "success",
      message: "Feedback submitted. Our support team will contact you",
      data: {
        feedback_id: feedback.feedback_id,
      },
    });
  } catch (error) {
    next(
      new AppError("Failed to submit feedback. Please try again later", 500)
    );
  }
});

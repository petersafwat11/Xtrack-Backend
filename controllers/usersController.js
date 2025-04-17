const User = require("../models/userModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");

exports.getAllUsers = catchAsync(async (req, res, next) => {
  try {
    // Validate pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    if (page < 1) {
      return next(new AppError("Page number must be at least 1", 400));
    }

    const search = req.query.search || null;

    // Use the User model's findAll method with options
    const result = await User.findAll({ page, limit, search });

    // Send response
    res.status(200).json({
      status: "success",
      results: result.count,
      page,
      limit,
      data: result.users,
    });
  } catch (error) {
    console.error("Error in getAllUsers:", error);

    if (error.code === "28000") {
      return next(
        new AppError("Database permission error. Contact administrator", 500)
      );
    }

    next(new AppError("Failed to retrieve users. Please try again later", 500));
  }
});

exports.createUser = catchAsync(async (req, res, next) => {
  try {
    const userData = { ...req.body };

    // Validate required fields
    if (!userData.user_id || !userData.user_name || !userData.user_email || !userData.user_pwd) {
      return next(new AppError("All fields are required", 400));
    }

    // Create user using the User model
    const created = await User.create(userData);

    if (!created) {
      return next(new AppError("Failed to create user in database", 500));
    }

    // Send welcome email
    try {
      // Create email transporter using environment variables
      const transporter = nodemailer.createTransport({
        host: process.env.smtp_server,
        port: process.env.smtp_port,
        secure: true,
        auth: {
          user: process.env.smtp_username,
          pass: process.env.smtp_password,
        },
        tls: {
          rejectUnauthorized: false,
        },
      });

      // Format email body
      const emailBody = `
        Hi ${userData.user_name},
        
        Welcome to TrackWW. Below the login credentials.
        Login Id - ${userData.user_id}
        Password - ${userData.user_pwd}
        
        Thank You, Happy Tracking
        TrackWW Support
        
        Kindly reach to us for any queries contact@trackww.com
      `;

      // Send email
      await transporter.sendMail({
        from: '"TrackWW Support" <contact@trackww.com>',
        to: userData.user_email,
        subject: "User Created in TrackWW",
        text: emailBody,
        html: emailBody.replace(/\n/g, "<br>"),
      });
    } catch (emailError) {
      console.error("Email sending failed:", emailError);
      // Continue execution even if email fails
    }

    // Return success response
    res.status(201).json({
      status: "success",
      data: {
        data: created,
      },
      message: "User created successfully and welcome email sent",
    });
  } catch (error) {
    console.error("Error creating user:", error);

    // Handle specific database errors
    if (error.code === "23505") {
      return next(
        new AppError("A user with this ID or email already exists", 400)
      );
    }

    if (error.code === "23502") {
      return next(
        new AppError("Missing required field for user creation", 400)
      );
    }

    next(new AppError("Failed to create user. Please try again later", 500));
  }
});

exports.getUser = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  if (!id) {
    return next(new AppError("User ID is required", 400));
  }

  // Use the User model's findById method
  const user = await User.findById(id);

  if (!user) {
    return next(new AppError(`User with ID "${id}" not found`, 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      data: user,
    },
  });
});

exports.updateUser = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  if (!id) {
    return next(new AppError("User ID is required", 400));
  }

  if (Object.keys(req.body).length === 0) {
    return next(new AppError("No update data provided", 400));
  }

  const updateData = { ...req.body };

  // Don't update user_id
  delete updateData.user_id;

  // If password is empty, don't update it
  if (!updateData.user_pwd) {
    delete updateData.user_pwd;
  }

  try {
    // Check if user exists first
    const existingUser = await User.findById(id);
    if (!existingUser) {
      return next(new AppError(`User with ID "${id}" not found`, 404));
    }

    // Use the User model's update method
    const updated = await User.update(id, updateData);

    if (!updated) {
      return next(new AppError("Failed to update user data", 500));
    }

    res.status(200).json({
      status: "success",
      data: {
        data: updated,
      },
    });
  } catch (error) {
    console.error("Error updating user:", error);

    if (error.code === "23505") {
      return next(
        new AppError("This update would create a duplicate user", 400)
      );
    }

    if (error.code === "23502") {
      return next(new AppError("Missing required field in update data", 400));
    }

    next(new AppError("Failed to update user. Please try again later", 500));
  }
});

exports.deleteUser = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  if (!id) {
    return next(new AppError("User ID is required", 400));
  }

  try {
    // Check if the user exists
    const user = await User.findById(id);
    if (!user) {
      return next(new AppError(`User with ID "${id}" not found`, 404));
    }

    // Delete the user using the User model
    const deleted = await User.delete(id);

    if (!deleted) {
      return next(new AppError("Failed to delete user", 500));
    }

    res.status(204).json({
      status: "success",
      data: null, // No content on successful deletion
    });
  } catch (error) {
    console.error("Error deleting user:", error);

    if (error.code === "23503") {
      return next(
        new AppError(
          "Cannot delete user because it is referenced by other records",
          400
        )
      );
    }

    next(new AppError("Failed to delete user. Please try again later", 500));
  }
});

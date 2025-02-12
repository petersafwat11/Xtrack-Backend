const User = require("../models/userModel");
const handlers = require("./handelerFactory");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const db = require("../config/db"); // Your db connection via Knex
const bcrypt = require("bcryptjs");

exports.getAllUsers = async (req, res, next) => {
  try {
    const users = await db("dba.qru_access").select("*");
    res.status(200).json({
      status: "success",
      users: users,
    });
  } catch (error) {
    console.error(error); // Log the error for debugging
    return next(new AppError("Error fetching users", 500));
  }
};

exports.createUser = async (req, res, next) => {
  try {
    const { user_pwd } = req.body;

    // Basic validation
    // if (!first_name || !last_name || !email || !password || !role) {
    //   return next(new AppError("Please provide all required fields", 400)); // Pass error to next
    // }

    const hashedPassword = await bcrypt.hash(user_pwd, 12);

    // Create a new user in the database
    const newUser = await User.create({
      ...req.body,
      user_pwd: hashedPassword,
    });

    res.status(201).json({
      status: "success",
      data: {
        user: newUser,
      },
    });
  } catch (error) {
    console.error("Error creating user:", error); // Log the error for debugging

    // Check for unique violation error code from PostgreSQL
    if (error.code === "23505") {
      return next(new AppError("Email already exists", 409)); // Handle unique constraint error
    }

    // For other errors
    return next(new AppError("Error creating user", 500)); // Pass generic error to next
  }
};

exports.getAllTables = async (req, res, next) => {
  try {
    const tables = await db.raw(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'dba';
    `);
    res.status(200).json({
      status: "success",
      tables: tables.rows,
    });
  } catch (error) {
    console.error("Error retrieving tables:", error);
  }
};
exports.getUser = handlers.getOne("dba.qru_access");
exports.updateUser = handlers.updateOne("dba.qru_access");
exports.updatePassword = catchAsync(async (req, res, next) => {
  const { user_email, user_pwd } = req.body;

  // Validate input
  if (!user_email || !user_pwd) {
    return next(new AppError('Email and password are required.', 400));
  }

  try {
    // Check if user exists
    const user = await db('dba.qru_access').where({ user_email }).first();

    if (!user) {
      return next(new AppError('User not found.', 404));
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(user_pwd, 12);

    // Update the password
    await db('dba.qru_access')
      .where({ user_email })
      .update({ 
        user_pwd: hashedPassword,
        update_date: new Date().toISOString()
      });

    res.status(200).json({
      status: 'success',
      message: 'Password updated successfully.'
    });
  } catch (error) {
    return next(new AppError('Error updating password', 500));
  }
});

const User = require("../models/userModel");
const handlers = require("./handelerFactory");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const knex = require("../config/db"); // Your db connection via Knex
const bcrypt = require("bcryptjs");

exports.getAllUsers = catchAsync(async (req, res, next) => {
  try {
    // Get pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Transaction for consistency
    const result = await knex.transaction(async (trx) => {
      // Get total count for pagination
      const countQuery = trx("dba.XTRACK_users")
        .count("* as count")
        .timeout(5000);

      // Apply search filter if provided
      if (req.query.search) {
        countQuery.where(function () {
          this.whereILike("user_id", `%${req.query.search}%`)
            .orWhereILike("user_name", `%${req.query.search}%`)
            .orWhereILike("user_email", `%${req.query.search}%`)
            .orWhereILike("user_company", `%${req.query.search}%`);
        });
      }

      // Execute count query
      const [{ count }] = await countQuery;

      // Fetch users with pagination
      const usersQuery = trx("dba.XTRACK_users")
        .select("*")
        .orderBy("create_date", "desc") // Order by latest created users
        .limit(limit)
        .offset(offset)
        .timeout(5000);

      // Apply search filter if provided
      if (req.query.search) {
        usersQuery.where(function () {
          this.whereILike("user_id", `%${req.query.search}%`)
            .orWhereILike("user_name", `%${req.query.search}%`)
            .orWhereILike("user_email", `%${req.query.search}%`)
            .orWhereILike("user_company", `%${req.query.search}%`);
        });
      }

      const users = await usersQuery;

      return { count, users };
    });

    // Send response
    res.status(200).json({
      status: "success",
      results: parseInt(result.count),
      page,
      limit,
      data: result.users,
    });
  } catch (error) {
    console.error("Error in getAllUsers:", error);
    next(new AppError(error.message || "Failed to fetch users", 500));
  }
});

exports.createUser = catchAsync(async (req, res, next) => {
  try {
    const userData = { ...req.body };

    // Insert the user into the database
    const created = await knex("dba.XTRACK_users")
      .insert(userData)
      .returning("*");

    // Send welcome email to the user
    const nodemailer = require("nodemailer");

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

    // Return success response
    res.status(201).json({
      status: "success",
      data: {
        data: created[0],
      },
      message: "User created successfully and welcome email sent",
    });
  } catch (error) {
    console.error("Error creating user:", error);
    next(new AppError(error.message || "Failed to create user", 500));
  }
});

exports.getUser = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const user = await knex("dba.XTRACK_users").where({ user_id: id }).first();

  if (!user) {
    return next(new AppError("No user found with that ID", 404));
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
  const updateData = { ...req.body };

  // Don't update user_id
  delete updateData.user_id;

  // If password is empty, don't update it
  if (!updateData.user_pwd) {
    delete updateData.user_pwd;
  }

  const updated = await knex("dba.XTRACK_users")
    .where({ user_id: id })
    .update(updateData)
    .returning("*");

  if (!updated.length) {
    return next(new AppError("No user found with that ID", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      data: updated[0],
    },
  });
});

exports.deleteUser = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  // Check if the user exists
  const user = await knex("dba.XTRACK_users").where({ user_id: id }).first();
  if (!user) {
    return next(new AppError("User not found", 404));
  }

  // Delete the user
  await knex("dba.XTRACK_users").where({ user_id: id }).del();

  res.status(204).json({
    status: "success",
    data: null, // No content on successful deletion
  });
});

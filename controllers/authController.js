const bcrypt = require("bcryptjs");
const User = require("../models/userModel");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");
const jwt = require("jsonwebtoken");
const { countryList } = require("../utils/countryList");
const knex = require("../config/db");
const nodemailer = require("nodemailer");

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };
  if (process.env.NODE_ENV === "production") cookieOptions.secure = true;

  res.cookie("jwt", token, cookieOptions);

  // Remove password from output
  user.password = undefined;

  res.status(statusCode).json({
    status: "success",
    token,
    data: {
      user,
    },
  });
};

exports.login = catchAsync(async (req, res, next) => {
  const { user_id, user_pwd } = req.body;
  const currentDate = new Date();

  // Get client IP and attempt to get location from headers
  const ip_config = req.ip || req.connection.remoteAddress;
  const ip_location = req.headers["x-forwarded-for"] || ip_config;

  try {
    // 1. Check if user exists and get user data
    const user = await knex("dba.xtrack_access").where({ user_id }).first();

    if (!user) {
      throw new AppError("Invalid credentials", 401);
    }

    // 2. Check if user is active
    if (user.user_active !== "Y") {
      throw new AppError("Inactive user", 401);
    }

    // 3. Check validity date
    if (user.user_valid_date && new Date(user.user_valid_date) < currentDate) {
      throw new AppError("User validity expired", 401);
    }

    // 4. Check password
    // const passwordMatch = await bcrypt.compare(user_pwd, user.user_pwd);
    const passwordMatch = user_pwd === user.user_pwd;
    if (!passwordMatch) {
      throw new AppError("Invalid email or password", 401);
    }

    // 5. If all checks pass, log successful login
    await knex("dba.xtrack_log").insert({
      user_id,
      api_date: new Date(),
      api_request: "login",
      api_status: "S",
      ip_config,
      ip_location,
    });

    // 6. Generate JWT token and send response
    const token = signToken(user.user_id);

    res.status(200).json({
      status: "success",
      token,
      data: {
        user: {
          user_id: user.user_id,
          company: user.company,
          entity_code: user.entity_code,
          // Add other user data you want to send to frontend
        },
      },
    });
  } catch (error) {
    next(error);
  }
});


exports.logout = (req, res) => {
  res.cookie("jwt", "loggedout", {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });
  res.status(200).json({ status: "success" });
};

exports.handleSignup = catchAsync(async (req, res, next) => {
  const { name, company, address, country, email, phone } = req.body;

  // 1. Insert into xtrack_signup table with correct column names
  await knex("dba.xtrack_signup").insert({
    name,
    company,
    address,
    country,
    email,
    phone,
  });

  // 2. Get SMTP configuration
  const smtpConfig = await knex("dba.smtp_config")
    .select("*")
    .where({ company: "JGLS" })
    .first();

  if (!smtpConfig || !smtpConfig.signup_email) {
    throw new AppError("SMTP configuration not found", 500);
  }

  // 3. Configure email transporter
  const transporter = nodemailer.createTransport({
    host: smtpConfig.smtp_server,
    port: smtpConfig.smtp_port,
    secure: smtpConfig.smtp_port === 465,
    auth: {
      user: smtpConfig.smtp_username,
      pass: smtpConfig.smtp_password,
    },
  });

  // 4. Format email body
  const emailBody = `
    New Xtrack Signup Request
    
    Details:
    --------
    Name: ${name}
    Company: ${company}
    Address: ${address}
    Country: ${country}
    Email: ${email}
    Phone: ${phone}
    
    Date: ${new Date().toLocaleString()}
  `;

  // 5. Send email
  await transporter.sendMail({
    from: `"${smtpConfig.smtp_sendername}" <${smtpConfig.smtp_sender}>`,
    to: smtpConfig.signup_email,
    subject: "Xtrack Signup Request",
    text: emailBody,
    html: emailBody.replace(/\n/g, "<br>"),
  });

  // 6. Send response
  res.status(201).json({
    status: "success",
    message: "Signup request submitted successfully",
  });
});

// Add this temporary test route controller
exports.createTestUser = catchAsync(async (req, res, next) => {
  const hashedPassword = await bcrypt.hash("Test@123", 12);

  const currentDate = new Date().toISOString().split("T")[0]; // Format: YYYY-MM-DD

  const testUser = {
    company: "JGLS", // Max 10 chars
    entity_code: "JGL", // Max 10 chars
    user_id: "safwat", // Max 20 chars
    user_pwd: "Test@123", // Max 100 chars
    user_name: "safwat", // Max 50 chars
    user_company: "JGLS", // Max 50 chars
    user_location: "SG", // Max 20 chars
    user_avatar: null,
    user_active: "Y", // Single char
    user_valid_date: new Date(Date.now() + 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0], // Date format
    user_email: "safwat@jgls.com", // Max 50 chars
    create_user: "SYSTEM", // Max 20 chars
    create_date: currentDate, // Date format
    update_user: "SYSTEM", // Max 20 chars
    update_date: currentDate, // Date format
  };

  await knex("dba.xtrack_access").insert(testUser);

  res.status(201).json({
    status: "success",
    message: "Test user created successfully",
    data: {
      user_id: testUser.user_id,
      password: "Test@123", // Only for testing!
    },
  });
});

exports.changePassword = catchAsync(async (req, res, next) => {
  const { user_id, old_password, new_password } = req.body;

  // 1. Get user from database
  const user = await knex("dba.xtrack_access").where({ user_id }).first();

  if (!user) {
    throw new AppError("User not found", 404);
  }

  // 2. Verify old password
  const passwordMatch = old_password === user.user_pwd;
  if (!passwordMatch) {
    throw new AppError("Current password is incorrect", 401);
  }

  // 3. Update password in database
  await knex("dba.xtrack_access")
    .where({ user_id })
    .update({
      user_pwd: new_password,
      update_date: new Date().toISOString().split("T")[0],
      update_user: user_id,
    });

  // 4. Log the password change
  await knex("dba.xtrack_log").insert({
    user_id,
    api_date: new Date(),
    api_request: "Password Reset",
    api_status: "S",
    ip_config: req.ip || req.connection.remoteAddress,
    ip_location: req.headers["x-forwarded-for"] || req.ip,
  });

  res.status(200).json({
    status: "success",
    message: "Password updated successfully",
  });
});

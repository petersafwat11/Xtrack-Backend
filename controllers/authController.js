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

const axios = require("axios");

exports.login = catchAsync(async (req, res, next) => {
  const { user_id, user_pwd } = req.body;
  const currentDate = new Date();

  // Get client IP
  const ip_config = req.ip || req.connection.remoteAddress;
  const ip_location = req.headers["x-forwarded-for"] || ip_config;

  try {
    // 1. Fetch user from xtrack_users table
    const user = await knex("dba.XTRACK_users").where({ user_id }).first();

    if (!user) {
      throw new AppError("Invalid User/Password", 401);
    }

    // 2. Check if password matches
    const passwordMatch = user_pwd === user.user_pwd; 
    if (!passwordMatch) {
      throw new AppError("Invalid User/Password", 401);
    }

    // 3. Check if user is active
    if (user.user_active !== "Y") {
      throw new AppError("Inactive User", 401);
    }

    // 4. Check validity date
    if (user.valid_till && new Date(user.valid_till) < currentDate) {
      throw new AppError("User Login Expired", 401);
    }

    // 5. Get Country from IP
    let country = "Unknown";
    try {
      const response = await axios.get(`http://ip-api.com/json/${ip_location}`);
      country = response.data.country || "Unknown";
    } catch (err) {
      console.error("Failed to fetch IP location:", err.message);
    }

    // 6. Log successful login
    await knex("dba.xtrack_log").insert({
      user_id,
      api_date: new Date(),
      api_request: "login",
      api_status: "S",
      ip_config,
      ip_location:country ,
       // Save country in logs
    });

    // 7. Generate JWT token
    const token = signToken(user.user_id);

    // 8. Determine menu visibility
    const menuPermissions = {
      showSettingsUsers: user.admin_user === "Y",
      showSettingsAPI: user.admin_user === "Y",
    };

    // 9. Send response
    res.status(200).json({
      status: "success",
      token,
      data: {
        user: {
          user_id: user.user_id,
          user_name: user.user_name, 
          company: user.company,
          entity_code: user.entity_code,
          menuPermissions, 
          country, 
        },
      },
    });

  } catch (error) {
    next(error);
  }
});
exports.logout = (req, res) => {
  // Clear JWT cookie
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  });

  res.status(200).json({ status: 'success' });
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
    from: '"Xtrack Signup" <contact@trackww.com>',
    replyTo: email,
    to: "contact@trackww.com",
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

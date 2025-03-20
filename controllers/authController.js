const bcrypt = require("bcryptjs");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");
const jwt = require("jsonwebtoken");
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

  try {
    // 1. Fetch user from database, checking both user_id and user_email fields
    const user = await knex("dba.xwms_users")
      .where(function() {
        this.where({ user_id })
            .orWhere({ user_email: user_id }); // Check if user_id input matches user_email field
      })
      .first();

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

    // 5. Generate JWT token
    const token = signToken(user.user_id);

    // 6. Delete password from user object
    delete user.user_pwd;

    // 7. Send response
    res.status(200).json({
      status: "success",
      token,
      data: {
        user,
      },
    });
  } catch (error) {
    next(error);
  }
});
exports.logout = (req, res) => {
  // Clear JWT cookie
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

exports.createTestingUser = async (req, res, next) => {
  try {
    // const { user_pwd, ...userData } = req.body; // Extract password separately

    // Log the data being inserted for debugging

    // 1. Hash Password
    // const hashedPassword = await bcrypt.hash(user_pwd, 10);

    // 2. Insert into xwms_user table and RETURN inserted data (excluding password)
    const [newUser] = await knex("dba.xwms_users")
      .insert({
        ...req.body,
      })
      .returning([
        "company",
        "entity_code",
        "user_id",
        "user_name",
        "user_email",
        "user_active",
        "valid_till",
        "user_company",
        "user_address",
        "user_country",
        "user_phone",
        "admin_user",
      ]); // 

    // 3. Send Response
    res.status(201).json({
      status: "success",
      message: "Testing user created successfully",
      data: newUser, // 
    });

  } catch (error) {
    console.error("Error creating testing user:", error.message);
    
    // Check if it's a column length error
    if (error.message.includes("value too long for type")) {
      // Extract the column name from the error message if possible
      const columnMatch = error.message.match(/column\s+"([^"]+)"/);
      const column = columnMatch ? columnMatch[1] : "unknown column";
      
      return res.status(400).json({
        status: "error",
        code: 400,
        message: `Value for ${column} is too long. Please check your input data and try again.`,
        originalError: error.message
      });
    }
    
    next(error);
  }
};

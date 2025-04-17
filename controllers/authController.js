const bcrypt = require("bcryptjs");
const User = require("../models/userModel");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");
const jwt = require("jsonwebtoken");
const { countryList } = require("../utils/countryList");
const nodemailer = require("nodemailer");
const axios = require("axios");

const signToken = (id) => {
  // Check if JWT_SECRET is configured
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET environment variable is not configured");
  }

  // Check if JWT_EXPIRES_IN is configured
  if (!process.env.JWT_EXPIRES_IN) {
    throw new Error("JWT_EXPIRES_IN environment variable is not configured");
  }

  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

exports.login = catchAsync(async (req, res, next) => {
  // 1. Check if credentials are provided
  const { user_id, user_pwd } = req.body;

  if (!user_id) {
    return next(new AppError("User ID is required", 400));
  }

  if (!user_pwd) {
    return next(new AppError("Password is required", 400));
  }

  // Get client IP
  const ip_config = req.ip || req.connection.remoteAddress;
  const ip_location = req.headers["x-forwarded-for"] || ip_config;

  try {
    // 2. Fetch user by ID using the User model
    const user = await User.findById(user_id);

    if (!user) {
      // Use a generic message for security
      return next(new AppError("Invalid credentials", 401));
    }

    // 3. Check if password matches
    const passwordMatch = user_pwd === user.user_pwd;
    if (!passwordMatch) {
      // Use a generic message for security
      return next(new AppError("Invalid credentials", 401));
    }

    // 4. Validate user status (active and not expired)
    const validationResult = User.validateUserStatus(user);
    if (!validationResult.valid) {
      return next(new AppError(validationResult.message, 401));
    }

    // 5. Get Country from IP
    let country = "Unknown";
    try {
      const response = await axios.get(`http://ip-api.com/json/${ip_location}`);
      country = response.data.country || "Unknown";
    } catch (err) {
      console.error("Failed to fetch IP location:", err.message);
      // Continue without country info
    }

    // 6. Log successful login using User model
    try {
      await User.logUserActivity({
        user_id,
        api_date: new Date(),
        api_request: "login",
        api_status: "S",
        ip_config,
        ip_location: country,
      });
    } catch (logError) {
      console.error("Failed to log login activity:", logError);
      // Continue without logging
    }

    // 7. Generate JWT token
    let token;
    try {
      token = signToken(user.user_id);
    } catch (tokenError) {
      console.error("Token generation error:", tokenError);
      return next(
        new AppError(
          "Authentication system error. Please contact administrator",
          500
        )
      );
    }

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
    console.error("Login error:", error);
    next(new AppError("Login failed. Please try again later", 500));
  }
});

exports.logout = (req, res) => {
  try {
    // Clear JWT cookie
    res.cookie("jwt", "loggedout", {
      expires: new Date(Date.now() + 10 * 1000),
      httpOnly: true,
    });

    res.status(200).json({ status: "success" });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to logout properly",
    });
  }
};

exports.handleSignup = catchAsync(async (req, res, next) => {
  // Validate required fields
  const { name, company, address, country, email, phone } = req.body;

  if (!name || !company || !address || !country || !email || !phone) {
    return next(new AppError("All fields are required", 400));
  }

  try {
    // 1. Insert into xtrack_signup table using User model
    await User.createSignupRequest({
      name,
      company,
      address,
      country,
      email,
      phone,
    });

    // 2. Send notification email
    try {
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
      New Xtrack Signup Request
      
      Details:
      --------
      Name: ${name}
      Company: ${company}
      Address: ${address || "Not provided"}
      Country: ${country || "Not provided"}
      Email: ${email}
      Phone: ${phone}
      
      Date: ${new Date().toLocaleString()}
    `;

      // Send email
      await transporter.sendMail({
        from: '"Xtrack Signup" <contact@trackww.com>',
        replyTo: email,
        to: "contact@trackww.com",
        subject: "Xtrack Signup Request",
        text: emailBody,
        html: emailBody.replace(/\n/g, "<br>"),
      });
    } catch (emailError) {
      console.error("Failed to send signup notification email:", emailError);
      // Continue without email notification
    }

    // 3. Send response
    res.status(201).json({
      status: "success",
      message: "Signup request submitted successfully",
    });
  } catch (error) {
    console.error("Signup error:", error);

    if (error.code === "23505") {
      return next(
        new AppError("A signup request with this email already exists", 400)
      );
    }

    if (error.code === "23502") {
      return next(
        new AppError("Missing required field in signup request", 400)
      );
    }

    next(
      new AppError(
        "Failed to submit signup request. Please try again later",
        500
      )
    );
  }
});

exports.changePassword = catchAsync(async (req, res, next) => {
  const { user_id, old_password, new_password } = req.body;

  // Validate inputs
  if (!user_id) {
    return next(new AppError("User ID is required", 400));
  }

  if (!old_password) {
    return next(new AppError("Current password is required", 400));
  }

  if (!new_password) {
    return next(new AppError("New password is required", 400));
  }

  if (old_password === new_password) {
    return next(
      new AppError("New password must be different from current password", 400)
    );
  }

  // Password strength validation
  if (new_password.length < 8) {
    return next(
      new AppError("Password must be at least 8 characters long", 400)
    );
  }

  try {
    // 1. Get user using User model
    const user = await User.findById(user_id);

    if (!user) {
      return next(new AppError("User not found", 404));
    }

    // 2. Verify old password
    const passwordMatch = old_password === user.user_pwd;
    if (!passwordMatch) {
      return next(new AppError("Current password is incorrect", 401));
    }

    // 3. Update password using User model
    const updatedData = {
      user_pwd: new_password,
      update_date: new Date().toISOString().split("T")[0],
      update_user: user_id,
    };

    const updated = await User.update(user_id, updatedData);

    if (!updated) {
      return next(new AppError("Failed to update password", 500));
    }

    // 4. Log the password change using User model
    try {
      await User.logUserActivity({
        user_id,
        api_date: new Date(),
        api_request: "Password Reset",
        api_status: "S",
        ip_config: req.ip || req.connection.remoteAddress,
        ip_location: req.headers["x-forwarded-for"] || req.ip,
      });
    } catch (logError) {
      console.error("Failed to log password change:", logError);
      // Continue without logging
    }

    res.status(200).json({
      status: "success",
      message: "Password updated successfully",
    });
  } catch (error) {
    console.error("Password change error:", error);
    next(
      new AppError("Failed to update password. Please try again later", 500)
    );
  }
});

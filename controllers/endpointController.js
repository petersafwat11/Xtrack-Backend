const Endpoint = require("../models/endpointModel");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");

exports.getAllEndpoints = catchAsync(async (req, res, next) => {
  try {
    const endpoints = await Endpoint.findAll();

    if (!endpoints || endpoints.length === 0) {
      // This is not an error, just an empty result
      return res.status(200).json({
        status: "success",
        results: 0,
        data: [],
      });
    }

    res.status(200).json({
      status: "success",
      results: endpoints.length,
      data: endpoints,
    });
  } catch (error) {
    console.error("Error fetching endpoints:", error);

    if (error.code === "42P01") {
      return next(
        new AppError("Endpoint table not found. Contact administrator", 500)
      );
    }

    next(
      new AppError("Failed to retrieve endpoints. Please try again later", 500)
    );
  }
});

exports.createEndpoint = catchAsync(async (req, res, next) => {
  try {
    const { menu_id, endpoint } = req.body;

    // Validate required fields
    if (!menu_id) {
      return next(new AppError("Menu ID is required", 400));
    }

    if (!endpoint) {
      return next(new AppError("Endpoint URL is required", 400));
    }

    // Basic validation of endpoint URL format
    if (!endpoint.startsWith("http://") && !endpoint.startsWith("https://")) {
      return next(
        new AppError("Endpoint must start with http:// or https://", 400)
      );
    }

    const newEndpoint = await Endpoint.create({
      menu_id,
      endpoint,
    });

    if (!newEndpoint) {
      return next(new AppError("Failed to create endpoint in database", 500));
    }

    res.status(201).json({
      status: "success",
      data: newEndpoint,
    });
  } catch (error) {
    console.error("Error creating endpoint:", error);

    if (error.code === "23502") {
      return next(
        new AppError("Missing required field for endpoint creation", 400)
      );
    }

    next(
      new AppError("Failed to create endpoint. Please try again later", 500)
    );
  }
});

exports.updateEndpoint = catchAsync(async (req, res, next) => {
  try {
    const { menu_id, endpoint, old_menu_id, old_endpoint } = req.body;

    // Validate all required fields
    if (!menu_id) {
      return next(new AppError("New menu ID is required", 400));
    }

    if (!endpoint) {
      return next(new AppError("New endpoint URL is required", 400));
    }

    if (!old_menu_id) {
      return next(new AppError("Original menu ID is required", 400));
    }

    if (!old_endpoint) {
      return next(new AppError("Original endpoint URL is required", 400));
    }

    // Basic validation of endpoint URL format
    if (!endpoint.startsWith("http://") && !endpoint.startsWith("https://")) {
      return next(
        new AppError("Endpoint must start with http:// or https://", 400)
      );
    }

    // Check if original endpoint exists
    const existingEndpoint = await Endpoint.findByMenuId(old_menu_id);
    if (!existingEndpoint) {
      return next(
        new AppError(`Endpoint with menu ID "${old_menu_id}" not found`, 404)
      );
    }

    if (existingEndpoint.endpoint !== old_endpoint) {
      return next(
        new AppError(
          "Original endpoint URL does not match the one in database",
          400
        )
      );
    }

    const updatedEndpoint = await Endpoint.update(
      { old_menu_id, old_endpoint },
      { menu_id, endpoint }
    );

    if (!updatedEndpoint) {
      return next(new AppError("Failed to update endpoint", 500));
    }

    res.status(200).json({
      status: "success",
      data: updatedEndpoint,
    });
  } catch (error) {
    console.error("Error updating endpoint:", error);

    if (error.code === "23505") {
      return next(
        new AppError("An endpoint with this menu ID already exists", 400)
      );
    }

    next(
      new AppError("Failed to update endpoint. Please try again later", 500)
    );
  }
});

exports.getEndpoint = catchAsync(async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!id) {
      return next(new AppError("Menu ID is required", 400));
    }

    const endpoint = await Endpoint.findByMenuId(id);

    if (!endpoint) {
      return next(new AppError(`Endpoint with menu ID "${id}" not found`, 404));
    }

    res.status(200).json({
      status: "success",
      data: endpoint,
    });
  } catch (error) {
    console.error("Error retrieving endpoint:", error);
    next(
      new AppError("Failed to retrieve endpoint. Please try again later", 500)
    );
  }
});

exports.deleteEndpoint = catchAsync(async (req, res, next) => {
  try {
    const { id } = req.params;
    const { endpoint } = req.query;

    if (!id) {
      return next(new AppError("Menu ID is required", 400));
    }

    if (!endpoint) {
      return next(
        new AppError("Endpoint URL is required in query parameters", 400)
      );
    }

    // Check if endpoint exists before attempting to delete
    const existingEndpoint = await Endpoint.findByMenuId(id);

    if (!existingEndpoint) {
      return next(new AppError(`Endpoint with menu ID "${id}" not found`, 404));
    }

    if (existingEndpoint.endpoint !== endpoint) {
      return next(
        new AppError(
          "The provided endpoint URL does not match the one in database",
          400
        )
      );
    }

    const deleted = await Endpoint.delete(id, endpoint);

    if (!deleted) {
      return next(new AppError("Failed to delete endpoint", 500));
    }

    res.status(204).json({
      status: "success",
      data: null,
    });
  } catch (error) {
    console.error("Error deleting endpoint:", error);

    next(
      new AppError("Failed to delete endpoint. Please try again later", 500)
    );
  }
});

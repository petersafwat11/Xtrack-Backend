const knex = require('../config/db');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

exports.getAllEndpoints = catchAsync(async (req, res, next) => {
    const result = await knex('dba.xtrack_endpoint').orderBy('update_date', 'desc');

    res.status(200).json({
        status: 'success',
        data: result
    });
});

exports.createEndpoint = catchAsync(async (req, res, next) => {
    const { menu_id, endpoint } = req.body;

    if (!menu_id || !endpoint) {
        return next(new AppError('Please provide menu_id and endpoint', 400));
    }

    const result = await knex('dba.xtrack_endpoint')
        .insert({
            menu_id,
            endpoint,
            update_date: knex.fn.now()
        })
        .returning('*');

    res.status(201).json({
        status: 'success',
        data: result[0]
    });
});

exports.updateEndpoint = catchAsync(async (req, res, next) => {
    const { menu_id, endpoint, old_menu_id, old_endpoint } = req.body;

    if (!menu_id || !endpoint || !old_menu_id || !old_endpoint) {
        return next(new AppError('Please provide all required fields', 400));
    }

    const result = await knex('dba.xtrack_endpoint')
        .where({ menu_id: old_menu_id, endpoint: old_endpoint })
        .update({
            menu_id,
            endpoint,
            update_date: knex.fn.now()
        })
        .returning('*');

    if (result.length === 0) {
        return next(new AppError('No endpoint found with that ID', 404));
    }

    res.status(200).json({
        status: 'success',
        data: result[0]
    });
});
exports.getEndpoint=catchAsync(
    async (req, res, next) => {
        const { id } = req.params;
        const endpoint = await knex('dba.xtrack_endpoint').where({ menu_id: id }).first();
        if (!endpoint) {
            return next(new AppError('No endpoint found with that ID', 404));
        }
        res.status(200).json({
            status: 'success',
            data: endpoint
        });
    }
)
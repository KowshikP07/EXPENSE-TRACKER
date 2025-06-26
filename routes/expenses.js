const express = require('express');
const { body, validationResult, query } = require('express-validator');
const Expense = require('../models/Expense');
const { protect, checkOwnership } = require('../middleware/auth');

const router = express.Router();

// Apply authentication to all routes
router.use(protect);

// Validation middleware
const validateExpense = [
  body('title')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Title must be between 1 and 100 characters'),
  
  body('amount')
    .isFloat({ min: 0.01 })
    .withMessage('Amount must be a positive number'),
  
  body('type')
    .isIn(['income', 'expense'])
    .withMessage('Type must be either "income" or "expense"'),
  
  body('category')
    .isIn([
      'Food & Dining',
      'Transportation',
      'Shopping',
      'Entertainment',
      'Healthcare',
      'Education',
      'Housing',
      'Utilities',
      'Insurance',
      'Other'
    ])
    .withMessage('Please select a valid category'),
  
  body('date')
    .isISO8601()
    .withMessage('Please provide a valid date'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters')
];

// @route   GET /api/expenses
// @desc    Get all expenses for current user with pagination and filters
// @access  Private
router.get('/', [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  query('type')
    .optional()
    .isIn(['income', 'expense'])
    .withMessage('Type must be either "income" or "expense"'),
  
  query('category')
    .optional()
    .isIn([
      'Food & Dining',
      'Transportation',
      'Shopping',
      'Entertainment',
      'Healthcare',
      'Education',
      'Housing',
      'Utilities',
      'Insurance',
      'Other'
    ])
    .withMessage('Please select a valid category'),
  
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid date'),
  
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid date')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const filters = {
      type: req.query.type,
      category: req.query.category,
      startDate: req.query.startDate,
      endDate: req.query.endDate
    };

    // Remove undefined filters
    Object.keys(filters).forEach(key => 
      filters[key] === undefined && delete filters[key]
    );

    const expenses = await Expense.getUserExpenses(req.user._id, page, limit, filters);
    
    // Get total count for pagination
    const totalQuery = { user: req.user._id };
    if (filters.type) totalQuery.type = filters.type;
    if (filters.category) totalQuery.category = filters.category;
    if (filters.startDate) totalQuery.date = { $gte: new Date(filters.startDate) };
    if (filters.endDate) {
      if (totalQuery.date) {
        totalQuery.date.$lte = new Date(filters.endDate);
      } else {
        totalQuery.date = { $lte: new Date(filters.endDate) };
      }
    }
    
    const total = await Expense.countDocuments(totalQuery);
    const totalPages = Math.ceil(total / limit);

    res.status(200).json({
      status: 'success',
      data: {
        expenses,
        pagination: {
          currentPage: page,
          totalPages,
          totalItems: total,
          itemsPerPage: limit,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      }
    });
  } catch (error) {
    console.error('Get expenses error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch expenses'
    });
  }
});

// @route   GET /api/expenses/stats
// @desc    Get expense statistics for current user
// @access  Private
router.get('/stats', [
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid date'),
  
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid date')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const filters = {
      startDate: req.query.startDate,
      endDate: req.query.endDate
    };

    // Remove undefined filters
    Object.keys(filters).forEach(key => 
      filters[key] === undefined && delete filters[key]
    );

    const stats = await Expense.getUserStats(req.user._id, filters);
    const categoryStats = await Expense.getExpensesByCategory(req.user._id, filters);

    // Format stats
    const formattedStats = {
      income: 0,
      expenses: 0,
      balance: 0
    };

    stats.forEach(stat => {
      if (stat._id === 'income') {
        formattedStats.income = stat.total;
      } else if (stat._id === 'expense') {
        formattedStats.expenses = stat.total;
      }
    });

    formattedStats.balance = formattedStats.income - formattedStats.expenses;

    res.status(200).json({
      status: 'success',
      data: {
        summary: formattedStats,
        byCategory: categoryStats
      }
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch statistics'
    });
  }
});

// @route   POST /api/expenses
// @desc    Create a new expense
// @access  Private
router.post('/', validateExpense, async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { title, amount, type, category, date, description } = req.body;

    const expense = await Expense.create({
      title,
      amount,
      type,
      category,
      date,
      description,
      user: req.user._id
    });

    // Populate user info
    await expense.populate('user', 'name email');

    res.status(201).json({
      status: 'success',
      message: 'Expense created successfully',
      data: {
        expense
      }
    });
  } catch (error) {
    console.error('Create expense error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to create expense'
    });
  }
});

// @route   GET /api/expenses/:id
// @desc    Get a specific expense
// @access  Private
router.get('/:id', checkOwnership(Expense), async (req, res) => {
  try {
    await req.resource.populate('user', 'name email');

    res.status(200).json({
      status: 'success',
      data: {
        expense: req.resource
      }
    });
  } catch (error) {
    console.error('Get expense error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch expense'
    });
  }
});

// @route   PUT /api/expenses/:id
// @desc    Update a specific expense
// @access  Private
router.put('/:id', checkOwnership(Expense), validateExpense, async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { title, amount, type, category, date, description } = req.body;

    const updatedExpense = await Expense.findByIdAndUpdate(
      req.params.id,
      {
        title,
        amount,
        type,
        category,
        date,
        description
      },
      { new: true, runValidators: true }
    ).populate('user', 'name email');

    res.status(200).json({
      status: 'success',
      message: 'Expense updated successfully',
      data: {
        expense: updatedExpense
      }
    });
  } catch (error) {
    console.error('Update expense error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update expense'
    });
  }
});

// @route   DELETE /api/expenses/:id
// @desc    Delete a specific expense
// @access  Private
router.delete('/:id', checkOwnership(Expense), async (req, res) => {
  try {
    await Expense.findByIdAndDelete(req.params.id);

    res.status(200).json({
      status: 'success',
      message: 'Expense deleted successfully'
    });
  } catch (error) {
    console.error('Delete expense error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete expense'
    });
  }
});

// @route   DELETE /api/expenses
// @desc    Delete all expenses for current user
// @access  Private
router.delete('/', async (req, res) => {
  try {
    const result = await Expense.deleteMany({ user: req.user._id });

    res.status(200).json({
      status: 'success',
      message: `Deleted ${result.deletedCount} expenses successfully`
    });
  } catch (error) {
    console.error('Delete all expenses error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete expenses'
    });
  }
});

module.exports = router; 
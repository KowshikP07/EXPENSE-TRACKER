const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    minlength: [1, 'Title must be at least 1 character long'],
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0.01, 'Amount must be greater than 0'],
    max: [999999999, 'Amount cannot exceed 999,999,999']
  },
  type: {
    type: String,
    required: [true, 'Type is required'],
    enum: {
      values: ['income', 'expense'],
      message: 'Type must be either "income" or "expense"'
    }
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: {
      values: [
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
      ],
      message: 'Please select a valid category'
    }
  },
  date: {
    type: Date,
    required: [true, 'Date is required'],
    default: Date.now
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required']
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for formatted amount
expenseSchema.virtual('formattedAmount').get(function() {
  return this.amount.toFixed(2);
});

// Virtual for formatted date
expenseSchema.virtual('formattedDate').get(function() {
  return this.date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
});

// Indexes for better query performance
expenseSchema.index({ user: 1, date: -1 });
expenseSchema.index({ user: 1, type: 1 });
expenseSchema.index({ user: 1, category: 1 });

// Static method to get user's expenses with pagination
expenseSchema.statics.getUserExpenses = function(userId, page = 1, limit = 10, filters = {}) {
  const skip = (page - 1) * limit;
  
  const query = { user: userId };
  
  // Apply filters
  if (filters.type) query.type = filters.type;
  if (filters.category) query.category = filters.category;
  if (filters.startDate) query.date = { $gte: new Date(filters.startDate) };
  if (filters.endDate) {
    if (query.date) {
      query.date.$lte = new Date(filters.endDate);
    } else {
      query.date = { $lte: new Date(filters.endDate) };
    }
  }

  return this.find(query)
    .sort({ date: -1, createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('user', 'name email');
};

// Static method to get user's expense statistics
expenseSchema.statics.getUserStats = function(userId, filters = {}) {
  const query = { user: userId };
  
  // Apply filters
  if (filters.startDate) query.date = { $gte: new Date(filters.startDate) };
  if (filters.endDate) {
    if (query.date) {
      query.date.$lte = new Date(filters.endDate);
    } else {
      query.date = { $lte: new Date(filters.endDate) };
    }
  }

  return this.aggregate([
    { $match: query },
    {
      $group: {
        _id: '$type',
        total: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    }
  ]);
};

// Static method to get expenses by category
expenseSchema.statics.getExpensesByCategory = function(userId, filters = {}) {
  const query = { user: userId };
  
  // Apply filters
  if (filters.startDate) query.date = { $gte: new Date(filters.startDate) };
  if (filters.endDate) {
    if (query.date) {
      query.date.$lte = new Date(filters.endDate);
    } else {
      query.date = { $lte: new Date(filters.endDate) };
    }
  }

  return this.aggregate([
    { $match: query },
    {
      $group: {
        _id: '$category',
        total: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    },
    { $sort: { total: -1 } }
  ]);
};

module.exports = mongoose.model('Expense', expenseSchema); 
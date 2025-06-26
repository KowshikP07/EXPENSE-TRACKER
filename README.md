# Expense Tracker Backend API

A robust RESTful API for the Expense Tracker application built with Node.js, Express, and MongoDB.

## 🚀 Features

- **User Authentication**: JWT-based authentication with secure password hashing
- **Expense Management**: Full CRUD operations for expenses and income
- **Advanced Filtering**: Filter expenses by type, category, date range
- **Statistics**: Get detailed financial statistics and category breakdowns
- **Pagination**: Efficient pagination for large datasets
- **Data Validation**: Comprehensive input validation and sanitization
- **Security**: Helmet.js security headers, CORS protection
- **Error Handling**: Centralized error handling with detailed error messages

## 📋 Prerequisites

- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd expense-tracker/backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   # Copy the environment file
   cp config.env.example config.env
   
   # Edit the environment variables
   nano config.env
   ```

4. **Configure Environment Variables**
   ```env
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/expense-tracker
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   NODE_ENV=development
   ```

5. **Start MongoDB**
   ```bash
   # Make sure MongoDB is running
   mongod
   ```

6. **Run the application**
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

## 📚 API Documentation

### Authentication Endpoints

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

#### Login User
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

#### Get Current User Profile
```http
GET /api/auth/me
Authorization: Bearer <token>
```

#### Update User Profile
```http
PUT /api/auth/profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "John Smith",
  "email": "johnsmith@example.com"
}
```

#### Change Password
```http
PUT /api/auth/change-password
Authorization: Bearer <token>
Content-Type: application/json

{
  "currentPassword": "password123",
  "newPassword": "newpassword123"
}
```

### Expense Endpoints

#### Get All Expenses
```http
GET /api/expenses?page=1&limit=10&type=expense&category=Food&startDate=2024-01-01&endDate=2024-12-31
Authorization: Bearer <token>
```

#### Get Expense Statistics
```http
GET /api/expenses/stats?startDate=2024-01-01&endDate=2024-12-31
Authorization: Bearer <token>
```

#### Create New Expense
```http
POST /api/expenses
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Grocery Shopping",
  "amount": 150.50,
  "type": "expense",
  "category": "Food & Dining",
  "date": "2024-01-15",
  "description": "Weekly groceries from Walmart"
}
```

#### Get Single Expense
```http
GET /api/expenses/:id
Authorization: Bearer <token>
```

#### Update Expense
```http
PUT /api/expenses/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Updated Grocery Shopping",
  "amount": 160.00,
  "type": "expense",
  "category": "Food & Dining",
  "date": "2024-01-15",
  "description": "Updated description"
}
```

#### Delete Expense
```http
DELETE /api/expenses/:id
Authorization: Bearer <token>
```

#### Delete All User Expenses
```http
DELETE /api/expenses
Authorization: Bearer <token>
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `5000` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/expense-tracker` |
| `JWT_SECRET` | JWT secret key | `your-super-secret-jwt-key` |
| `NODE_ENV` | Environment mode | `development` |

### Database Schema

#### User Schema
```javascript
{
  name: String (required, 2-50 chars),
  email: String (required, unique, valid email),
  password: String (required, min 6 chars, hashed),
  createdAt: Date,
  updatedAt: Date
}
```

#### Expense Schema
```javascript
{
  title: String (required, 1-100 chars),
  amount: Number (required, min 0.01),
  type: String (required, 'income' or 'expense'),
  category: String (required, predefined categories),
  date: Date (required),
  description: String (optional, max 500 chars),
  user: ObjectId (required, ref to User),
  createdAt: Date,
  updatedAt: Date
}
```

## 🛡️ Security Features

- **Password Hashing**: bcryptjs with salt rounds of 12
- **JWT Authentication**: Secure token-based authentication
- **Input Validation**: Express-validator for all inputs
- **CORS Protection**: Configurable CORS settings
- **Security Headers**: Helmet.js for security headers
- **Rate Limiting**: Built-in rate limiting (can be added)
- **SQL Injection Protection**: MongoDB with Mongoose ODM

## 📊 Response Format

### Success Response
```json
{
  "status": "success",
  "message": "Operation completed successfully",
  "data": {
    // Response data
  }
}
```

### Error Response
```json
{
  "status": "error",
  "message": "Error description",
  "errors": [
    {
      "field": "email",
      "message": "Please provide a valid email address"
    }
  ]
}
```

## 🧪 Testing

```bash
# Run tests (when implemented)
npm test

# Run tests in watch mode
npm run test:watch
```

## 📦 Scripts

```bash
# Start development server
npm run dev

# Start production server
npm start

# Run tests
npm test

# Lint code
npm run lint

# Format code
npm run format
```

## 🔍 API Testing

You can test the API using tools like:

- **Postman**: Import the collection file
- **Insomnia**: REST client
- **curl**: Command line tool
- **Thunder Client**: VS Code extension

### Example curl commands:

```bash
# Register a new user
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe","email":"john@example.com","password":"password123"}'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"password123"}'

# Get expenses (replace <token> with actual token)
curl -X GET http://localhost:5000/api/expenses \
  -H "Authorization: Bearer <token>"
```

## 🚀 Deployment

### Production Checklist

1. **Environment Variables**
   - Set `NODE_ENV=production`
   - Use strong `JWT_SECRET`
   - Configure production MongoDB URI

2. **Security**
   - Enable HTTPS
   - Configure CORS for production domain
   - Set up rate limiting
   - Enable request logging

3. **Performance**
   - Enable compression
   - Set up caching
   - Configure database indexes
   - Use PM2 or similar process manager

### Deployment Options

- **Heroku**: Easy deployment with MongoDB Atlas
- **Vercel**: Serverless deployment
- **AWS**: EC2 with MongoDB
- **DigitalOcean**: Droplet with MongoDB
- **Railway**: Simple deployment platform

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:

- Create an issue in the repository
- Contact the development team
- Check the documentation

## 🔄 Version History

- **v1.0.0**: Initial release with basic CRUD operations
- **v1.1.0**: Added statistics and filtering
- **v1.2.0**: Enhanced security and validation 
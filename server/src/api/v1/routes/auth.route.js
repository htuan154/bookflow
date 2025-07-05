// src/api/v1/routes/auth.route.js

const express = require('express');
const authController = require('../controllers/auth.controller');
const { validate, registerSchema, loginSchema } = require('../middlewares/validator.middleware');
const { protect } = require('../middlewares/auth.middleware');

const router = express.Router();

/* #swagger.path = '/api/v1/auth/register'
    #swagger.tags = ['Authentication']
    #swagger.summary = 'Register a new user'
    #swagger.requestBody = {
        required: true,
        content: {
            "application/json": {
                schema: { $ref: "#/definitions/RegisterRequest" }
            }
        }
    }
    #swagger.responses[201] = { description: "User registered successfully." }
    #swagger.responses[400] = { description: "Bad request or user already exists." }
*/
router.post('/register', validate(registerSchema), authController.handleRegister);


/* #swagger.path = '/api/v1/auth/login'
    #swagger.tags = ['Authentication']
    #swagger.summary = 'Log in a user'
    #swagger.requestBody = {
        required: true,
        content: {
            "application/json": {
                schema: { $ref: "#/definitions/LoginRequest" }
            }
        }
    }
    #swagger.responses[200] = { description: "Login successful." }
    #swagger.responses[401] = { description: "Invalid credentials." }
*/
router.post('/login', validate(loginSchema), authController.handleLogin);


/* #swagger.path = '/api/v1/auth/profile'
    #swagger.tags = ['Authentication']
    #swagger.summary = 'Get current user profile'
    #swagger.security = [{ "bearerAuth": [] }]
    #swagger.responses[200] = { description: "User profile retrieved successfully." }
    #swagger.responses[401] = { description: "Unauthorized, token is missing or invalid." }
*/
router.get('/profile', protect, authController.getMyProfile);


/* #swagger.path = '/api/v1/auth/logout'
    #swagger.tags = ['Authentication']
    #swagger.summary = 'Logout user'
    #swagger.security = [{ "bearerAuth": [] }]
    #swagger.responses[200] = { description: "Logout successful." }
*/
router.post('/logout', protect, authController.handleLogout);

module.exports = router;

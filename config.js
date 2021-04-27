"use strict";

exports.DATABASE_URL = process.env.DATABASE_URL || `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@merncluster0.lvrru.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;

exports.TEST_DATABASE_URL = process.env.TEST_DATABASE_URL || `mongodb://localhost/Test-Blogful-local-2021`;

exports.PORT = process.env.PORT || 8080;

exports.GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

exports.JWT_KEY_SECRET = process.env.JWT_KEY_SECRET;

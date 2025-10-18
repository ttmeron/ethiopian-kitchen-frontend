# ethiopian-kitchen-frontend
Full-stack Ethiopian restaurant app with Angular frontend, Spring Boot backend & MySQL. Features secure payments with Stripe and Spring Security.

Title: Ethiopian Kitchen App

This is the official mobile application for Ethiopian Kitchen, A full-stack web application for an authentic Ethiopian restaurant, built with Angular 16+, Spring Boot 2.4, and MySQL 8. The platform enables customers to explore traditional Ethiopian dishes, place orders securely, and process payments via Stripe, all protected by Spring Security.


Core Stack:

Frontend: Angular 16+ with TypeScript, RxJS, Angular Material

Backend: Spring Boot 2.4, Spring Security 5.4.1, JPA/Hibernate

Database: MySQL 8

Payment: Stripe Integration

API Docs: Swagger/OpenAPI 3

🍛 Ethiopian Kitchen - Ethiopian Dining Experience
A comprehensive full-stack web application that brings the authentic taste of Ethiopia to the digital world. This platform features a modern Angular frontend coupled with a robust Spring Boot REST API, providing secure online ordering, payment processing, and restaurant management capabilities.

Frontend (Angular)
Responsive UI built with Angular Material for a consistent cross-device experience

RxJS State Management for reactive data flow

Lazy Loading modules for optimized performance

Type-Safe Services for API communication

Interactive Menu with categories (Meat, Vegan, Fasting Foods)

Shopping Cart with real-time updates

Order Tracking interface

Backend (Spring Boot)
RESTful API with proper HTTP status codes and error handling

Spring Security 6 with JWT authentication

Role-Based Access Control (Customer, Admin, Kitchen Staff)

Stripe Payment Integration with webhook support

Spring Data JPA with Hibernate for ORM

MySQL 8 with optimized queries and indexing
🛠️ Tech Stack
Layer	Technology
Frontend	Angular 16+, TypeScript, RxJS, Angular Material, CSS3
Backend	Spring Boot 3.1+, Spring Security 6, Spring Data JPA, Java 17+
Database	MySQL 8.0+, Hibernate ORM, Connection Pooling
Payment	Stripe API, Webhook handling
Security	JWT, Spring Security, BCrypt Password Encoding
Documentation	Swagger UI, OpenAPI 3
Build Tools	Maven, Angular CLI
Validation	Bean Validation, Custom Validators
Email Service

🚀 Getting Started
Prerequisites
Java 17 or higher

Node.js 18+ and npm

MySQL 8.0+

Angular CLI 16+

Backend Setup
Clone and configure the backend

bash
cd ethiopian-restaurant-backend
mvn clean install
Configure MySQL database

sql
CREATE DATABASE ethiopian_restaurant;
CREATE USER 'app_user'@'localhost' IDENTIFIED BY 'password';
GRANT ALL PRIVILEGES ON ethiopian_restaurant.* TO 'app_user'@'localhost';
Update application.properties

properties
spring.datasource.url=jdbc:mysql://localhost:3306/ethiopian_restaurant
spring.datasource.username=app_user
spring.datasource.password=password
stripe.secret-key=your_stripe_secret_key
jwt.secret=your_jwt_secret
Run the Spring Boot application

bash
mvn spring-boot:run
Access API Documentation

text
http://localhost:8080/swagger-ui/index.html
Frontend Setup
Navigate to frontend directory

bash
cd ethiopian-restaurant-frontend
npm install
Configure environment

typescript
// src/environments/environment.ts
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080/api/v1',
  stripePublishableKey: 'your_stripe_publishable_key'
};
Serve the Angular application

bash
ng serve
Access the application

text
http://localhost:4200
📁 Project Structure
Backend Structure
text
src/main/java/com/ethiopianrestaurant/
├── config/          # Security, Web, Stripe config
├── controller/      # REST APIs
├── service/         # Business logic
├── repository/      # Data access layer
├── model/          # JPA Entities & DTOs
├── security/       # JWT, UserDetailsService
├── payment/        # Stripe integration
└── exception/      # Global exception handling
Frontend Structure
text
src/app/
├── modules/
│   ├── auth/           # Login/register
│   ├── menu/           # Menu display
│   ├── orders/         # Order management
│   └── admin/          # Admin dashboard
├── core/
│   ├── services/       # API services
│   ├── guards/         # Route protection
│   ├── interceptors/   # HTTP interceptors
│   └── models/         # TypeScript interfaces
├── shared/             # Reusable components
└── assets/             # Images, styles
🔐 Security Features
JWT Authentication with access/refresh tokens

Spring Security role-based authorization

Password encryption with BCrypt

CORS configuration for frontend-backend communication

Stripe webhook signature verification

SQL injection prevention through parameterized queries

XSS protection through input sanitization

💳 Payment Integration
The application integrates Stripe for secure payment processing:

Credit card payments with Stripe Elements

Webhook handling for payment confirmation

Payment intent creation and confirmation

Refund processing capabilities

🧪 Testing
Backend Tests
bash
mvn test
# Integration tests
mvn verify
Frontend Tests
bash
ng test
ng e2e
🤝 Contributing
Fork the repository

Create a feature branch (git checkout -b feature/amazing-feature)

Commit your changes (git commit -m 'Add amazing feature')

Push to the branch (git push origin feature/amazing-feature)

Open a Pull Request





for order confirmations and notifications

Swagger/OpenAPI 3 documentation

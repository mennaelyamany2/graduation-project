# Doktorz - Doctor Appointment Booking System

Welcome to Doktorz, a backend RESTful API designed to streamline the process of booking appointments with doctors. This project aims to make the healthcare experience more efficient and patient-friendly by reducing waiting times, providing real-time notifications, and offering various other features.

## Key Features

- **Reduce Waiting Time**: Minimize waiting times with real-time notifications that update users on how much time is left until their appointment.
- **Notification System**: Regular notifications keep users informed about their queue status and appointment schedules.
- **Chatbot Assistance**: Engage with a chatbot for quicker and more efficient communication regarding appointments and health queries.
- **Private Prescription**: Ensure privacy for prescriptions between the patient and the doctor.

## Project Overview

This project leverages various technologies and architectural patterns to deliver a robust and scalable solution:

- **Node.js**: JavaScript runtime for building fast and scalable network applications.
- **Express**: Web application framework for Node.js, providing a robust set of features for web and mobile applications.
- **MongoDB**: NoSQL database for storing application data.
- **Mongoose**: Elegant MongoDB object modeling for Node.js.
- **JWT**: JSON Web Tokens for secure authentication.
- **Validation**: Ensure data integrity and security.
- **MVC Architecture**: Model-View-Controller pattern to separate concerns and improve code maintainability.
- **Paymob**: Payment gateway integration for handling transactions.

## Getting Started

### Prerequisites

Ensure you have the following installed on your system:

- Node.js
- MongoDB

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/Ahmed-Elhosiny/doktorz.git
2. Install dependencies:
    ```bash
    npm install
### Configuration

1. Create a .env file in the root directory and add your environment variables:
    ```plaintext
    NODE_ENV= development
    PORT=
    # DATABASE
    DATABASE_URL=
    DATABASE_PASSWORD=


    #JWT
    JWT_SECRET=
    JWT_EXPIRES_IN=
    JWT_COOKIE_EXPIRES_IN=

    # EMAILS
    EMAIL_HOST=
    EMAIL_PORT=
    EMAIL_USERNAME=
    EMAIL_PASSWORD=
    EMAIL_FROM=

    # SENDGRID
    SENDGRID_USERNAME=
    SENDGRID_PASSWORD=

    # Session
    SESSION_SECRET=

    # Paymob
    paymobApiKey=
    paymobSecretLive=
    paymobSecretTest=
    paymobPublicLive=
    paymobPublicTest=
    HMAC=
    iframe=
    integrationId=

### Running the Application
1. Start the development server:
    ```bash
    npm run dev
2. Start the production server:
    ```bash
    npm run prod
### API Documentation
Detailed API documentation is available [here](https://documenter.getpostman.com/view/30537561/2sA2rGte8f#5417ac6b-5b85-49dc-b2d6-4eeae746fab6).

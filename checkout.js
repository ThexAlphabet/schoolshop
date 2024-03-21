const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const path = require('path');
const dotenv = require('dotenv');
const router = require('./routes/index');
const logger = require('morgan');
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const { auth } = require('express-openid-connect');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const session = require('express-session');
const { sendToDiscordWebhook } = require('./utils');
const Discord = require('discord.js');
const nodemailer = require('nodemailer');
const axios = require('axios'); // Import axios module



console.log('THIS IS TEST MESSAGE FROM JOE')
console.log('JOE IS DUM')
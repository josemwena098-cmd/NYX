const config = require('../config');
const fs = require('fs');
const path = require('path');

let currentPrefix = config.PREFIX; // default prefix from settings.js
let userPrefixes = new Map(); // Store user-specific prefixes

// Load user prefixes from file
const PREFIX_FILE = path.join(__dirname, '..', 'data', 'user_prefixes.json');
function loadUserPrefixes() {
  try {
    if (fs.existsSync(PREFIX_FILE)) {
      const data = fs.readFileSync(PREFIX_FILE, 'utf8');
      const parsed = JSON.parse(data);
      userPrefixes = new Map(Object.entries(parsed));
    }
  } catch (error) {
    console.error('Error loading user prefixes:', error);
  }
}

// Save user prefixes to file
function saveUserPrefixes() {
  try {
    const data = Object.fromEntries(userPrefixes);
    fs.writeFileSync(PREFIX_FILE, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error saving user prefixes:', error);
  }
}

// Load prefixes on startup
loadUserPrefixes();

function getPrefix(userId = null) {
  if (userId && userPrefixes.has(userId)) {
    return userPrefixes.get(userId);
  }
  return currentPrefix;
}

function setPrefix(newPrefix, userId = null) {
  if (userId) {
    userPrefixes.set(userId, newPrefix);
    saveUserPrefixes();
  } else {
    currentPrefix = newPrefix;
  }
}

function resetUserPrefix(userId) {
  if (userPrefixes.has(userId)) {
    userPrefixes.delete(userId);
    saveUserPrefixes();
    return true;
  }
  return false;
}

function getAllUserPrefixes() {
  return Object.fromEntries(userPrefixes);
}

module.exports = {
  getPrefix,
  setPrefix,
  resetUserPrefix,
  getAllUserPrefixes,
  loadUserPrefixes
};


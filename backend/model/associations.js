const Policies = require('./policiesModel');
const Programs = require('./programsModel');
const Python = require('./pythonModel');
const Report = require('./reportModel');
const UninstallPrograms = require('./uninstallProgramsModel');
const User = require('./userModel');
const WinSettings = require('./winSettingsModel');

// Export all models for easy access
module.exports = {
  Policies,
  Programs,
  Python,
  Report,
  UninstallPrograms,
  User,
  WinSettings
};

const express = require("express");
const { Sequelize } = require("sequelize");
const sequelize = require("./sequelizeInstance.js");
const { Op } = require("sequelize");
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const config = require("./auth.config.js");
const authJwt = require("./authJwt.js");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const PizZip = require("pizzip");
const https = require('https');
const { execSync } = require('child_process');
const app = express();

// Configure CORS
/*const corsOptions = {
  origin: ['https://izvedbeni-plan.veleri.hr', 'http://localhost:9000'], // Add your frontend domains
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 200
};*/

// SSL certificate configuration with passphrase
/*const sslOptions = {
  key: fs.readFileSync(path.join(__dirname, 'ssl', 'privateKey.pem')),
  cert: fs.readFileSync(path.join(__dirname, 'ssl', 'izvedbeni_veleri_2025.pem')),
  passphrase: execSync('/home/dlulic/sslpassphrase.conf').toString().trim()
};*/

// Parser za JSON podatke
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());

const { Policies, Programs, Python, Report, UninstallPrograms, User, WinSettings } = require("./model/associations.js");

const port = process.env.PORT || 3000;

// Authenticate and sync the database before starting the server
sequelize
  .authenticate()
  .then(() => {
    console.log("Database connection has been established successfully.");
  })
  .then(() => {
    // Create HTTPS server
    /*const httpsServer = https.createServer(app);
    httpsServer.listen(port, () => {
      console.log(`HTTPS Server running on port ${port}`);*/
      app.listen(port, () => {
        console.log("Server Listening on PORT:", port);
    });
  })
  .catch((error) => {
    console.error("Unable to connect to the database:", error);
  });

app.get("/status", (request, response) => {
  const status = {
    Status: "Running",
  };
  response.send(status);
});

//Login
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    // Find the user by email
    const userLogin = await User.findOne({
      where: {
        email: email,
      },
    });

    if (!userLogin) {
      // If the user is not found
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    // Compare passwords using bcrypt
    const bcryptRes = await bcrypt.compare(password, userLogin.password);
    if (!bcryptRes) {
      // If the password comparison fails
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    // Generate a JWT token (access token)
    const token = jwt.sign(
      {
        id: userLogin.user_id,
        role: userLogin.role,
        email: userLogin.email,
      },
      config.secret,
      { expiresIn: "1h" } // Access token expires in 1 hour
    );

    // Generate a refresh token
    const refreshToken = jwt.sign(
      { id: userLogin.user_id },
      config.secret,
      { expiresIn: "7d" } // Refresh token expires in 7 days
    );

    // Save the refresh token in the database
    await User.update({ refresh_token: refreshToken }, { where: { user_id: userLogin.user_id } });

    // Send back a success response with both tokens
    return res.status(200).json({
      success: true,
      message: "Login successful",
      token: token, // Access token
      refreshToken: refreshToken, // Refresh token
    });
  } catch (error) {
    console.error("Error during login:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
});

//Refresh token
app.post("/api/refresh-token", async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(403).json({ message: "Refresh token is required" });
  }

  try {
    // Verify the refresh token
    const decoded = jwt.verify(refreshToken, config.secret);

    // Find the user by ID and verify the refresh token matches
    const userLogin = await User.findOne({
      where: { user_id: decoded.id, refresh_token: refreshToken },
    });

    if (!userLogin) {
      return res.status(403).json({ message: "Invalid refresh token" });
    }

    // Generate a new access token
    const newToken = jwt.sign(
      {
        id: userLogin.user_id,
        role: userLogin.role,
        email: userLogin.email,
      },
      config.secret,
      { expiresIn: "1h" }
    );

    return res.status(200).json({
      success: true,
      token: newToken,
    });
  } catch (error) {
    console.error("Error refreshing token:", error);
    return res.status(401).json({ message: "Unauthorized" });
  }
});

// Logout
app.post("/api/logout", async (req, res) => {
  const { userId } = req.body;

  try {
    await User.update({ refresh_token: null }, { where: { user_id: userId } });

    return res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Error during logout:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// ------------------------------ GET API ------------------------------

// Windows Settings API
app.get("/api/windows-settings", authJwt.verifyToken("Admin"), async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;


      
    const settings = await WinSettings.findAll({
      limit: parseInt(limit),
      offset: parseInt(offset),
    });
    res.status(200).json(settings);
  } catch (error) {
    console.error("Error fetching Windows settings:", error);
    res.status(500).json({ error: true, message: "Failed to fetch Windows settings" });
  }
});

app.get("/api/windows-settings/:id", authJwt.verifyToken("Admin"), async (req, res) => {
  try {
    const setting = await WinSettings.findByPk(req.params.id);
    if (!setting) {
      return res.status(404).json({ error: true, message: "Setting not found" });
    }
    res.status(200).json(setting);
  } catch (error) {
    console.error("Error fetching Windows setting:", error);
    res.status(500).json({ error: true, message: "Failed to fetch Windows setting" });
  }
});

// Policies API
app.get("/api/policies", authJwt.verifyToken("Admin"), async (req, res) => {
  try {
    const policies = await Policies.findAll();
    res.status(200).json(policies);
  } catch (error) {
    console.error("Error fetching policies:", error);
    res.status(500).json({ error: true, message: "Failed to fetch policies" });
  }
});

app.get("/api/policies/:id", authJwt.verifyToken("Admin"), async (req, res) => {
  try {
    const policy = await Policies.findByPk(req.params.id);
    if (!policy) {
      return res.status(404).json({ error: true, message: "Policy not found" });
    }
    res.status(200).json(policy);
  } catch (error) {
    console.error("Error fetching policy:", error);
    res.status(500).json({ error: true, message: "Failed to fetch policy" });
  }
});

// Programs API
app.get("/api/programs", authJwt.verifyToken("Admin"), async (req, res) => {
  try {
    const programs = await Programs.findAll();
    res.status(200).json(programs);
  } catch (error) {
    console.error("Error fetching programs:", error);
    res.status(500).json({ error: true, message: "Failed to fetch programs" });
  }
});

app.get("/api/programs/:id", authJwt.verifyToken("Admin"), async (req, res) => {
  try {
    const program = await Programs.findByPk(req.params.id);
    if (!program) {
      return res.status(404).json({ error: true, message: "Program not found" });
    }
    res.status(200).json(program);
  } catch (error) {
    console.error("Error fetching program:", error);
    res.status(500).json({ error: true, message: "Failed to fetch program" });
  }
});

app.get("/api/programs/category/:category", authJwt.verifyToken("Admin"), async (req, res) => {
  try {
    const programs = await Programs.findAll({
      where: { program_category: req.params.category }
    });
    res.status(200).json(programs);
  } catch (error) {
    console.error("Error fetching programs by category:", error);
    res.status(500).json({ error: true, message: "Failed to fetch programs by category" });
  }
});

// Python Packages API
app.get("/api/python-packages", authJwt.verifyToken("Admin"), async (req, res) => {
  try {
    const packages = await Python.findAll();
    res.status(200).json(packages);
  } catch (error) {
    console.error("Error fetching Python packages:", error);
    res.status(500).json({ error: true, message: "Failed to fetch Python packages" });
  }
});

app.get("/api/python-packages/:id", authJwt.verifyToken("Admin"), async (req, res) => {
  try {
    const package = await Python.findByPk(req.params.id);
    if (!package) {
      return res.status(404).json({ error: true, message: "Package not found" });
    }
    res.status(200).json(package);
  } catch (error) {
    console.error("Error fetching Python package:", error);
    res.status(500).json({ error: true, message: "Failed to fetch Python package" });
  }
});

// Uninstall Programs API
app.get("/api/uninstall-programs", authJwt.verifyToken("Admin"), async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = req.query.limit !== undefined ? parseInt(req.query.limit) : 10;
    const { sortBy, descending, search } = req.query;

    const findOptions = {
      order: [[sortBy || 'uninstall_name', descending === 'true' ? 'DESC' : 'ASC']]
    };

    const where = {};
    if (search) {
      where[Op.or] = [
        { uninstall_name: { [Op.like]: `%${search}%` } },
        { uninstall_name_program: { [Op.like]: `%${search}%` } }
      ];
    }
    findOptions.where = where;

    const totalPrograms = await UninstallPrograms.count({ where });

    if (limit > 0) {
      const offset = (page - 1) * limit;
      findOptions.limit = limit;
      findOptions.offset = offset;
    }

    const programs = await UninstallPrograms.findAll(findOptions);

    res.status(200).json({
      items: programs,
      total: totalPrograms
    });
  } catch (error) {
    console.error("Error fetching uninstall programs:", error);
    res.status(500).json({ error: true, message: "Failed to fetch uninstall programs" });
  }
});

app.get("/api/uninstall-programs/:id", authJwt.verifyToken("Admin"), async (req, res) => {
  try {
    const program = await UninstallPrograms.findByPk(req.params.id);
    if (!program) {
      return res.status(404).json({ error: true, message: "Uninstall program not found" });
    }
    res.status(200).json(program);
  } catch (error) {
    console.error("Error fetching uninstall program:", error);
    res.status(500).json({ error: true, message: "Failed to fetch uninstall program" });
  }
});

app.get("/api/reports/statistics", authJwt.verifyToken("Admin"), async (req, res) => {
  try {
    const totalReports = await Report.count();
    const successReports = await Report.count({ where: { report_status: 'success' } });
    const failureReports = await Report.count({ where: { report_status: 'failure' } });
    const additionalReports = await Report.count({ where: { report_status: 'additional' } });
    
    // Get unique computers
    const computers = await Report.findAll({
      attributes: [[sequelize.fn('DISTINCT', sequelize.col('report_computer_name')), 'computer_name']],
      raw: true
    });
    
    res.status(200).json({
      totalReports,
      successReports,
      failureReports,
      additionalReports,
      totalComputers: computers.length
    });
  } catch (error) {
    console.error("Error fetching report statistics:", error);
    res.status(500).json({ error: true, message: "Failed to fetch report statistics" });
  }
});

// Reports API
app.get("/api/reports", authJwt.verifyToken("Admin"), async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;


    const reports = await Report.findAll({
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['report_timestamp', 'DESC']]
    });
    res.status(200).json(reports);
  } catch (error) {
    console.error("Error fetching reports:", error);
    res.status(500).json({ error: true, message: "Failed to fetch reports" });
  }
});

// Reports API
app.get("/api/reports-all", authJwt.verifyToken("Admin"), async (req, res) => {
  try {
    const reports = await Report.findAll({
      order: [['report_timestamp', 'DESC']]
    });
    res.status(200).json(reports);
  } catch (error) {
    console.error("Error fetching reports:", error);
    res.status(500).json({ error: true, message: "Failed to fetch reports" });
  }
});

app.get("/api/reports/:id", authJwt.verifyToken("Admin"), async (req, res) => {
  try {
    const report = await Report.findByPk(req.params.id);
    if (!report) {
      return res.status(404).json({ error: true, message: "Report not found" });
    }
    res.status(200).json(report);
  } catch (error) {
    console.error("Error fetching report:", error);
    res.status(500).json({ error: true, message: "Failed to fetch report" });
  }
});

app.get("/api/reports/computer/:computerName", authJwt.verifyToken("Admin"), async (req, res) => {
  try {
    const reports = await Report.findAll({
      where: { report_computer_name: req.params.computerName },
      order: [['report_timestamp', 'DESC']]
    });
    res.status(200).json(reports);
  } catch (error) {
    console.error("Error fetching reports by computer:", error);
    res.status(500).json({ error: true, message: "Failed to fetch reports by computer" });
  }
});

app.get("/api/reports/status/:status", authJwt.verifyToken("Admin"), async (req, res) => {
  try {
    const reports = await Report.findAll({
      where: { report_status: req.params.status },
      order: [['report_timestamp', 'DESC']]
    });
    res.status(200).json(reports);
  } catch (error) {
    console.error("Error fetching reports by status:", error);
    res.status(500).json({ error: true, message: "Failed to fetch reports by status" });
  }
});

app.get("/api/reports/task-type/:taskType", authJwt.verifyToken("Admin"), async (req, res) => {
  try {
    const reports = await Report.findAll({
      where: { report_task_type: req.params.taskType },
      order: [['report_timestamp', 'DESC']]
    });
    res.status(200).json(reports);
  } catch (error) {
    console.error("Error fetching reports by task type:", error);
    res.status(500).json({ error: true, message: "Failed to fetch reports by task type" });
  }
});

// System Status API
app.get("/api/system/status", authJwt.verifyToken("Admin"), async (req, res) => {
  try {
    const status = {
      database: "Connected",
      server: "Running",
      timestamp: new Date(),
      uptime: process.uptime()
    };
    res.status(200).json(status);
  } catch (error) {
    console.error("Error fetching system status:", error);
    res.status(500).json({ error: true, message: "Failed to fetch system status" });
  }
});

// User Management API
app.get("/api/users", authJwt.verifyToken("Admin"), async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const users = await User.findAll({
      limit: parseInt(limit),
      offset: parseInt(offset),
      attributes: ['user_id', 'email', 'role'], // Don't include password or refresh_token
      order: [['user_id', 'DESC']] // Order by user_id since no timestamps
    });

    const totalUsers = await User.count();

    res.status(200).json({
      users: users,
      total: totalUsers,
      page: page,
      limit: limit
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: true, message: "Failed to fetch users" });
  }
});

app.get("/api/users/statistics", authJwt.verifyToken("Admin"), async (req, res) => {
  try {
    const totalUsers = await User.count();
    const adminUsers = await User.count({ where: { role: 'Admin' } });
    
    res.status(200).json({
      totalUsers,
      adminUsers
    });
  } catch (error) {
    console.error("Error fetching user statistics:", error);
    res.status(500).json({ error: true, message: "Failed to fetch user statistics" });
  }
});

app.get("/api/users/:id", authJwt.verifyToken("Admin"), async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: ['user_id', 'email', 'role'] // Don't include password or refresh_token
    });
    
    if (!user) {
      return res.status(404).json({ error: true, message: "User not found" });
    }
    
    res.status(200).json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ error: true, message: "Failed to fetch user" });
  }
});

app.put("/api/users/:id", authJwt.verifyToken("Admin"), async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ error: true, message: "User not found" });
    }

    const { email, password, role } = req.body;

    // Check if email is being changed and if it already exists
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        return res.status(409).json({
          error: true,
          message: "Email već postoji.",
        });
      }
    }

    const updateData = {};
    if (email) updateData.email = email;
    if (role) updateData.role = role;
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    await user.update(updateData);
    
    // Return user without password
    const updatedUser = await User.findByPk(req.params.id, {
      attributes: ['user_id', 'email', 'role']
    });
    
    res.status(200).json(updatedUser);
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ error: true, message: "Failed to update user" });
  }
});

app.delete("/api/users/:id", authJwt.verifyToken("Admin"), async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ error: true, message: "User not found" });
    }

    // Prevent deleting the last admin user
    if (user.role === 'Admin') {
      const adminCount = await User.count({ where: { role: 'Admin' } });
      if (adminCount <= 1) {
        return res.status(400).json({ 
          error: true, 
          message: "Cannot delete the last admin user" 
        });
      }
    }

    await user.destroy();
    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ error: true, message: "Failed to delete user" });
  }
});

// ------------------------------ POST API ------------------------------

// Windows Settings API
app.post("/api/windows-settings", authJwt.verifyToken("Admin"), async (req, res) => {
  const { settings_name, settings_command, settings_enable } = req.body;
  
  if (!settings_name || !settings_command) {
    return res.status(400).json({
      error: true,
      message: "Settings name and command are required"
    });
  }

  try {
    const newSetting = await WinSettings.create({
      settings_name,
      settings_command,
      settings_enable: settings_enable !== undefined ? settings_enable : true
    });
    
    res.status(201).json(newSetting);
  } catch (error) {
    console.error("Error creating Windows setting:", error);
    res.status(500).json({ error: true, message: "Failed to create Windows setting" });
  }
});

app.post("/api/windows-settings/:id/execute", authJwt.verifyToken("Admin"), async (req, res) => {
  try {
    const setting = await WinSettings.findByPk(req.params.id);
    if (!setting) {
      return res.status(404).json({ error: true, message: "Setting not found" });
    }

    // Mock execution - in real implementation, you would execute the command
    const result = {
      success: true,
      message: `Setting "${setting.settings_name}" executed successfully`,
      command: setting.settings_command,
      timestamp: new Date()
    };

    // Create a report entry
    await Report.create({
      report_computer_name: req.body.computerName || 'Unknown',
      report_task_type: 'windows settings',
      report_task_name: setting.settings_name,
      report_status: 'success',
      report_timestamp: new Date()
    });

    res.status(200).json(result);
  } catch (error) {
    console.error("Error executing Windows setting:", error);
    res.status(500).json({ error: true, message: "Failed to execute Windows setting" });
  }
});

// Policies API
app.post("/api/policies", authJwt.verifyToken("Admin"), async (req, res) => {
  const { policies_name, policies_regName, policies_regPath, policies_regVaule, policies_regVauleRevert, policies_type, policies_enable } = req.body;
  
  if (!policies_name || !policies_regName || !policies_regPath || !policies_regVaule || !policies_regVauleRevert || !policies_type) {
    return res.status(400).json({
      error: true,
      message: "All policy fields are required"
    });
  }

  try {
    const newPolicy = await Policies.create({
      policies_name,
      policies_regName,
      policies_regPath,
      policies_regVaule,
      policies_regVauleRevert,
      policies_type,
      policies_enable: policies_enable !== undefined ? policies_enable : true
    });
    
    res.status(201).json(newPolicy);
  } catch (error) {
    console.error("Error creating policy:", error);
    res.status(500).json({ error: true, message: "Failed to create policy" });
  }
});

app.post("/api/policies/:id/apply", authJwt.verifyToken("Admin"), async (req, res) => {
  try {
    const policy = await Policies.findByPk(req.params.id);
    if (!policy) {
      return res.status(404).json({ error: true, message: "Policy not found" });
    }

    // Mock application - in real implementation, you would apply the registry policy
    const result = {
      success: true,
      message: `Policy "${policy.policies_name}" applied successfully`,
      registryPath: policy.policies_regPath,
      registryValue: policy.policies_regVaule,
      timestamp: new Date()
    };

    // Create a report entry
    await Report.create({
      report_computer_name: req.body.computerName || 'Unknown',
      report_task_type: 'group policy',
      report_task_name: policy.policies_name,
      report_status: 'success',
      report_timestamp: new Date()
    });

    res.status(200).json(result);
  } catch (error) {
    console.error("Error applying policy:", error);
    res.status(500).json({ error: true, message: "Failed to apply policy" });
  }
});

// Programs API
app.post("/api/programs", authJwt.verifyToken("Admin"), async (req, res) => {
  const { program_name, program_desc, program_category, program_package, program_enabled } = req.body;
  
  if (!program_name || !program_category || !program_package) {
    return res.status(400).json({
      error: true,
      message: "Program name, category, and package are required"
    });
  }

  try {
    const newProgram = await Programs.create({
      program_name,
      program_desc,
      program_category,
      program_package,
      program_enabled: program_enabled !== undefined ? program_enabled : true
    });
    
    res.status(201).json(newProgram);
  } catch (error) {
    console.error("Error creating program:", error);
    res.status(500).json({ error: true, message: "Failed to create program" });
  }
});

app.post("/api/programs/:id/install", authJwt.verifyToken("Admin"), async (req, res) => {
  try {
    const program = await Programs.findByPk(req.params.id);
    if (!program) {
      return res.status(404).json({ error: true, message: "Program not found" });
    }

    // Mock installation - in real implementation, you would install the program
    const result = {
      success: true,
      message: `Program "${program.program_name}" installation started`,
      package: program.program_package,
      timestamp: new Date()
    };

    // Create a report entry
    await Report.create({
      report_computer_name: req.body.computerName || 'Unknown',
      report_task_type: program.program_category === 'Instalacija dodataka' ? 'instalacija dodataka' : 'instalacija programa',
      report_task_name: program.program_name,
      report_status: 'success',
      report_timestamp: new Date()
    });

    res.status(200).json(result);
  } catch (error) {
    console.error("Error installing program:", error);
    res.status(500).json({ error: true, message: "Failed to install program" });
  }
});

// Python Packages API
app.post("/api/python-packages", authJwt.verifyToken("Admin"), async (req, res) => {
  const { python_name, python_desc } = req.body;
  
  if (!python_name || !python_desc) {
    return res.status(400).json({
      error: true,
      message: "Package name and description are required"
    });
  }

  try {
    const newPackage = await Python.create({
      python_name,
      python_desc
    });
    
    res.status(201).json(newPackage);
  } catch (error) {
    console.error("Error creating Python package:", error);
    res.status(500).json({ error: true, message: "Failed to create Python package" });
  }
});

app.post("/api/python-packages/:id/install", authJwt.verifyToken("Admin"), async (req, res) => {
  try {
    const package = await Python.findByPk(req.params.id);
    if (!package) {
      return res.status(404).json({ error: true, message: "Package not found" });
    }

    // Mock installation - in real implementation, you would install the Python package
    const result = {
      success: true,
      message: `Python package "${package.python_name}" installation started`,
      package: package.python_name,
      timestamp: new Date()
    };

    // Create a report entry
    await Report.create({
      report_computer_name: req.body.computerName || 'Unknown',
      report_task_type: 'python dependencies',
      report_task_name: package.python_name,
      report_status: 'success',
      report_timestamp: new Date()
    });

    res.status(200).json(result);
  } catch (error) {
    console.error("Error installing Python package:", error);
    res.status(500).json({ error: true, message: "Failed to install Python package" });
  }
});

// Uninstall Programs API
app.post("/api/uninstall-programs", authJwt.verifyToken("Admin"), async (req, res) => {
  const { uninstall_name, uninstall_name_program, uninstall_source } = req.body;
  
  if (!uninstall_name || !uninstall_name_program || !uninstall_source) {
    return res.status(400).json({
      error: true,
      message: "Uninstall name, program name, and source are required"
    });
  }

  try {
    const newUninstallProgram = await UninstallPrograms.create({
      uninstall_name,
      uninstall_name_program,
      uninstall_source
    });
    
    res.status(201).json(newUninstallProgram);
  } catch (error) {
    console.error("Error creating uninstall program:", error);
    res.status(500).json({ error: true, message: "Failed to create uninstall program" });
  }
});

app.post("/api/uninstall-programs/:id/uninstall", authJwt.verifyToken("Admin"), async (req, res) => {
  try {
    const program = await UninstallPrograms.findByPk(req.params.id);
    if (!program) {
      return res.status(404).json({ error: true, message: "Uninstall program not found" });
    }

    // Mock uninstallation - in real implementation, you would uninstall the program
    const result = {
      success: true,
      message: `Program "${program.uninstall_name_program}" uninstallation started`,
      source: program.uninstall_source,
      timestamp: new Date()
    };

    // Create a report entry
    await Report.create({
      report_computer_name: req.body.computerName || 'Unknown',
      report_task_type: 'brisanje programa',
      report_task_name: program.uninstall_name_program,
      report_status: 'success',
      report_timestamp: new Date()
    });

    res.status(200).json(result);
  } catch (error) {
    console.error("Error uninstalling program:", error);
    res.status(500).json({ error: true, message: "Failed to uninstall program" });
  }
});

// Reports API
app.post("/api/reports", authJwt.verifyToken("Admin"), async (req, res) => {
  const { report_computer_name, report_task_type, report_task_name, report_status } = req.body;
  
  if (!report_computer_name || !report_task_type || !report_task_name || !report_status) {
    return res.status(400).json({
      error: true,
      message: "All report fields are required"
    });
  }

  try {
    const newReport = await Report.create({
      report_computer_name,
      report_task_type,
      report_task_name,
      report_status,
      report_timestamp: new Date()
    });
    
    res.status(201).json(newReport);
  } catch (error) {
    console.error("Error creating report:", error);
    res.status(500).json({ error: true, message: "Failed to create report" });
  }
});

// Batch Operations API
app.post("/api/batch/install-programs", authJwt.verifyToken("Admin"), async (req, res) => {
  const { programIds, computerName } = req.body;
  
  if (!programIds || !Array.isArray(programIds) || programIds.length === 0) {
    return res.status(400).json({
      error: true,
      message: "Program IDs array is required"
    });
  }

  try {
    const programs = await Programs.findAll({
      where: { program_id: programIds }
    });

    const results = [];
    for (const program of programs) {
      // Mock batch installation
      results.push({
        program_id: program.program_id,
        program_name: program.program_name,
        status: 'success',
        message: `Installation started for ${program.program_name}`
      });

      // Create report entries
      await Report.create({
        report_computer_name: computerName || 'Unknown',
        report_task_type: program.program_category === 'Instalacija dodataka' ? 'instalacija dodataka' : 'instalacija programa',
        report_task_name: program.program_name,
        report_status: 'success',
        report_timestamp: new Date()
      });
    }

    res.status(200).json({
      success: true,
      message: `Batch installation started for ${programs.length} programs`,
      results
    });
  } catch (error) {
    console.error("Error in batch program installation:", error);
    res.status(500).json({ error: true, message: "Failed to start batch installation" });
  }
});

app.post("/api/batch/apply-policies", authJwt.verifyToken("Admin"), async (req, res) => {
  const { policyIds, computerName } = req.body;
  
  if (!policyIds || !Array.isArray(policyIds) || policyIds.length === 0) {
    return res.status(400).json({
      error: true,
      message: "Policy IDs array is required"
    });
  }

  try {
    const policies = await Policies.findAll({
      where: { policies_id: policyIds }
    });

    const results = [];
    for (const policy of policies) {
      // Mock batch policy application
      results.push({
        policy_id: policy.policies_id,
        policy_name: policy.policies_name,
        status: 'success',
        message: `Policy applied: ${policy.policies_name}`
      });

      // Create report entries
      await Report.create({
        report_computer_name: computerName || 'Unknown',
        report_task_type: 'group policy',
        report_task_name: policy.policies_name,
        report_status: 'success',
        report_timestamp: new Date()
      });
    }

    res.status(200).json({
      success: true,
      message: `Batch policy application completed for ${policies.length} policies`,
      results
    });
  } catch (error) {
    console.error("Error in batch policy application:", error);
    res.status(500).json({ error: true, message: "Failed to apply batch policies" });
  }
});

// User Management API
app.post("/api/new-user", authJwt.verifyToken("Admin"), async (req, res) => {
  const { email, password, role } = req.body;
  const refresh_token = null;
  if (!email || !password || !role) {
    return res.status(400).json({
      error: true,
      message: "Fields email, password and role are required.",
    });
  }

  const validEnum = ["Admin"];
  if (!validEnum.includes(role)) {
    return res.status(400).json({
      error: true,
      message: `Invalid role. Accepted values are: ${validEnum.join(", ")}`,
    });
  }

  try {
    // Check if email already exists in the database
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(409).json({
        error: true,
        message: "Email već postoji.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      email,
      password: hashedPassword,
      role,
      refresh_token,
    });

    // Return user without password
    const userResponse = await User.findByPk(newUser.user_id, {
      attributes: ['user_id', 'email', 'role']
    });

    res.status(201).json({
      error: false,
      message: "User created successfully",
      user: userResponse
    });
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({
      error: true,
      message: "Failed to create user.",
    });
  }
});

// ------------------------------ PUT API ------------------------------

// Windows Settings API
app.put("/api/windows-settings/:id", authJwt.verifyToken("Admin"), async (req, res) => {
  try {
    const setting = await WinSettings.findByPk(req.params.id);
    if (!setting) {
      return res.status(404).json({ error: true, message: "Setting not found" });
    }

    await setting.update(req.body);
    res.status(200).json(setting);
  } catch (error) {
    console.error("Error updating Windows setting:", error);
    res.status(500).json({ error: true, message: "Failed to update Windows setting" });
  }
});

// Policies API
app.put("/api/policies/:id", authJwt.verifyToken("Admin"), async (req, res) => {
  try {
    const policy = await Policies.findByPk(req.params.id);
    if (!policy) {
      return res.status(404).json({ error: true, message: "Policy not found" });
    }

    await policy.update(req.body);
    res.status(200).json(policy);
  } catch (error) {
    console.error("Error updating policy:", error);
    res.status(500).json({ error: true, message: "Failed to update policy" });
  }
});

// Programs API
app.put("/api/programs/:id", authJwt.verifyToken("Admin"), async (req, res) => {
  try {
    const program = await Programs.findByPk(req.params.id);
    if (!program) {
      return res.status(404).json({ error: true, message: "Program not found" });
    }

    await program.update(req.body);
    res.status(200).json(program);
  } catch (error) {
    console.error("Error updating program:", error);
    res.status(500).json({ error: true, message: "Failed to update program" });
  }
});

// Python Packages API
app.put("/api/python-packages/:id", authJwt.verifyToken("Admin"), async (req, res) => {
  try {
    const package = await Python.findByPk(req.params.id);
    if (!package) {
      return res.status(404).json({ error: true, message: "Package not found" });
    }

    await package.update(req.body);
    res.status(200).json(package);
  } catch (error) {
    console.error("Error updating Python package:", error);
    res.status(500).json({ error: true, message: "Failed to update Python package" });
  }
});

// Uninstall Programs API
app.put("/api/uninstall-programs/:id", authJwt.verifyToken("Admin"), async (req, res) => {
  try {
    const program = await UninstallPrograms.findByPk(req.params.id);
    if (!program) {
      return res.status(404).json({ error: true, message: "Uninstall program not found" });
    }

    await program.update(req.body);
    res.status(200).json(program);
  } catch (error) {
    console.error("Error updating uninstall program:", error);
    res.status(500).json({ error: true, message: "Failed to update uninstall program" });
  }
});

// ------------------------------ DELETE API ------------------------------

// Windows Settings API
app.delete("/api/windows-settings/:id", authJwt.verifyToken("Admin"), async (req, res) => {
  try {
    const setting = await WinSettings.findByPk(req.params.id);
    if (!setting) {
      return res.status(404).json({ error: true, message: "Setting not found" });
    }

    await setting.destroy();
    res.status(200).json({ message: "Windows setting deleted successfully" });
  } catch (error) {
    console.error("Error deleting Windows setting:", error);
    res.status(500).json({ error: true, message: "Failed to delete Windows setting" });
  }
});

// Policies API
app.delete("/api/policies/:id", authJwt.verifyToken("Admin"), async (req, res) => {
  try {
    const policy = await Policies.findByPk(req.params.id);
    if (!policy) {
      return res.status(404).json({ error: true, message: "Policy not found" });
    }

    await policy.destroy();
    res.status(200).json({ message: "Policy deleted successfully" });
  } catch (error) {
    console.error("Error deleting policy:", error);
    res.status(500).json({ error: true, message: "Failed to delete policy" });
  }
});

// Programs API
app.delete("/api/programs/:id", authJwt.verifyToken("Admin"), async (req, res) => {
  try {
    const program = await Programs.findByPk(req.params.id);
    if (!program) {
      return res.status(404).json({ error: true, message: "Program not found" });
    }

    await program.destroy();
    res.status(200).json({ message: "Program deleted successfully" });
  } catch (error) {
    console.error("Error deleting program:", error);
    res.status(500).json({ error: true, message: "Failed to delete program" });
  }
});

// Python Packages API
app.delete("/api/python-packages/:id", authJwt.verifyToken("Admin"), async (req, res) => {
  try {
    const package = await Python.findByPk(req.params.id);
    if (!package) {
      return res.status(404).json({ error: true, message: "Package not found" });
    }

    await package.destroy();
    res.status(200).json({ message: "Python package deleted successfully" });
  } catch (error) {
    console.error("Error deleting Python package:", error);
    res.status(500).json({ error: true, message: "Failed to delete Python package" });
  }
});

// Uninstall Programs API
app.delete("/api/uninstall-programs/:id", authJwt.verifyToken("Admin"), async (req, res) => {
  try {
    const program = await UninstallPrograms.findByPk(req.params.id);
    if (!program) {
      return res.status(404).json({ error: true, message: "Uninstall program not found" });
    }

    await program.destroy();
    res.status(200).json({ message: "Uninstall program deleted successfully" });
  } catch (error) {
    console.error("Error deleting uninstall program:", error);
    res.status(500).json({ error: true, message: "Failed to delete uninstall program" });
  }
});
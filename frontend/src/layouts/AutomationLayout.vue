<template>
  <q-layout view="lHh Lpr lFf" :class="$q.dark.isActive ? 'bg-dark' : 'bg-grey-1'">
    <!-- Header -->
    <q-header elevated :class="$q.dark.isActive ? 'bg-dark-8 text-white' : 'bg-primary text-white'">
      <q-toolbar>
        <q-btn
          flat
          dense
          round
          icon="menu"
          aria-label="Menu"
          @click="toggleLeftDrawer"
        />

        <q-toolbar-title class="row items-center cursor-pointer" @click="navigateTo('/')">
          <q-icon name="settings" size="2rem" class="q-mr-md" />
          <div>
            <div class="text-h6">Automation System</div>
            <div class="text-caption">Software Installation & OS Configuration</div>
          </div>
        </q-toolbar-title>

        <!-- User Menu -->
        <div class="row items-center q-gutter-sm">
          <!-- Dark Mode Toggle -->
          <q-btn
            flat
            round
            :icon="$q.dark.isActive ? 'light_mode' : 'dark_mode'"
            @click="toggleDarkMode"
            :color="$q.dark.isActive ? 'yellow' : 'white'"
          >
            <q-tooltip>{{ $q.dark.isActive ? 'Switch to Light Mode' : 'Switch to Dark Mode' }}</q-tooltip>
          </q-btn>
          
          <q-btn-dropdown flat :color="$q.dark.isActive ? 'grey-3' : 'white'" icon="account_circle">
            <q-list :class="$q.dark.isActive ? 'bg-dark-7' : 'bg-white'">
              <q-item clickable  :class="$q.dark.isActive ? 'text-white' : 'text-dark'">
                <q-item-section avatar>
                  <q-icon name="person" />
                </q-item-section>
                <q-item-section>{{ userEmail || 'Profile' }}</q-item-section>
              </q-item>   
              
              <q-separator />
              
              <q-item clickable v-close-popup @click="logout" :class="$q.dark.isActive ? 'text-white' : 'text-dark'">
                <q-item-section avatar>
                  <q-icon name="logout" />
                </q-item-section>
                <q-item-section>Logout</q-item-section>
              </q-item>
            </q-list>
          </q-btn-dropdown>
        </div>
      </q-toolbar>
    </q-header>

    <!-- Sidebar Navigation -->
    <q-drawer
      v-model="leftDrawerOpen"
      bordered
      :class="$q.dark.isActive ? 'bg-dark-8' : 'bg-grey-1'"
    >
      <q-list>
        <!-- Navigation Links -->
        <q-item-label header :class="$q.dark.isActive ? 'text-grey-4' : 'text-grey-8'">
          Main Navigation
        </q-item-label>

        <q-item
          v-for="link in navigationLinks"
          :key="link.title"
          clickable
          v-ripple
          :active="$route.path === link.route"
          :active-class="$q.dark.isActive ? 'bg-primary text-white' : 'bg-primary text-white'"
          @click="navigateTo(link.route)"
          class="q-mb-xs"
          :class="$q.dark.isActive ? 'text-grey-3' : 'text-dark'"
        >
          <q-item-section avatar>
            <q-icon 
              :name="link.icon" 
              :color="$route.path === link.route ? 'white' : ($q.dark.isActive ? 'blue-3' : 'primary')" 
            />
          </q-item-section>
          <q-item-section>
            <q-item-label>{{ link.title }}</q-item-label>
            <q-item-label caption>{{ link.caption }}</q-item-label>
          </q-item-section>
        </q-item>

        <q-separator class="q-my-md" :class="$q.dark.isActive ? 'bg-dark-6' : 'bg-grey-3'" />

        <!-- System Status -->
        <q-item-label header :class="$q.dark.isActive ? 'text-grey-4' : 'text-grey-8'">
          System Status
        </q-item-label>

        <q-item dense :class="$q.dark.isActive ? 'text-grey-3' : 'text-dark'">
          <q-item-section avatar>
            <q-icon 
              :name="systemStatus.database === 'Connected' ? 'check_circle' : 'error'" 
              :color="systemStatus.database === 'Connected' ? 'positive' : 'negative'" 
            />
          </q-item-section>
          <q-item-section>
            <q-item-label>Database</q-item-label>
            <q-item-label caption :class="$q.dark.isActive ? 'text-grey-4' : 'text-grey-7'">{{ systemStatus.database }}</q-item-label>
          </q-item-section>
        </q-item>

        <q-item dense :class="$q.dark.isActive ? 'text-grey-3' : 'text-dark'">
          <q-item-section avatar>
            <q-icon 
              :name="systemStatus.server === 'Running' ? 'check_circle' : 'error'" 
              :color="systemStatus.server === 'Running' ? 'positive' : 'negative'" 
            />
          </q-item-section>
          <q-item-section>
            <q-item-label>Server</q-item-label>
            <q-item-label caption :class="$q.dark.isActive ? 'text-grey-4' : 'text-grey-7'">{{ systemStatus.server }}</q-item-label>
          </q-item-section>
        </q-item>

        <q-item dense :class="$q.dark.isActive ? 'text-grey-3' : 'text-dark'">
          <q-item-section avatar>
            <q-icon name="timer" color="primary" />
          </q-item-section>
          <q-item-section>
            <q-item-label>API Uptime</q-item-label>
            <q-item-label caption :class="$q.dark.isActive ? 'text-grey-4' : 'text-grey-7'">{{ formatUptime(systemStatus.uptime) }}</q-item-label>
          </q-item-section>
        </q-item>

        <q-item dense :class="$q.dark.isActive ? 'text-grey-3' : 'text-dark'">
          <q-item-section avatar>
            <q-icon name="update" color="info" />
          </q-item-section>
          <q-item-section>
            <q-item-label>Last Update</q-item-label>
            <q-item-label caption :class="$q.dark.isActive ? 'text-grey-4' : 'text-grey-7'">{{ systemStatus.timestamp ? formatTime(systemStatus.timestamp) : 'N/A' }}</q-item-label>
          </q-item-section>
        </q-item>
      </q-list>
    </q-drawer>

    <!-- Main Content -->
    <q-page-container :class="$q.dark.isActive ? 'bg-dark' : 'bg-grey-1'">
      <!-- Custom Logout Confirmation Dialog -->
      <q-dialog v-model="confirmLogoutDialog" persistent>
        <q-card class="custom-logout-dialog">
          <q-card-section class="header-section">
            <div class="header-content">
            <q-avatar icon="warning" color="negative" text-color="white" class="warning-icon" />
            <p class="confirmation-text">Jeste li sigurni da se želite odjaviti?</p>
            </div>
            <q-btn class="btn-adjust-icon" icon="close" flat round dense v-close-popup />
          </q-card-section>
          <div class="dialog-actions">
            <q-btn label="Odustani" flat class="cancel-btn" v-close-popup />
            <q-btn flat label="Odjavi se" @click="logoutAndReload" class="delete-btn" />
          </div>
        </q-card>
      </q-dialog>

      <router-view />
    </q-page-container>

    <!-- Footer -->
    <q-footer elevated :class="$q.dark.isActive ? 'bg-dark-9 text-grey-3' : 'bg-grey-8 text-white'">
      <q-toolbar>
        <q-toolbar-title>
          <div class="text-caption">
            © 2024 Automation System. All rights reserved.
          </div>
        </q-toolbar-title>
        <div class="text-caption">
          Version 1.0.0
        </div>
      </q-toolbar>
    </q-footer>
  </q-layout>
</template>

<script>
import { Quasar, useQuasar } from 'quasar';
import hr from 'quasar/lang/hr';
import axios from '../router/axios'; // Import axios
import { jwtDecode } from 'jwt-decode'; // Import jwt-decode

Quasar.lang.set(hr);

export default {
  name: 'AutomationLayout',
  
  data() {
    return {
      leftDrawerOpen: false,
      confirmLogoutDialog: false,
      userEmail: '', // To store the user's email
      systemStatus: {
        database: 'Unknown',
        server: 'Unknown',
        timestamp: null,
        uptime: 0,
      },
      navigationLinks: [
        {
          title: 'Dashboard',
          caption: 'System overview and quick actions',
          icon: 'dashboard',
          route: '/'
        },
        {
          title: 'Windows Settings',
          caption: 'Configure Windows system settings',
          icon: 'settings',
          route: '/windows-settings'
        },
        {
          title: 'Group Policies',
          caption: 'Manage registry policies',
          icon: 'policy',
          route: '/group-policy'
        },
        {
          title: 'Uninstall Programs',
          caption: 'Remove installed software',
          icon: 'delete_forever',
          route: '/uninstall-programs'
        },
        {
          title: 'Programs',
          caption: 'Install and manage software',
          icon: 'download',
          route: '/programs'
        },
        {
          title: 'Python Packages',
          caption: 'Manage Python dependencies',
          icon: 'code',
          route: '/python-dependencies'
        },
        {
          title: 'Reports',
          caption: 'View execution reports and monitoring',
          icon: 'assessment',
          route: '/reports'
        },
        {
          title: 'User Management',
          caption: 'Manage system users and permissions',
          icon: 'people',
          route: '/users'
        }
      ],
    };
  },

  mounted() {
    this.loadSystemStatus();
    this.initializeDarkMode();
    this.fetchUserEmail(); // Fetch email on component mount
  },

  methods: {
    fetchUserEmail() {
      const token = localStorage.getItem("token");
      if (token) {
        try {
          const decoded = jwtDecode(token);
          this.userEmail = decoded.email; // Decode and store the email
        } catch (error) {
          console.error("Token decoding error:", error);
        }
      }
    },

    toggleLeftDrawer() {
      this.leftDrawerOpen = !this.leftDrawerOpen;
    },

    toggleDarkMode() {
      this.$q.dark.toggle();
      // Save preference to localStorage
      localStorage.setItem('darkMode', this.$q.dark.isActive);
      
      this.$q.notify({
        color: this.$q.dark.isActive ? 'blue' : 'orange',
        message: this.$q.dark.isActive ? 'Dark mode enabled' : 'Light mode enabled',
        icon: this.$q.dark.isActive ? 'dark_mode' : 'light_mode',
        position: "top",
      });
    },

    initializeDarkMode() {
      // Check for saved dark mode preference
      const savedDarkMode = localStorage.getItem('darkMode');
      if (savedDarkMode !== null) {
        const isDark = savedDarkMode === 'true';
        if (isDark !== this.$q.dark.isActive) {
          this.$q.dark.set(isDark);
        }
      }
    },

    navigateTo(route) {
      this.$router.push(route);
    },

    showUserProfile() {
      this.$q.notify({
        color: 'info',
        position: "top",
        message: 'User profile feature coming soon',
        icon: 'info'
      });
    },

    showSettings() {
      this.$q.notify({
        color: 'info',
        position: "top",
        message: 'Settings feature coming soon',
        icon: 'settings'
      });
    },

    logout() {
      this.confirmLogoutDialog = true;
    },

    async logoutAndReload() {
      try {
        const token = localStorage.getItem("token");
        if (token) {
          const userId = jwtDecode(token).id;
          // Call backend to invalidate refresh token
          await axios.post("/logout", { userId });
        }
      } catch (error) {
        console.error("An error occurred during server-side logout, proceeding with client-side logout:", error);
      } finally {
        // Always clear local storage and redirect
        localStorage.removeItem("token");
        localStorage.removeItem("refreshToken");
        
        this.$q.notify({
          color: 'positive',
          position: "top",
          message: 'Logged out successfully',
          icon: 'logout'
        });

        // Hard redirect to login page
        window.location.href = "/prijava";
      }
    },

    quickInstall() {
      this.$q.notify({
        color: 'info',
        position: "top",
        message: 'Quick install feature coming soon',
        icon: 'rocket_launch'
      });
    },

    systemCheck() {
      this.$q.notify({
        color: 'info',
        position: "top",
        message: 'System check feature coming soon',
        icon: 'health_and_safety'
      });
    },

    backupConfig() {
      this.$q.notify({
        color: 'info',
        position: "top",
        message: 'Backup configuration feature coming soon',
        icon: 'backup'
      });
    },

    formatTime(timestamp) {
      const date = new Date(timestamp);
      return date.toLocaleString();
    },

    formatUptime(uptime) {
      if (!uptime) return 'N/A';
      const hours = Math.floor(uptime / 3600);
      const minutes = Math.floor((uptime % 3600) / 60);
      const seconds = Math.floor(uptime % 60);
      return `${hours}h ${minutes}m ${seconds}s`;
    },

    async loadSystemStatus() {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          const response_system_status = await axios.get(`/system/status`, {
            headers: this.headers,
          });
          const systemStatusData = response_system_status.data;
          this.systemStatus = {
            database: systemStatusData.database,
            server: systemStatusData.server,
            timestamp: systemStatusData.timestamp,
            uptime: systemStatusData.uptime
          };
        }
      } catch (error) {
        console.error('Error loading system status:', error);
        // Keep existing/default values on error
      }
    }
  }
};
</script> 
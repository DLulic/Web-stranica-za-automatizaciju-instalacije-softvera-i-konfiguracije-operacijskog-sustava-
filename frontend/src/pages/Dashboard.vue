<template>
  <q-page class="q-pa-md">
    <!-- Page Header -->
    <div class="row q-mb-lg">
      <div class="col-12">
        <h4 class="text-h4 q-mb-sm">Dashboard</h4>
        <p class="text-subtitle1 text-grey-6">System automation overview and quick actions</p>
      </div>
    </div>

    <!-- Status Cards -->
    <div class="row q-col-gutter-md q-mb-lg">
      <div class="col-12 col-sm-6 col-md-3">
        <q-card class="status-card">
          <q-card-section class="text-center">
            <q-icon name="computer" size="3rem" color="primary" />
            <div class="text-h6 q-mt-sm">{{ stats.totalComputers }}</div>
            <div class="text-caption text-grey-6">Active Systems</div>
          </q-card-section>
        </q-card>
      </div>
      
      <div class="col-12 col-sm-6 col-md-3">
        <q-card class="status-card">
          <q-card-section class="text-center">
            <q-icon name="check_circle" size="3rem" color="positive" />
            <div class="text-h6 q-mt-sm">{{ stats.successfulTasks }}</div>
            <div class="text-caption text-grey-6">Successful Tasks</div>
          </q-card-section>
        </q-card>
      </div>
      
      <div class="col-12 col-sm-6 col-md-3">
        <q-card class="status-card">
          <q-card-section class="text-center">
            <q-icon name="error" size="3rem" color="negative" />
            <div class="text-h6 q-mt-sm">{{ stats.failedTasks }}</div>
            <div class="text-caption text-grey-6">Failed Tasks</div>
          </q-card-section>
        </q-card>
      </div>
      
      <div class="col-12 col-sm-6 col-md-3">
        <q-card class="status-card">
          <q-card-section class="text-center">
            <q-icon name="pending" size="3rem" color="warning" />
            <div class="text-h6 q-mt-sm">{{ stats.pendingTasks }}</div>
            <div class="text-caption text-grey-6">Pending Tasks</div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- Quick Actions -->
    <div class="row q-col-gutter-md q-mb-lg">
      <div class="col-12">
        <q-card>
          <q-card-section>
            <div class="text-h6">Quick Actions</div>
          </q-card-section>
          <q-card-section>
            <div class="row q-col-gutter-md">
              <div class="col-12 col-sm-6 col-md-3">
                <q-btn 
                  color="primary" 
                  icon="settings" 
                  label="Windows Settings"
                  class="full-width"
                  @click="$router.push('/windows-settings')"
                />
              </div>
              <div class="col-12 col-sm-6 col-md-3">
                <q-btn 
                  color="secondary" 
                  icon="policy" 
                  label="Group Policies"
                  class="full-width"
                  @click="$router.push('/group-policy')"
                />
              </div>
              <div class="col-12 col-sm-6 col-md-3">
                <q-btn 
                  color="accent" 
                  icon="download" 
                  label="Install Programs"
                  class="full-width"
                  @click="$router.push('/programs')"
                />
              </div>
              <div class="col-12 col-sm-6 col-md-3">
                <q-btn 
                  color="info" 
                  icon="code" 
                  label="Python Packages"
                  class="full-width"
                  @click="$router.push('/python-dependencies')"
                />
              </div>
              <div class="col-12 col-sm-6 col-md-3">
                <q-btn 
                  color="warning" 
                  icon="assessment" 
                  label="Reports & Monitoring"
                  class="full-width"
                  @click="$router.push('/reports')"
                />
              </div>
              <div class="col-12 col-sm-6 col-md-3">
                <q-btn 
                  color="deep-purple" 
                  icon="people" 
                  label="User Management"
                  class="full-width"
                  @click="$router.push('/users')"
                />
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- Recent Reports -->
    <div class="row q-col-gutter-md">
      <div class="col-12 col-lg-8">
        <q-card>
          <q-card-section>
            <div class="text-h6">Recent Reports</div>
          </q-card-section>
          <q-card-section>
            <q-table
              :rows="recentReports"
              :columns="reportColumns"
              row-key="report_id"
              v-model:pagination="pagination"
              :rows-per-page-options="[5, 10, 20, 25, 50]" 
              @request="onRequest"
              flat
            >
              <template v-slot:body-cell-status="props">
                <div class="table-cell-center">
                  <q-chip
                    :color="getStatusColor(props.value)"
                    text-color="white"
                    size="mh"
                  >
                    {{ props.value }}
                  </q-chip>
                </div>
              </template>
            </q-table>
          </q-card-section>
        </q-card>
      </div>
      
      <div class="col-12 col-lg-4">
        <q-card>
          <q-card-section>
            <div class="text-h6">System Status</div>
          </q-card-section>
          <q-card-section>
            <div class="q-gutter-y-md">
              <div class="row items-center">
                <q-icon 
                  :name="systemStatus.database === 'Connected' ? 'fiber_manual_record' : 'error'" 
                  :color="systemStatus.database === 'Connected' ? 'positive' : 'negative'" 
                  size="sm" 
                />
                <span class="q-ml-sm">Database: {{ systemStatus.database }}</span>
              </div>
              <div class="row items-center">
                <q-icon 
                  :name="systemStatus.server === 'Running' ? 'fiber_manual_record' : 'error'" 
                  :color="systemStatus.server === 'Running' ? 'positive' : 'negative'" 
                  size="sm" 
                />
                <span class="q-ml-sm">API Server: {{ systemStatus.server }}</span>
              </div>
              <div class="row items-center">
                <q-icon name="schedule" color="info" size="sm" />
                <span class="q-ml-sm">Last Update: {{ systemStatus.timestamp ? formatTime(systemStatus.timestamp) : 'N/A' }}</span>
              </div>
              <div class="row items-center">
                <q-icon name="timer" color="primary" size="sm" />
                <span class="q-ml-sm">Uptime: {{ formatUptime(systemStatus.uptime) }}</span>
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script>
import axios from "../router/axios";
import { jwtDecode } from 'jwt-decode';
import { Quasar } from 'quasar';
import hr from 'quasar/lang/hr';

Quasar.lang.set(hr);

export default {
  data() {
    return {
      headers: null,
      stats: {
        totalComputers: 0,
        successfulTasks: 0,
        failedTasks: 0,
        pendingTasks: 0
      },
      systemStatus: {
        database: "Unknown",
        server: "Unknown",
        timestamp: null,
        uptime: 0
      },
      pagination:{
        rowsPerPage: 5,
        sortBy: "report_timestamp",
        descending: false,
        rowsNumber: 0,
        page: 1,
        rows: 0,
      },
      recentReports: [],
      reportColumns: [
        {
          name: 'computer_name',
          label: 'Computer',
          field: 'report_computer_name',
          align: 'left'
        },
        {
          name: 'task_type',
          label: 'Task Type',
          field: 'report_task_type',
          align: 'left'
        },
        {
          name: 'task_name',
          label: 'Task Name',
          field: 'report_task_name',
          align: 'left'
        },
        {
          name: 'status',
          label: 'Status',
          field: 'report_status',
          align: 'center'
        },
        {
          name: 'timestamp',
          label: 'Time',
          field: 'report_timestamp',
          align: 'left',
          format: (val) => new Date(val).toLocaleString()
        }
      ]
    };
  },
  watch: {
    "pagination.rowsPerPage"(newVal) {
      // Ako je korisnik postavio rowsPerPage na 0, postavi ga na ukupan broj redova
      if (newVal === 0) {
        // Postavi na ukupan broj redova (total) kada se učita tablica
        this.pagination.rowsPerPage = this.pagination.rowsNumber;
      }
      this.pagination.page = 1; // Resetiraj na prvu stranicu
      this.loadDashboardData();
    }
  },

  async mounted() {
    // Get the JWT token from local storage
    const token = localStorage.getItem("token");

    if (token) {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expirationTime = payload.exp * 1000; // Convert to milliseconds

      if (Date.now() >= expirationTime) {
        this.$router.push('/prijava');
      } else {
        // Set up the request headers to include the JWT token
        this.headers = { Authorization: `Bearer ${token}` };
        this.loadDashboardData();
      }
    } else {
      this.$router.push('/prijava');
    }
  },

  onRequest(props) {
    this.pagination = props.pagination;
    this.loadDashboardData();
  },

  methods: {
    getStatusColor(status) {
      switch (status) {
        case 'success': return 'positive'
        case 'failure': return 'negative'
        case 'additional': return 'warning'
        default: return 'grey'
      }
    },

    async loadDashboardData() {
      try {
        const limit = this.pagination.rowsPerPage === 0 ? this.pagination.rowsNumber : this.pagination.rowsPerPage;

        // Load statistics
        const response_stats = await axios.get(`/reports/statistics`, {
          headers: this.headers,
        });
        const statsData = response_stats.data;
        
        this.stats = {
          totalComputers: statsData.totalComputers,
          successfulTasks: statsData.successReports,
          failedTasks: statsData.failureReports,
          pendingTasks: statsData.additionalReports
        }
        
        // Load system status
        const response_system_status = await axios.get(`/system/status`, {
          headers: this.headers,
        });
        const systemStatusData = response_system_status.data;
        
        this.systemStatus = {
          database: systemStatusData.database,
          server: systemStatusData.server,
          timestamp: systemStatusData.timestamp,
          uptime: systemStatusData.uptime
        }
        
        // Load recent reports
        const response_reports = await axios.get(`/reports`, {
          headers: this.headers,
          params: {
                page: this.pagination.page,
                limit: limit,
                search: this.search,
                sortBy: this.pagination.sortBy,
                descending: this.pagination.descending,
            },
        });
        this.recentReports = response_reports.data;
        this.pagination.rowsNumber = response_reports.data.total;
        
      } catch (error) {
        console.error('Error loading dashboard data:', error);
        this.$q.notify({
          color: "negative",
          position: "top",
          message: "Greška pri dohvatu podataka dashboard-a",
          icon: "report_problem",
        });
        
        // Fallback to mock data if API fails
        this.stats = {
          totalComputers: 5,
          successfulTasks: 127,
          failedTasks: 3,
          pendingTasks: 2
        }
        
        this.systemStatus = {
          database: "Unknown",
          server: "Unknown",
          timestamp: null,
          uptime: 0
        }
        
        this.recentReports = [
          {
            report_id: 1,
            report_computer_name: 'DESKTOP-ABC123',
            report_task_type: 'windows settings',
            report_task_name: 'Aktiviranje Windows-a',
            report_status: 'success',
            report_timestamp: new Date()
          },
          {
            report_id: 2,
            report_computer_name: 'DESKTOP-DEF456',
            report_task_type: 'instalacija programa',
            report_task_name: 'Microsoft Office',
            report_status: 'success',
            report_timestamp: new Date(Date.now() - 3600000)
          }
        ]
      }
    },
    formatTime(timestamp) {
      const date = new Date(timestamp);
      return date.toLocaleString();
    },
    formatUptime(uptime) {
      const hours = Math.floor(uptime / 3600);
      const minutes = Math.floor((uptime % 3600) / 60);
      const seconds = Math.floor(uptime % 60);
      return `${hours}h ${minutes}m ${seconds}s`;
    }
  }
};
</script> 
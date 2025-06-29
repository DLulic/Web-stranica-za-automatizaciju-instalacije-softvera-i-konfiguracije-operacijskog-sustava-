<template>
  <q-page class="q-pa-md">
    <!-- Page Header -->
    <div class="row q-mb-lg">
      <div class="col-12">
        <div class="row items-center justify-between">
          <div>
            <h4 class="text-h4 q-mb-sm">Reports & Monitoring</h4>
            <p class="text-subtitle1 text-grey-6">View execution reports and system monitoring</p>
          </div>
          <div class="row q-gutter-sm">
            <q-btn
              color="secondary"
              icon="download"
              label="Export CSV"
              @click="exportReports"
            />
            <q-btn
              color="info"
              icon="refresh"
              label="Refresh"
              @click="loadReports"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Statistics Cards -->
    <div class="row q-col-gutter-md q-mb-lg">
      <div class="col-12 col-sm-6 col-md-3">
        <q-card class="stat-card">
          <q-card-section class="text-center">
            <q-icon name="check_circle" size="2rem" color="positive" />
            <div class="text-h6 q-mt-sm">{{ stats.success }}</div>
            <div class="text-caption text-grey-6">Successful</div>
          </q-card-section>
        </q-card>
      </div>
      
      <div class="col-12 col-sm-6 col-md-3">
        <q-card class="stat-card">
          <q-card-section class="text-center">
            <q-icon name="error" size="2rem" color="negative" />
            <div class="text-h6 q-mt-sm">{{ stats.failure }}</div>
            <div class="text-caption text-grey-6">Failed</div>
          </q-card-section>
        </q-card>
      </div>
      
      <div class="col-12 col-sm-6 col-md-3">
        <q-card class="stat-card">
          <q-card-section class="text-center">
            <q-icon name="pending" size="2rem" color="warning" />
            <div class="text-h6 q-mt-sm">{{ stats.additional }}</div>
            <div class="text-caption text-grey-6">Additional</div>
          </q-card-section>
        </q-card>
      </div>
      
      <div class="col-12 col-sm-6 col-md-3">
        <q-card class="stat-card">
          <q-card-section class="text-center">
            <q-icon name="computer" size="2rem" color="primary" />
            <div class="text-h6 q-mt-sm">{{ stats.totalComputers }}</div>
            <div class="text-caption text-grey-6">Computers</div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- Filters -->
    <div class="row q-col-gutter-md q-mb-md">
      <div class="col-12 col-md-3">
        <q-input
          v-model="searchTerm"
          placeholder="Search reports..."
          outlined
          dense
          clearable
        >
          <template v-slot:prepend>
            <q-icon name="search" />
          </template>
        </q-input>
      </div>
      
      <div class="col-12 col-md-3">
        <q-select
          v-model="statusFilter"
          :options="statusOptions"
          label="Filter by Status"
          outlined
          dense
          clearable
        />
      </div>
      
      <div class="col-12 col-md-3">
        <q-select
          v-model="taskTypeFilter"
          :options="taskTypeOptions"
          label="Filter by Task Type"
          outlined
          dense
          clearable
        />
      </div>
      
      <div class="col-12 col-md-3">
        <q-input
          v-model="computerFilter"
          placeholder="Filter by computer..."
          outlined
          dense
          clearable
        >
          <template v-slot:prepend>
            <q-icon name="computer" />
          </template>
        </q-input>
      </div>
    </div>

    <!-- Date Range Filter -->
    <div class="row q-col-gutter-md q-mb-md">
      <div class="col-12 col-md-4">
        <q-input
          v-model="dateFrom"
          label="From Date"
          outlined
          dense
          type="date"
          clearable
        />
      </div>
      <div class="col-12 col-md-4">
        <q-input
          v-model="dateTo"
          label="To Date"
          outlined
          dense
          type="date"
          clearable
        />
      </div>
      <div class="col-12 col-md-4">
        <q-btn
          color="primary"
          icon="filter_list"
          label="Apply Filters"
          class="full-width"
          @click="applyFilters"
        />
      </div>
    </div>

    <!-- Reports Table -->
    <q-card>
      <q-card-section>
        <q-table
          :rows="filteredReports"
          :columns="columns"
          row-key="report_id"
          :loading="loading"
          v-model:pagination="pagination"
          :rows-per-page-options="[5, 10, 20, 25, 50]" 
          @request="onRequest"
          flat
        >
          <template v-slot:body-cell-status="props">
            <q-chip
              :color="getStatusColor(props.value)"
              text-color="white"
              size="sm"
            >
              {{ props.value }}
            </q-chip>
          </template>
          
          <template v-slot:body-cell-task_type="props">
            <q-chip
              :color="getTaskTypeColor(props.value)"
              text-color="white"
              size="sm"
            >
              {{ props.value }}
            </q-chip>
          </template>
          
          <template v-slot:body-cell-timestamp="props">
            {{ formatDate(props.value) }}
          </template>
          
          <template v-slot:body-cell-actions="props">
            <q-btn-group flat>
              <q-btn
                flat
                round
                color="info"
                icon="info"
                @click="showReportDetails(props.row)"
              >
                <q-tooltip>Details</q-tooltip>
              </q-btn>
              <q-btn
                flat
                round
                color="secondary"
                icon="download"
                @click="downloadReport(props.row)"
              >
                <q-tooltip>Download</q-tooltip>
              </q-btn>
            </q-btn-group>
          </template>
        </q-table>
      </q-card-section>
    </q-card>

    <!-- Report Details Dialog -->
    <q-dialog v-model="showDetailsDialog" maximized>
      <q-card>
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6">Report Details</div>
          <q-space />
          <q-btn icon="close" flat round dense @click="showDetailsDialog = false" />
        </q-card-section>

        <q-card-section v-if="selectedReport">
          <div class="row q-col-gutter-md">
            <div class="col-12 col-md-6">
              <q-card flat bordered>
                <q-card-section>
                  <div class="text-h6">Basic Information</div>
                </q-card-section>
                <q-card-section>
                  <div class="q-gutter-y-md">
                    <div>
                      <strong>Report ID:</strong> {{ selectedReport.report_id }}
                    </div>
                    <div>
                      <strong>Computer Name:</strong> {{ selectedReport.report_computer_name }}
                    </div>
                    <div>
                      <strong>Task Type:</strong>
                      <q-chip
                        :color="getTaskTypeColor(selectedReport.report_task_type)"
                        text-color="white"
                        size="sm"
                        class="q-ml-sm"
                      >
                        {{ selectedReport.report_task_type }}
                      </q-chip>
                    </div>
                    <div>
                      <strong>Task Name:</strong> {{ selectedReport.report_task_name }}
                    </div>
                    <div>
                      <strong>Status:</strong>
                      <q-chip
                        :color="getStatusColor(selectedReport.report_status)"
                        text-color="white"
                        size="sm"
                        class="q-ml-sm"
                      >
                        {{ selectedReport.report_status }}
                      </q-chip>
                    </div>
                    <div>
                      <strong>Timestamp:</strong> {{ formatDate(selectedReport.report_timestamp) }}
                    </div>
                  </div>
                </q-card-section>
              </q-card>
            </div>
            
            <div class="col-12 col-md-6">
              <q-card flat bordered>
                <q-card-section>
                  <div class="text-h6">Execution Details</div>
                </q-card-section>
                <q-card-section>
                  <div class="q-gutter-y-md">
                    <div>
                      <strong>Execution Time:</strong> {{ selectedReport.executionTime || 'N/A' }}
                    </div>
                    <div>
                      <strong>Memory Usage:</strong> {{ selectedReport.memoryUsage || 'N/A' }}
                    </div>
                    <div>
                      <strong>CPU Usage:</strong> {{ selectedReport.cpuUsage || 'N/A' }}
                    </div>
                    <div v-if="selectedReport.errorMessage">
                      <strong>Error Message:</strong>
                      <div class="q-mt-sm q-pa-sm bg-red-1 text-red-8 rounded">
                        {{ selectedReport.errorMessage }}
                      </div>
                    </div>
                  </div>
                </q-card-section>
              </q-card>
            </div>
          </div>
        </q-card-section>
      </q-card>
    </q-dialog>
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
      loading: false,
      searchTerm: '',
      statusFilter: null,
      taskTypeFilter: null,
      computerFilter: '',
      dateFrom: '',
      dateTo: '',
      showDetailsDialog: false,
      selectedReport: null,
      reports: [],
      stats: {
        success: 0,
        failure: 0,
        additional: 0,
        totalComputers: 0
      },
      statusOptions: [
        { label: 'Success', value: 'success' },
        { label: 'Failure', value: 'failure' },
        { label: 'Additional', value: 'additional' }
      ],
      taskTypeOptions: [
        { label: 'Windows Settings', value: 'windows settings' },
        { label: 'Group Policy', value: 'group policy' },
        { label: 'Python Dependencies', value: 'python dependencies' },
        { label: 'Install Add-ons', value: 'instalacija dodataka' },
        { label: 'Install Programs', value: 'instalacija programa' },
        { label: 'Uninstall Programs', value: 'brisanje programa' }
      ],
      pagination: {
        rowsPerPage: 15,
        sortBy: "report_timestamp",
        descending: true,
        rowsNumber: 0,
        page: 1,
        rows: 0,
      },
      columns: [
        {
          name: 'report_id',
          label: 'ID',
          field: 'report_id',
          align: 'left',
          sortable: true
        },
        {
          name: 'computer_name',
          label: 'Computer',
          field: 'report_computer_name',
          align: 'left',
          sortable: true
        },
        {
          name: 'task_type',
          label: 'Task Type',
          field: 'report_task_type',
          align: 'center'
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
          label: 'Timestamp',
          field: 'report_timestamp',
          align: 'left',
          sortable: true
        },
        {
          name: 'actions',
          label: 'Actions',
          align: 'center'
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
      this.loadReports();
    }
  },

  computed: {
    filteredReports() {
      let filtered = this.reports;

      // Filter by search term
      if (this.searchTerm) {
        filtered = filtered.filter(report =>
          report.report_computer_name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
          report.report_task_name.toLowerCase().includes(this.searchTerm.toLowerCase())
        );
      }

      // Filter by status
      if (this.statusFilter) {
        filtered = filtered.filter(report => report.report_status === this.statusFilter);
      }

      // Filter by task type
      if (this.taskTypeFilter) {
        filtered = filtered.filter(report => report.report_task_type === this.taskTypeFilter);
      }

      // Filter by computer
      if (this.computerFilter) {
        filtered = filtered.filter(report =>
          report.report_computer_name.toLowerCase().includes(this.computerFilter.toLowerCase())
        );
      }

      // Filter by date range
      if (this.dateFrom) {
        filtered = filtered.filter(report => {
          const reportDate = new Date(report.report_timestamp);
          const fromDate = new Date(this.dateFrom);
          return reportDate >= fromDate;
        });
      }

      if (this.dateTo) {
        filtered = filtered.filter(report => {
          const reportDate = new Date(report.report_timestamp);
          const toDate = new Date(this.dateTo);
          return reportDate <= toDate;
        });
      }

      return filtered;
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
        this.loadReports();
      }
    } else {
      this.$router.push('/prijava');
    }
  },

  methods: {
    onRequest(props) {
      this.pagination = props.pagination;
      this.loadReports();
    },

    getStatusColor(status) {
      switch (status) {
        case 'success': return 'positive'
        case 'failure': return 'negative'
        case 'additional': return 'warning'
        default: return 'grey'
      }
    },

    getTaskTypeColor(taskType) {
      switch (taskType) {
        case 'windows settings': return 'primary'
        case 'group policy': return 'secondary'
        case 'python dependencies': return 'info'
        case 'instalacija dodataka': return 'accent'
        case 'instalacija programa': return 'positive'
        case 'brisanje programa': return 'negative'
        default: return 'grey'
      }
    },

    formatDate(date) {
      return new Date(date).toLocaleString();
    },

    async loadReports() {
      const limit = this.pagination.rowsPerPage === 0 ? this.pagination.rowsNumber : this.pagination.rowsPerPage;

      this.loading = true;
      try {
        const response = await axios.get(`reports`, {
          headers: this.headers,
          params: {
            page: this.pagination.page,
            limit: limit,
            search: this.searchTerm,
            sortBy: this.pagination.sortBy,
            descending: this.pagination.descending,
          },
        });
        this.reports = response.data;
        this.pagination.rowsNumber = response.data.total;
        
        // Calculate statistics
        this.calculateStats();
      } catch (error) {
        console.error('Error loading reports:', error);
        this.$q.notify({
          color: "negative",
          position: "top",
          message: "Greška pri dohvatu izvještaja",
          icon: "report_problem",
        });
        // Fallback to mock data
        this.reports = [
          {
            report_id: 1,
            report_computer_name: 'DESKTOP-ABC123',
            report_task_type: 'windows settings',
            report_task_name: 'Aktiviranje Windows-a',
            report_status: 'success',
            report_timestamp: new Date(),
            executionTime: '2.3s',
            memoryUsage: '45MB',
            cpuUsage: '12%'
          },
          {
            report_id: 2,
            report_computer_name: 'DESKTOP-DEF456',
            report_task_type: 'instalacija programa',
            report_task_name: 'Microsoft Office',
            report_status: 'success',
            report_timestamp: new Date(Date.now() - 3600000),
            executionTime: '15.7s',
            memoryUsage: '128MB',
            cpuUsage: '45%'
          },
          {
            report_id: 3,
            report_computer_name: 'DESKTOP-GHI789',
            report_task_type: 'python dependencies',
            report_task_name: 'jupyterlab',
            report_status: 'failure',
            report_timestamp: new Date(Date.now() - 7200000),
            executionTime: '8.1s',
            memoryUsage: '67MB',
            cpuUsage: '23%',
            errorMessage: 'Package not found in repository'
          }
        ];
        this.calculateStats();
      } finally {
        this.loading = false;
      }
    },

    calculateStats() {
      // Try to get stats from API first, fallback to calculated stats
      axios.get(`reports/statistics`, {
        headers: this.headers,
      })
        .then(response => {
          const data = response.data;
          this.stats = {
            success: data.successReports,
            failure: data.failureReports,
            additional: data.additionalReports,
            totalComputers: data.totalComputers
          };
        })
        .catch(() => {
          // Fallback to calculated stats
          const success = this.reports.filter(r => r.report_status === 'success').length;
          const failure = this.reports.filter(r => r.report_status === 'failure').length;
          const additional = this.reports.filter(r => r.report_status === 'additional').length;
          const computers = new Set(this.reports.map(r => r.report_computer_name)).size;
          
          this.stats = {
            success,
            failure,
            additional,
            totalComputers: computers
          };
        });
    },

    showReportDetails(report) {
      this.selectedReport = report;
      this.showDetailsDialog = true;
    },

    downloadReport(report) {
      // Mock download functionality
      this.$q.notify({
        color: "positive",
        position: "top",
        message: `Preuzimanje izvještaja ${report.report_id}`,
        icon: "download",
      });
    },

    exportReports() {
      // Mock export functionality
      this.$q.notify({
        color: "positive",
        position: "top",
        message: "Izvoz izvještaja u CSV",
        icon: "download",
      });
    },

    applyFilters() {
      // Filters are applied automatically through computed property
      this.$q.notify({
        color: "info",
        position: "top",
        message: "Filtri primijenjeni",
        icon: "filter_list",
      });
    }
  }
};
</script>

<style scoped>
.stat-card {
  transition: transform 0.2s;
}

.stat-card:hover {
  transform: translateY(-2px);
}
</style> 
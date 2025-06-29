<template>
  <q-page class="q-pa-md">
    <!-- Page Header -->
    <div class="row q-mb-lg">
      <div class="col-12">
        <div class="row items-center justify-between">
          <div>
            <h4 class="text-h4 q-mb-sm">Python Dependencies</h4>
            <p class="text-subtitle1 text-grey-6">Manage Python dependencies and packages</p>
          </div>
          <div class="row q-gutter-sm">
            <q-btn
              color="secondary"
              icon="refresh"
              label="Refresh"
              @click="loadDependencies"
            />
            <q-btn
              color="primary"
              icon="add"
              label="Add Dependency"
              @click="showAddDialog = true"
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
            <q-icon name="code" size="2rem" color="primary" />
            <div class="text-h6 q-mt-sm">{{ stats.totalDependencies }}</div>
            <div class="text-caption text-grey-6">Total Dependencies</div>
          </q-card-section>
        </q-card>
      </div>
      
      <div class="col-12 col-sm-6 col-md-3">
        <q-card class="stat-card">
          <q-card-section class="text-center">
            <q-icon name="check_circle" size="2rem" color="positive" />
            <div class="text-h6 q-mt-sm">{{ stats.installedDependencies }}</div>
            <div class="text-caption text-grey-6">Installed</div>
          </q-card-section>
        </q-card>
      </div>
      
      <div class="col-12 col-sm-6 col-md-3">
        <q-card class="stat-card">
          <q-card-section class="text-center">
            <q-icon name="pending" size="2rem" color="warning" />
            <div class="text-h6 q-mt-sm">{{ stats.pendingDependencies }}</div>
            <div class="text-caption text-grey-6">Pending</div>
          </q-card-section>
        </q-card>
      </div>
      
      <div class="col-12 col-sm-6 col-md-3">
        <q-card class="stat-card">
          <q-card-section class="text-center">
            <q-icon name="error" size="2rem" color="negative" />
            <div class="text-h6 q-mt-sm">{{ stats.failedDependencies }}</div>
            <div class="text-caption text-grey-6">Failed</div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- Search and Filters -->
    <div class="row q-mb-md">
      <div class="col-12 col-md-6">
        <q-input
          v-model="searchTerm"
          placeholder="Search dependencies..."
          outlined
          dense
          clearable
        >
          <template v-slot:prepend>
            <q-icon name="search" />
          </template>
        </q-input>
      </div>
      <div class="col-12 col-md-6">
        <q-btn-toggle
          v-model="statusFilter"
          :options="[
            { label: 'All', value: 'all' },
            { label: 'Installed', value: 'installed' },
            { label: 'Pending', value: 'pending' },
            { label: 'Failed', value: 'failed' }
          ]"
          color="primary"
          class="full-width"
        />
      </div>
    </div>

    <!-- Dependencies Table -->
    <q-card>
      <q-card-section>
        <q-table
          :rows="filteredDependencies"
          :columns="columns"
          row-key="python_id"
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
          
          <template v-slot:body-cell-actions="props">
            <q-btn-group flat>
              <q-btn
                flat
                round
                color="primary"
                icon="download"
                @click="installDependency(props.row)"
                :loading="props.row.installing"
              >
                <q-tooltip>Install</q-tooltip>
              </q-btn>
              <q-btn
                flat
                round
                color="secondary"
                icon="edit"
                @click="editDependency(props.row)"
              >
                <q-tooltip>Edit</q-tooltip>
              </q-btn>
              <q-btn
                flat
                round
                color="info"
                icon="info"
                @click="showDependencyDetails(props.row)"
              >
                <q-tooltip>Details</q-tooltip>
              </q-btn>
              <q-btn
                flat
                round
                color="negative"
                icon="delete"
                @click="deleteDependency(props.row)"
              >
                <q-tooltip>Delete</q-tooltip>
              </q-btn>
            </q-btn-group>
          </template>
        </q-table>
      </q-card-section>
    </q-card>

    <!-- Add/Edit Dialog -->
    <q-dialog v-model="showAddDialog" persistent>
      <q-card style="min-width: 500px">
        <q-card-section>
          <div class="text-h6">{{ editingDependency ? 'Edit Dependency' : 'Add New Dependency' }}</div>
        </q-card-section>

        <q-card-section>
          <q-form @submit="saveDependency" class="q-gutter-md">
            <q-input
              v-model="dependencyForm.python_name"
              label="Dependency Name"
              outlined
              :rules="[val => !!val || 'Name is required']"
              hint="Enter the dependency name (e.g., jupyterlab, numpy, pandas)"
            />
            
            <q-input
              v-model="dependencyForm.python_desc"
              label="Description"
              outlined
              type="textarea"
              rows="3"
              :rules="[val => !!val || 'Description is required']"
              hint="Describe what this dependency does"
            />
          </q-form>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancel" color="primary" @click="closeDialog" />
          <q-btn unelevated label="Save" color="primary" @click="saveDependency" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Dependency Details Dialog -->
    <q-dialog v-model="showDetailsDialog">
      <q-card style="min-width: 500px">
        <q-card-section>
          <div class="text-h6">Dependency Details</div>
        </q-card-section>

        <q-card-section v-if="selectedDependency">
          <div class="q-gutter-y-md">
            <div>
              <strong>Dependency Name:</strong> {{ selectedDependency.python_name }}
            </div>
            <div>
              <strong>Description:</strong> {{ selectedDependency.python_desc }}
            </div>
            <div>
              <strong>Status:</strong>
              <q-chip
                :color="getStatusColor(selectedDependency.status || 'pending')"
                text-color="white"
                size="sm"
                class="q-ml-sm"
              >
                {{ selectedDependency.status || 'pending' }}
              </q-chip>
            </div>
            <div v-if="selectedDependency.version">
              <strong>Version:</strong> {{ selectedDependency.version }}
            </div>
            <div v-if="selectedDependency.installDate">
              <strong>Install Date:</strong> {{ formatDate(selectedDependency.installDate) }}
            </div>
            <div v-if="selectedDependency.dependencies">
              <strong>Dependencies:</strong>
              <div class="q-mt-sm q-pa-sm bg-grey-2 rounded">
                {{ selectedDependency.dependencies }}
              </div>
            </div>
          </div>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Close" color="primary" @click="showDetailsDialog = false" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Delete Confirmation -->
    <q-dialog v-model="showDeleteDialog">
      <q-card>
        <q-card-section>
          <div class="text-h6">Confirm Delete</div>
        </q-card-section>

        <q-card-section>
          Are you sure you want to delete "{{ dependencyToDelete?.python_name }}"?
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancel" color="primary" @click="showDeleteDialog = false" />
          <q-btn unelevated label="Delete" color="negative" @click="confirmDelete" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Batch Install Dialog -->
    <q-dialog v-model="showBatchDialog">
      <q-card style="min-width: 600px">
        <q-card-section>
          <div class="text-h6">Batch Install Dependencies</div>
        </q-card-section>

        <q-card-section>
          <div class="q-gutter-y-md">
            <div class="text-subtitle2">Select dependencies to install:</div>
            <q-list>
              <q-item v-for="dependency in dependencies" :key="dependency.python_id">
                <q-item-section avatar>
                  <q-checkbox v-model="selectedDependencies" :val="dependency.python_id" />
                </q-item-section>
                <q-item-section>
                  <q-item-label>{{ dependency.python_name }}</q-item-label>
                  <q-item-label caption>{{ dependency.python_desc }}</q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
          </div>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancel" color="primary" @click="showBatchDialog = false" />
          <q-btn 
            unelevated 
            label="Install Selected" 
            color="primary" 
            @click="batchInstall"
            :loading="batchInstalling"
          />
        </q-card-actions>
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
      statusFilter: 'all',
      showAddDialog: false,
      showDetailsDialog: false,
      showDeleteDialog: false,
      showBatchDialog: false,
      editingDependency: null,
      selectedDependency: null,
      dependencyToDelete: null,
      selectedDependencies: [],
      batchInstalling: false,
      dependencies: [],
      stats: {
        totalDependencies: 0,
        installedDependencies: 0,
        pendingDependencies: 0,
        failedDependencies: 0
      },
      dependencyForm: {
        python_name: '',
        python_desc: ''
      },
      pagination: {
        rowsPerPage: 10,
        sortBy: "python_id",
        descending: false,
        rowsNumber: 0,
        page: 1,
        rows: 0,
      },
      columns: [
        {
          name: 'python_name',
          label: 'Dependency Name',
          field: 'python_name',
          align: 'left',
          sortable: true
        },
        {
          name: 'python_desc',
          label: 'Description',
          field: 'python_desc',
          align: 'left'
        },
        {
          name: 'status',
          label: 'Status',
          field: 'status',
          align: 'center'
        },
        {
          name: 'version',
          label: 'Version',
          field: 'version',
          align: 'center'
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
      this.loadDependencies();
    }
  },

  computed: {
    filteredDependencies() {
      let filtered = this.dependencies;

      // Filter by search term
      if (this.searchTerm) {
        filtered = filtered.filter(pkg =>
          pkg.python_name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
          pkg.python_desc.toLowerCase().includes(this.searchTerm.toLowerCase())
        );
      }

      // Filter by status
      if (this.statusFilter !== 'all') {
        filtered = filtered.filter(pkg => pkg.status === this.statusFilter);
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
        this.loadDependencies();
      }
    } else {
      this.$router.push('/prijava');
    }
  },

  methods: {
    onRequest(props) {
      this.pagination = props.pagination;
      this.loadDependencies();
    },

    getStatusColor(status) {
      switch (status) {
        case 'installed': return 'positive'
        case 'pending': return 'warning'
        case 'failed': return 'negative'
        default: return 'grey'
      }
    },

    formatDate(date) {
      return new Date(date).toLocaleString();
    },

    async loadDependencies() {
      const limit = this.pagination.rowsPerPage === 0 ? this.pagination.rowsNumber : this.pagination.rowsPerPage;

      this.loading = true;
      try {
        const response = await axios.get(`python-packages`, {
          headers: this.headers,
          params: {
            page: this.pagination.page,
            limit: limit,
            search: this.searchTerm,
            sortBy: this.pagination.sortBy,
            descending: this.pagination.descending,
          },
        });
        this.dependencies = response.data;
        this.pagination.rowsNumber = response.data.total;
        this.calculateStats();
      } catch (error) {
        console.error('Error loading dependencies:', error);
        this.$q.notify({
          color: "negative",
          position: "top",
          message: "Greška pri dohvatu ovisnosti",
          icon: "report_problem",
        });
        // Fallback to mock data
        this.dependencies = [
          {
            python_id: 1,
            python_name: 'jupyterlab',
            python_desc: 'JupyterLab is a web-based interactive development environment',
            status: 'installed',
            version: '4.0.0',
            installDate: new Date(Date.now() - 86400000),
            dependencies: 'jupyter, notebook, ipython'
          },
          {
            python_id: 2,
            python_name: 'numpy',
            python_desc: 'Fundamental package for array computing with Python',
            status: 'installed',
            version: '1.24.0',
            installDate: new Date(Date.now() - 172800000),
            dependencies: 'none'
          },
          {
            python_id: 3,
            python_name: 'pandas',
            python_desc: 'Data manipulation and analysis library',
            status: 'pending',
            version: '2.0.0',
            dependencies: 'numpy, python-dateutil'
          },
          {
            python_id: 4,
            python_name: 'matplotlib',
            python_desc: 'Comprehensive library for creating static, animated, and interactive visualizations',
            status: 'failed',
            version: '3.7.0',
            dependencies: 'numpy, pillow'
          }
        ];
        this.calculateStats();
      } finally {
        this.loading = false;
      }
    },

    calculateStats() {
      const total = this.dependencies.length;
      const installed = this.dependencies.filter(p => p.status === 'installed').length;
      const pending = this.dependencies.filter(p => p.status === 'pending').length;
      const failed = this.dependencies.filter(p => p.status === 'failed').length;
      
      this.stats = {
        totalDependencies: total,
        installedDependencies: installed,
        pendingDependencies: pending,
        failedDependencies: failed
      };
    },

    async installDependency(dependency) {
      dependency.installing = true;
      try {
        const response = await axios.post(`python-packages/${dependency.python_id}/install`, {
          computerName: 'DESKTOP-ABC123' // You can make this dynamic
        }, {
          headers: this.headers,
        });
        const result = response.data;
        
        // Update status based on API response
        dependency.status = 'installed';
        dependency.installDate = new Date();
        dependency.version = '1.0.0'; // You might want to get this from the API response
        
        this.calculateStats();
        
        this.$q.notify({
          color: "positive",
          position: "top",
          message: result.message || `Dependency "${dependency.python_name}" installed successfully`,
          icon: "check",
        });
      } catch (error) {
        console.error('Error installing dependency:', error);
        dependency.status = 'failed';
        this.$q.notify({
          color: "negative",
          position: "top",
          message: "Greška pri instalaciji ovisnosti",
          icon: "report_problem",
        });
      } finally {
        dependency.installing = false;
      }
    },

    editDependency(dependency) {
      this.editingDependency = dependency;
      this.dependencyForm = { ...dependency };
      this.showAddDialog = true;
    },

    showDependencyDetails(dependency) {
      this.selectedDependency = dependency;
      this.showDetailsDialog = true;
    },

    deleteDependency(dependency) {
      this.dependencyToDelete = dependency;
      this.showDeleteDialog = true;
    },

    async confirmDelete() {
      try {
        await axios.delete(`python-packages/${this.dependencyToDelete.python_id}`, {
          headers: this.headers,
        });
        
        this.dependencies = this.dependencies.filter(p => p.python_id !== this.dependencyToDelete.python_id);
        this.calculateStats();
        
        this.$q.notify({
          color: "positive",
          position: "top",
          message: "Ovisnost uspješno obrisana",
          icon: "check",
        });
      } catch (error) {
        console.error('Error deleting dependency:', error);
        this.$q.notify({
          color: "negative",
          position: "top",
          message: "Greška pri brisanju ovisnosti",
          icon: "report_problem",
        });
      } finally {
        this.showDeleteDialog = false;
        this.dependencyToDelete = null;
      }
    },

    async saveDependency() {
      try {
        if (this.editingDependency) {
          // Update existing dependency
          const response = await axios.put(`python-packages/${this.editingDependency.python_id}`, this.dependencyForm, {
            headers: this.headers,
          });
          const updatedDependency = response.data;
          
          const index = this.dependencies.findIndex(p => p.python_id === this.editingDependency.python_id);
          this.dependencies[index] = updatedDependency;
        } else {
          // Create new dependency
          const response = await axios.post(`python-packages`, this.dependencyForm, {
            headers: this.headers,
          });
          const newDependency = response.data;
          this.dependencies.push(newDependency);
          this.calculateStats();
        }
        
        this.$q.notify({
          color: "positive",
          position: "top",
          message: `Ovisnost uspješno ${this.editingDependency ? 'ažurirana' : 'kreirana'}`,
          icon: "check",
        });
        
        this.closeDialog();
      } catch (error) {
        console.error('Error saving dependency:', error);
        this.$q.notify({
          color: "negative",
          position: "top",
          message: "Greška pri spremanju ovisnosti",
          icon: "report_problem",
        });
      }
    },

    async batchInstall() {
      if (this.selectedDependencies.length === 0) {
        this.$q.notify({
          color: "warning",
          position: "top",
          message: "Molimo odaberite ovisnosti za instalaciju",
          icon: "warning",
        });
        return;
      }

      this.batchInstalling = true;
      try {
        // Mock batch installation
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // Update selected dependencies
        this.selectedDependencies.forEach(dependencyId => {
          const dependency = this.dependencies.find(p => p.python_id === dependencyId);
          if (dependency) {
            dependency.status = 'installed';
            dependency.installDate = new Date();
            dependency.version = '1.0.0';
          }
        });
        
        this.calculateStats();
        this.selectedDependencies = [];
        this.showBatchDialog = false;
        
        this.$q.notify({
          color: "positive",
          position: "top",
          message: "Batch instalacija uspješno završena",
          icon: "check",
        });
      } catch (error) {
        console.error('Error in batch installation:', error);
        this.$q.notify({
          color: "negative",
          position: "top",
          message: "Batch instalacija neuspješna",
          icon: "report_problem",
        });
      } finally {
        this.batchInstalling = false;
      }
    },

    closeDialog() {
      this.showAddDialog = false;
      this.editingDependency = null;
      this.dependencyForm = {
        python_name: '',
        python_desc: ''
      };
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
<template>
  <q-page class="q-pa-md">
    <!-- Page Header -->
    <div class="row q-mb-lg">
      <div class="col-12">
        <div class="row items-center justify-between">
          <div>
            <h4 class="text-h4 q-mb-sm">Software Installation</h4>
            <p class="text-subtitle1 text-grey-6">Manage programs and software installations</p>
          </div>
          <q-btn
            color="primary"
            icon="add"
            label="Add Program"
            @click="showAddDialog = true"
          />
        </div>
      </div>
    </div>

    <!-- Search and Filters -->
    <div class="row q-mb-md">
      <div class="col-12 col-md-4">
        <q-input
          v-model="searchTerm"
          placeholder="Search programs..."
          outlined
          dense
          clearable
        >
          <template v-slot:prepend>
            <q-icon name="search" />
          </template>
        </q-input>
      </div>
      <div class="col-12 col-md-4">
        <q-select
          v-model="categoryFilter"
          :options="categoryOptions"
          label="Filter by Category"
          outlined
          dense
          clearable
        />
      </div>
      <div class="col-12 col-md-4">
        <q-btn-toggle
          v-model="statusFilter"
          :options="[
            { label: 'All', value: 'all' },
            { label: 'Enabled', value: true },
            { label: 'Disabled', value: false }
          ]"
          color="primary"
          class="full-width"
        />
      </div>
    </div>

    <!-- Programs Table -->
    <q-card>
      <q-card-section>
        <q-table
          :rows="filteredPrograms"
          :columns="columns"
          row-key="program_id"
          :loading="loading"
          v-model:pagination="pagination"
          :rows-per-page-options="[5, 10, 20, 25, 50]" 
          @request="onRequest"
          flat
        >
          <template v-slot:body-cell="props">
            <q-td :props="props">
              <!-- Category column -->
              <q-chip
                v-if="props.col.name === 'category'"
                :color="getCategoryColor(props.value)"
                text-color="white"
                size="mh"
              >
                {{ props.value }}
              </q-chip>

              <!-- Enabled column -->
              <q-toggle
                v-else-if="props.col.name === 'enabled'"
                v-model="props.row.program_enabled"
                @update:model-value="toggleProgram(props.row)"
                color="primary"
                size="mh"
              />

              <!-- Actions column -->
              <q-btn-group v-else-if="props.col.name === 'actions'" flat>
                <q-btn
                  flat
                  round
                  color="secondary"
                  icon="edit"
                  @click="editProgram(props.row)"
                >
                  <q-tooltip>Edit</q-tooltip>
                </q-btn>
                <q-btn
                  flat
                  round
                  color="info"
                  icon="info"
                  @click="showProgramDetails(props.row)"
                >
                  <q-tooltip>Details</q-tooltip>
                </q-btn>
                <q-btn
                  flat
                  round
                  color="negative"
                  icon="delete"
                  @click="deleteProgram(props.row)"
                >
                  <q-tooltip>Delete</q-tooltip>
                </q-btn>
              </q-btn-group>

              <!-- Default: just show the value -->
              <span v-else>
                {{ props.value }}
              </span>
            </q-td>
          </template>
        </q-table>
      </q-card-section>
    </q-card>

    <!-- Add/Edit Dialog -->
    <q-dialog v-model="showAddDialog" persistent>
      <q-card style="min-width: 600px">
        <q-card-section>
          <div class="text-h6">{{ editingProgram ? 'Edit Program' : 'Add New Program' }}</div>
        </q-card-section>

        <q-card-section>
          <q-form @submit="saveProgram" class="q-gutter-md">
            <q-input
              v-model="programForm.program_name"
              label="Program Name"
              outlined
              :rules="[val => !!val || 'Name is required']"
            />
            
            <q-input
              v-model="programForm.program_desc"
              label="Description"
              outlined
              type="textarea"
              rows="2"
            />
            
            <q-select
              v-model="programForm.program_category"
              :options="categoryOptions"
              label="Category"
              outlined
              :rules="[val => !!val || 'Category is required']"
            />
            
            <q-input
              v-model="programForm.program_package"
              label="Package/Installation Command"
              outlined
              type="textarea"
              rows="3"
              :rules="[val => !!val || 'Package is required']"
              hint="Enter package name or installation command"
            />
            
            <q-toggle
              v-model="programForm.program_enabled"
              label="Enabled"
            />
          </q-form>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancel" color="primary" @click="closeDialog" />
          <q-btn unelevated label="Save" color="primary" @click="saveProgram" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Program Details Dialog -->
    <q-dialog v-model="showDetailsDialog">
      <q-card style="min-width: 500px">
        <q-card-section>
          <div class="text-h6">Program Details</div>
        </q-card-section>

        <q-card-section v-if="selectedProgram">
          <div class="q-gutter-y-md">
            <q-input
              class="q-mt-sm"
              outlined
              readonly
              dense
              :model-value="selectedProgram.program_name"
            />
            <div v-if="selectedProgram.program_desc">
              <strong>Description:</strong> <q-input
                class="q-mt-sm"
                outlined
                readonly
                dense
                :model-value="selectedProgram.program_desc"
              />
            </div>
            <div>
              <strong>Category:</strong>
              <q-chip
                :color="getCategoryColor(selectedProgram.program_category)"
                text-color="white"
                size="mh"
                class="q-ml-sm"
              >
                {{ selectedProgram.program_category }}
              </q-chip>
            </div>
            <div>
              <strong>Package:</strong>
              <q-input
                class="q-mt-sm"
                outlined
                readonly
                dense
                :model-value="selectedProgram.program_package"
              />
            </div>
            <div>
              <strong>Status:</strong>
              <q-chip
                :color="selectedProgram.program_enabled ? 'positive' : 'negative'"
                text-color="white"
                size="mh"
                class="q-ml-sm"
              >
                {{ selectedProgram.program_enabled ? 'Enabled' : 'Disabled' }}
              </q-chip>
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
          Are you sure you want to delete "{{ programToDelete?.program_name }}"?
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancel" color="primary" @click="showDeleteDialog = false" />
          <q-btn unelevated label="Delete" color="negative" @click="confirmDelete" />
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
      categoryFilter: null,
      statusFilter: 'all',
      showAddDialog: false,
      showDetailsDialog: false,
      showDeleteDialog: false,
      editingProgram: null,
      selectedProgram: null,
      programToDelete: null,
      programs: [],
      programForm: {
        program_name: '',
        program_desc: '',
        program_category: '',
        program_package: '',
        program_enabled: true
      },
      categoryOptions: [
        'Instalacija dodataka',
        'Instalacija programa'
      ],
      pagination: {
        rowsPerPage: 10,
        sortBy: "program_id",
        descending: false,
        rowsNumber: 0,
        page: 1,
        rows: 0,
      },
      columns: [
        {
          name: 'program_name',
          label: 'Program Name',
          field: 'program_name',
          align: 'left',
          sortable: true
        },
        {
          name: 'program_desc',
          label: 'Description',
          field: 'program_desc',
          align: 'left'
        },
        {
          name: 'category',
          label: 'Category',
          field: 'program_category',
          align: 'center'
        },
        {
          name: 'package',
          label: 'Package',
          field: 'program_package',
          align: 'left',
          style: 'max-width: 200px'
        },
        {
          name: 'enabled',
          label: 'Enabled',
          field: 'program_enabled',
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
      this.loadPrograms();
    }
  },

  computed: {
    filteredPrograms() {
      let filtered = this.programs;

      // Filter by search term
      if (this.searchTerm) {
        filtered = filtered.filter(program =>
          program.program_name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
          (program.program_desc && program.program_desc.toLowerCase().includes(this.searchTerm.toLowerCase())) ||
          program.program_package.toLowerCase().includes(this.searchTerm.toLowerCase())
        );
      }

      // Filter by category
      if (this.categoryFilter) {
        filtered = filtered.filter(program => program.program_category === this.categoryFilter);
      }

      // Filter by status
      if (this.statusFilter !== 'all') {
        filtered = filtered.filter(program => program.program_enabled === this.statusFilter);
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
        this.loadPrograms();
      }
    } else {
      this.$router.push('/prijava');
    }
  },

  methods: {
    onRequest(props) {
      this.pagination = props.pagination;
      this.loadPrograms();
    },

    getCategoryColor(category) {
      switch (category) {
        case 'Instalacija dodataka': return 'info'
        case 'Instalacija programa': return 'primary'
        default: return 'grey'
      }
    },

    async loadPrograms() {
      const limit = this.pagination.rowsPerPage === 0 ? this.pagination.rowsNumber : this.pagination.rowsPerPage;

      this.loading = true;
      try {
        const response = await axios.get(`programs`, {
          headers: this.headers,
          params: {
            page: this.pagination.page,
            limit: limit,
            search: this.searchTerm,
            sortBy: this.pagination.sortBy,
            descending: this.pagination.descending,
          },
        });
        this.programs = response.data;
        this.pagination.rowsNumber = response.data.total;
      } catch (error) {
        console.error('Error loading programs:', error);
        this.$q.notify({
          color: "negative",
          position: "top",
          message: "Greška pri dohvatu programa",
          icon: "report_problem",
        });
        // Fallback to mock data
        this.programs = [
          {
            program_id: 1,
            program_name: 'Microsoft NET 5-7',
            program_desc: 'Microsoft .NET SDK versions 5, 6, and 7',
            program_category: 'Instalacija dodataka',
            program_package: 'Microsoft.DotNet.SDK.5, Microsoft.DotNet.SDK.6, Microsoft.DotNet.SDK.7',
            program_enabled: true
          },
          {
            program_id: 2,
            program_name: 'Visual Studio Code',
            program_desc: 'Lightweight code editor',
            program_category: 'Instalacija programa',
            program_package: 'Microsoft.VisualStudioCode',
            program_enabled: true
          },
          {
            program_id: 3,
            program_name: '7-Zip',
            program_desc: 'File archiver',
            program_category: 'Instalacija programa',
            program_package: '7zip.7zip',
            program_enabled: false
          }
        ];
      } finally {
        this.loading = false;
      }
    },

    async installProgram(program) {
      program.installing = true;
      try {
        const response = await axios.post(`programs/${program.program_id}/install`, {
          computerName: 'DESKTOP-ABC123' // You can make this dynamic
        }, {
          headers: this.headers,
        });
        const result = response.data;
        
        this.$q.notify({
          color: "positive",
          position: "top",
          message: result.message || `Program "${program.program_name}" installation started`,
          icon: "check",
        });
      } catch (error) {
        console.error('Error installing program:', error);
        this.$q.notify({
          color: "negative",
          position: "top",
          message: "Greška pri instalaciji programa",
          icon: "report_problem",
        });
      } finally {
        program.installing = false;
      }
    },

    editProgram(program) {
      this.editingProgram = program;
      this.programForm = { ...program };
      this.showAddDialog = true;
    },

    showProgramDetails(program) {
      this.selectedProgram = program;
      this.showDetailsDialog = true;
    },

    deleteProgram(program) {
      this.programToDelete = program;
      this.showDeleteDialog = true;
    },

    async confirmDelete() {
      try {
        await axios.delete(`programs/${this.programToDelete.program_id}`, {
          headers: this.headers,
        });
        
        this.programs = this.programs.filter(p => p.program_id !== this.programToDelete.program_id);
        
        this.$q.notify({
          color: "positive",
          position: "top",
          message: "Program uspješno obrisan",
          icon: "check",
        });
      } catch (error) {
        console.error('Error deleting program:', error);
        this.$q.notify({
          color: "negative",
          position: "top",
          message: "Greška pri brisanju programa",
          icon: "report_problem",
        });
      } finally {
        this.showDeleteDialog = false;
        this.programToDelete = null;
      }
    },

    async saveProgram() {
      try {
        if (this.editingProgram) {
          // Update existing program
          const response = await axios.put(`programs/${this.editingProgram.program_id}`, this.programForm, {
            headers: this.headers,
          });
          const updatedProgram = response.data;
          
          const index = this.programs.findIndex(p => p.program_id === this.editingProgram.program_id);
          this.programs[index] = updatedProgram;
        } else {
          // Create new program
          const response = await axios.post(`programs`, this.programForm, {
            headers: this.headers,
          });
          const newProgram = response.data;
          this.programs.push(newProgram);
        }
        
        this.$q.notify({
          color: "positive",
          position: "top",
          message: `Program uspješno ${this.editingProgram ? 'ažuriran' : 'kreiran'}`,
          icon: "check",
        });
        
        this.closeDialog();
      } catch (error) {
        console.error('Error saving program:', error);
        this.$q.notify({
          color: "negative",
          position: "top",
          message: "Greška pri spremanju programa",
          icon: "report_problem",
        });
      }
    },

    async toggleProgram(program) {
      try {
        await axios.put(`programs/${program.program_id}`, { 
          program_enabled: program.program_enabled 
        }, {
          headers: this.headers,
        });
        
        this.$q.notify({
          color: "positive",
          position: "top",
          message: `Program ${program.program_enabled ? 'omogućen' : 'onemogućen'}`,
          icon: "check",
        });
      } catch (error) {
        console.error('Error toggling program:', error);
        program.program_enabled = !program.program_enabled; // Revert on error
        this.$q.notify({
          color: "negative",
          position: "top",
          message: "Greška pri ažuriranju programa",
          icon: "report_problem",
        });
      }
    },

    closeDialog() {
      this.showAddDialog = false;
      this.editingProgram = null;
      this.programForm = {
        program_name: '',
        program_desc: '',
        program_category: '',
        program_package: '',
        program_enabled: true
      };
    }
  }
};
</script> 
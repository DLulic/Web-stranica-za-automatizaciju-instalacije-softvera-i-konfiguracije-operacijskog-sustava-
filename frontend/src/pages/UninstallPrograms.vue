<template>
  <q-page class="q-pa-md">
    <!-- Page Header -->
    <div class="row q-mb-lg">
      <div class="col-12">
        <div class="row items-center justify-between">
          <div>
            <h4 class="text-h4 q-mb-sm">Uninstall Programs</h4>
            <p class="text-subtitle1 text-grey-6">Manage programs available for uninstallation</p>
          </div>
          <q-btn
            color="primary"
            icon="add"
            label="Add Uninstall Program"
            @click="showAddDialog = true"
          />
        </div>
      </div>
    </div>

    <!-- Search and Filters -->
    <div class="row q-mb-md">
      <div class="col-12 col-md-6">
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
    </div>

    <!-- Uninstall Programs Table -->
    <q-card>
      <q-card-section>
        <q-table
          :rows="programs"
          :columns="columns"
          row-key="uninstall_id"
          :loading="loading"
          v-model:pagination="pagination"
          :rows-per-page-options="[5, 10, 25, 50, 0]"
          @request="onRequest"
          flat
        >
          <template v-slot:body-cell-actions="props">
            <q-td :props="props">
              <q-btn-group flat>
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
                  color="negative"
                  icon="delete"
                  @click="deleteProgram(props.row)"
                >
                  <q-tooltip>Delete</q-tooltip>
                </q-btn>
              </q-btn-group>
            </q-td>
          </template>
        </q-table>
      </q-card-section>
    </q-card>

    <!-- Add/Edit Dialog -->
    <q-dialog v-model="showAddDialog" persistent>
      <q-card style="min-width: 500px">
        <q-card-section>
          <div class="text-h6">{{ editingProgram ? 'Edit Program' : 'Add New Uninstall Program' }}</div>
        </q-card-section>

        <q-card-section>
          <q-form @submit="saveProgram" class="q-gutter-md">
            <q-input
              v-model="programForm.uninstall_name"
              label="Display Name"
              outlined
              :rules="[val => !!val || 'Display Name is required']"
            />
            <q-input
              v-model="programForm.uninstall_name_program"
              label="Program Name (from registry)"
              outlined
              :rules="[val => !!val || 'Program Name is required']"
            />
            <q-input
              v-model="programForm.uninstall_source"
              label="Source (e.g., MSI product code)"
              outlined
              :rules="[val => !!val || 'Source is required']"
            />
          </q-form>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancel" color="primary" @click="closeDialog" />
          <q-btn unelevated label="Save" color="primary" @click="saveProgram" />
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
          Are you sure you want to delete "{{ programToDelete?.uninstall_name }}"?
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

export default {
  data() {
    return {
      headers: null,
      loading: false,
      searchTerm: '',
      showAddDialog: false,
      showDeleteDialog: false,
      editingProgram: null,
      programToDelete: null,
      programs: [],
      programForm: {
        uninstall_name: '',
        uninstall_name_program: '',
        uninstall_source: ''
      },
      pagination: {
        rowsPerPage: 10,
        sortBy: "uninstall_name",
        descending: false,
        rowsNumber: 0,
        page: 1
      },
      columns: [
        { name: 'uninstall_name', label: 'Display Name', field: 'uninstall_name', align: 'left', sortable: true },
        { name: 'uninstall_name_program', label: 'Program Name', field: 'uninstall_name_program', align: 'left', sortable: true },
        { name: 'uninstall_source', label: 'Source', field: 'uninstall_source', align: 'left' },
        { name: 'actions', label: 'Actions', field: 'actions', align: 'center' }
      ]
    };
  },
  computed: {
    filteredPrograms() {
      if (!this.searchTerm) {
        return this.programs;
      }
      return this.programs.filter(program =>
        program.uninstall_name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        program.uninstall_name_program.toLowerCase().includes(this.searchTerm.toLowerCase())
      );
    }
  },
  watch: {
    "pagination.rowsPerPage"() {
      this.loadPrograms();
    },
    searchTerm() {
      this.loadPrograms();
    }
  },
  async mounted() {
    const token = localStorage.getItem("token");
    if (token) {
      this.headers = { Authorization: `Bearer ${token}` };
      this.loadPrograms();
    } else {
      this.$router.push('/prijava');
    }
  },
  methods: {
    onRequest(props) {
      this.pagination = props.pagination;
      this.loadPrograms();
    },
    async loadPrograms() {
      this.loading = true;
      try {
        const { page, rowsPerPage, sortBy, descending } = this.pagination;
        const limit = rowsPerPage === 0 ? null : rowsPerPage;

        const response = await axios.get('/uninstall-programs', { 
          headers: this.headers,
          params: {
            page,
            limit,
            sortBy,
            descending,
            search: this.searchTerm
          }
        });
        this.programs = response.data.items;
        this.pagination.rowsNumber = response.data.total;
      } catch (error) {
        console.error('Error loading uninstall programs:', error);
        this.$q.notify({ color: 'negative', message: 'Failed to load uninstall programs.' });
      } finally {
        this.loading = false;
      }
    },
    editProgram(program) {
      this.editingProgram = program;
      this.programForm = { ...program };
      this.showAddDialog = true;
    },
    deleteProgram(program) {
      this.programToDelete = program;
      this.showDeleteDialog = true;
    },
    async confirmDelete() {
      try {
        await axios.delete(`/uninstall-programs/${this.programToDelete.uninstall_id}`, { headers: this.headers });
        this.programs = this.programs.filter(p => p.uninstall_id !== this.programToDelete.uninstall_id);
        this.$q.notify({ color: 'positive', message: 'Program deleted successfully.' });
      } catch (error) {
        console.error('Error deleting program:', error);
        this.$q.notify({ color: 'negative', message: 'Failed to delete program.' });
      } finally {
        this.showDeleteDialog = false;
        this.programToDelete = null;
      }
    },
    async saveProgram() {
      try {
        if (this.editingProgram) {
          const response = await axios.put(`/uninstall-programs/${this.editingProgram.uninstall_id}`, this.programForm, { headers: this.headers });
          const index = this.programs.findIndex(p => p.uninstall_id === this.editingProgram.uninstall_id);
          this.programs[index] = response.data;
        } else {
          const response = await axios.post('/uninstall-programs', this.programForm, { headers: this.headers });
          this.programs.push(response.data);
        }
        this.$q.notify({ color: 'positive', message: `Program ${this.editingProgram ? 'updated' : 'added'} successfully.` });
        this.closeDialog();
      } catch (error) {
        console.error('Error saving program:', error);
        this.$q.notify({ color: 'negative', message: 'Failed to save program.' });
      }
    },
    closeDialog() {
      this.showAddDialog = false;
      this.editingProgram = null;
      this.programForm = { uninstall_name: '', uninstall_name_program: '', uninstall_source: '' };
    }
  }
};
</script> 
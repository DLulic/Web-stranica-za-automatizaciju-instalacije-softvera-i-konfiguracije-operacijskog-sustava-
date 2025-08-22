<template>
  <q-page class="q-pa-md">
    <!-- Page Header -->
    <div class="row q-mb-lg">
      <div class="col-12">
        <div class="row items-center justify-between">
          <div>
            <h4 class="text-h4 q-mb-sm">Windows Settings</h4>
            <p class="text-subtitle1 text-grey-6">Manage Windows system settings and commands</p>
          </div>
          <q-btn
            color="primary"
            icon="add"
            label="Add Setting"
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
          placeholder="Search settings..."
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
            { label: 'Enabled', value: true },
            { label: 'Disabled', value: false }
          ]"
          color="primary"
        />
      </div>
    </div>

    <!-- Settings Table -->
    <q-card>
      <q-card-section>
        <q-table
          :rows="filteredSettings"
          :columns="columns"
          row-key="settings_id"
          :loading="loading"
          v-model:pagination="pagination"
          :rows-per-page-options="[5, 10, 20, 25, 50]" 
          @request="onRequest"
          flat
        >
          <template v-slot:body-cell="props">
            <q-td :props="props">
              <!-- Enabled column -->
              <q-toggle
                v-if="props.col.name === 'enabled'"
                v-model="props.row.settings_enable"
                @update:model-value="toggleSetting(props.row)"
                color="primary"
                size="sm"
              />

              <!-- Actions column -->
              <q-btn-group v-else-if="props.col.name === 'actions'" flat>
                <q-btn
                  flat
                  round
                  color="secondary"
                  icon="edit"
                  @click="editSetting(props.row)"
                >
                  <q-tooltip>Edit</q-tooltip>
                </q-btn>
                <q-btn
                  flat
                  round
                  color="negative"
                  icon="delete"
                  @click="deleteSetting(props.row)"
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
    <q-dialog v-model="showAddDialog" @keyup.esc="showAddDialog = false">
      <q-card style="min-width: 500px">
        <q-card-section>
          <div class="text-h6">{{ editingSetting ? 'Edit Setting' : 'Add New Setting' }}</div>
        </q-card-section>

        <q-card-section>
          <q-form @submit="saveSetting" class="q-gutter-md">
            <q-input
              v-model="settingForm.settings_name"
              label="Setting Name"
              outlined
              :rules="[val => !!val || 'Name is required']"
            />
            
            <q-input
              v-model="settingForm.settings_command"
              label="Command"
              outlined
              type="textarea"
              rows="3"
              :rules="[val => !!val || 'Command is required']"
            />
            
            <q-toggle
              v-model="settingForm.settings_enable"
              label="Enabled"
            />
          </q-form>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancel" color="primary" @click="closeDialog" />
          <q-btn unelevated label="Save" color="primary" @click="saveSetting" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Delete Confirmation -->
    <q-dialog v-model="showDeleteDialog" @keyup.esc="showDeleteDialog = false">
      <q-card>
        <q-card-section>
          <div class="text-h6">Confirm Delete</div>
        </q-card-section>

        <q-card-section>
          Are you sure you want to delete "{{ settingToDelete?.settings_name }}"?
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
      statusFilter: 'all',
      showAddDialog: false,
      showDeleteDialog: false,
      editingSetting: null,
      settingToDelete: null,
      settings: [],
      settingForm: {
        settings_name: '',
        settings_command: '',
        settings_enable: true
      },
      pagination:{
        rowsPerPage: 10,
        sortBy: "settings_id",
        descending: false,
        rowsNumber: 0,
        page: 1,
        rows: 0,
      },
      columns: [
        {
          name: 'settings_name',
          label: 'Setting Name',
          field: 'settings_name',
          align: 'left',
          sortable: true
        },
        {
          name: 'settings_command',
          label: 'Command',
          field: 'settings_command',
          align: 'left',
          style: 'max-width: 300px'
        },
        {
          name: 'enabled',
          label: 'Enabled',
          field: 'settings_enable',
          align: 'center',
          format: (val) => this.getEnabledStatus(val),
          style: (row) => `color: ${this.getEnabledColor(row.settings_enable) === 'positive' ? 'green' : 'red'}`
        },
        {
          name: 'actions',
          label: 'Actions',
          field: 'actions',
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
      this.loadSettings();
    }
  },

  onRequest(props) {
    this.pagination = props.pagination;
    this.loadSettings();
  },

  computed: {
    filteredSettings() {
      let filtered = this.settings;

      // Filter by search term
      if (this.searchTerm) {
        filtered = filtered.filter(setting =>
          setting.settings_name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
          setting.settings_command.toLowerCase().includes(this.searchTerm.toLowerCase())
        );
      }

      // Filter by status
      if (this.statusFilter !== 'all') {
        filtered = filtered.filter(setting => setting.settings_enable === this.statusFilter);
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
        this.loadSettings();
      }
    } else {
      this.$router.push('/prijava');
    }
  },

  methods: {
    getEnabledStatus(enabled) {
      return enabled ? 'Yes' : 'No';
    },

    getEnabledColor(enabled) {
      return enabled ? 'positive' : 'negative';
    },

    async loadSettings() {
      const limit = this.pagination.rowsPerPage === 0 ? this.pagination.rowsNumber : this.pagination.rowsPerPage;

      this.loading = true;
      try {
        const response = await axios.get(`windows-settings`, {
          headers: this.headers,
          params: {
                page: this.pagination.page,
                limit: limit,
                search: this.search,
                sortBy: this.pagination.sortBy,
                descending: this.pagination.descending,
            },
        });
        this.settings = response.data;
        this.pagination.rowsNumber = response.data.total;
      } catch (error) {
        console.error('Error loading settings:', error);
        this.$q.notify({
          color: "negative",
          position: "top",
          message: "Greška pri dohvatu postavki",
          icon: "report_problem",
        });
        // Fallback to mock data
        this.settings = [
          {
            settings_id: 1,
            settings_name: 'Aktiviranje Windows-a',
            settings_command: 'slmgr.vbs /ipk <Your-Product-Key>; slmgr.vbs /ato',
            settings_enable: true
          },
          {
            settings_id: 2,
            settings_name: 'Disable Windows Updates',
            settings_command: 'sc stop wuauserv; sc config wuauserv start=disabled',
            settings_enable: false
          }
        ];
      } finally {
        this.loading = false;
      }
    },

    async executeSetting(setting) {
      setting.executing = true;
      try {
        const response = await axios.post(`windows-settings/${setting.settings_id}/execute`, {
          computerName: 'DESKTOP-ABC123' // You can make this dynamic
        }, {
          headers: this.headers,
        });
        const result = response.data;
        
        this.$q.notify({
          color: "positive",
          position: "top",
          message: result.message || `Setting "${setting.settings_name}" executed successfully`,
          icon: "check",
        });
      } catch (error) {
        console.error('Error executing setting:', error);
        this.$q.notify({
          color: "negative",
          position: "top",
          message: "Greška pri izvršavanju postavke",
          icon: "report_problem",
        });
      } finally {
        setting.executing = false;
      }
    },

    editSetting(setting) {
      this.editingSetting = setting;
      this.settingForm = { ...setting };
      this.showAddDialog = true;
    },

    deleteSetting(setting) {
      this.settingToDelete = setting;
      this.showDeleteDialog = true;
    },

    async confirmDelete() {
      try {
        await axios.delete(`windows-settings/${this.settingToDelete.settings_id}`, {
          headers: this.headers,
        });
        
        this.settings = this.settings.filter(s => s.settings_id !== this.settingToDelete.settings_id);
        
        this.$q.notify({
          color: "positive",
          position: "top",
          message: "Postavka uspješno obrisana",
          icon: "check",
        });
      } catch (error) {
        console.error('Error deleting setting:', error);
        this.$q.notify({
          color: "negative",
          position: "top",
          message: "Greška pri brisanju postavke",
          icon: "report_problem",
        });
      } finally {
        this.showDeleteDialog = false;
        this.settingToDelete = null;
      }
    },

    async saveSetting() {
      try {
        if (this.editingSetting) {
          // Update existing setting
          const response = await axios.put(`windows-settings/${this.editingSetting.settings_id}`, this.settingForm, {
            headers: this.headers,
          });
          const updatedSetting = response.data;
          
          const index = this.settings.findIndex(s => s.settings_id === this.editingSetting.settings_id);
          this.settings[index] = updatedSetting;
        } else {
          // Create new setting
          const response = await axios.post(`windows-settings`, this.settingForm, {
            headers: this.headers,
          });
          const newSetting = response.data;
          this.settings.push(newSetting);
        }
        
        this.$q.notify({
          color: "positive",
          position: "top",
          message: `Postavka uspješno ${this.editingSetting ? 'ažurirana' : 'kreirana'}`,
          icon: "check",
        });
        
        this.closeDialog();
      } catch (error) {
        console.error('Error saving setting:', error);
        this.$q.notify({
          color: "negative",
          position: "top",
          message: "Greška pri spremanju postavke",
          icon: "report_problem",
        });
      }
    },

    async toggleSetting(setting) {
      try {
        await axios.put(`windows-settings/${setting.settings_id}`, { 
          settings_enable: setting.settings_enable 
        }, {
          headers: this.headers,
        });
        
        this.$q.notify({
          color: "positive",
          position: "top",
          message: `Postavka ${setting.settings_enable ? 'omogućena' : 'onemogućena'}`,
          icon: "check",
        });
      } catch (error) {
        console.error('Error toggling setting:', error);
        setting.settings_enable = !setting.settings_enable; // Revert on error
        this.$q.notify({
          color: "negative",
          position: "top",
          message: "Greška pri ažuriranju postavke",
          icon: "report_problem",
        });
      }
    },

    closeDialog() {
      this.showAddDialog = false;
      this.editingSetting = null;
      this.settingForm = {
        settings_name: '',
        settings_command: '',
        settings_enable: true
      };
    }
  }
};
</script> 
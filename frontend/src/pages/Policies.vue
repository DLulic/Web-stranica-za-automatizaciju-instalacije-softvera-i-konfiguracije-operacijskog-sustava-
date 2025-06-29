<template>
  <q-page class="q-pa-md">
    <!-- Page Header -->
    <div class="row q-mb-lg">
      <div class="col-12">
        <div class="row items-center justify-between">
          <div>
            <h4 class="text-h4 q-mb-sm">Group Policies</h4>
            <p class="text-subtitle1 text-grey-6">Manage Windows registry policies and group policy settings</p>
          </div>
          <q-btn
            color="primary"
            icon="add"
            label="Add Policy"
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
          placeholder="Search policies..."
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
          v-model="typeFilter"
          :options="typeOptions"
          label="Filter by Type"
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

    <!-- Policies Table -->
    <q-card>
      <q-card-section>
        <q-table
          :rows="filteredPolicies"
          :columns="columns"
          row-key="policies_id"
          :loading="loading"
          v-model:pagination="pagination"
          :rows-per-page-options="[5, 10, 20, 25, 50]" 
          @request="onRequest"
          flat
        >
          <template v-slot:body-cell="props">
            <q-td :props="props">
              <!-- Type column -->
              <q-chip
                v-if="props.col.name === 'type'"
                :color="getTypeColor(props.value)"
                text-color="white"
                size="mh"
              >
                {{ props.value }}
              </q-chip>

              <!-- Enabled column -->
              <q-toggle
                v-else-if="props.col.name === 'enabled'"
                v-model="props.row.policies_enable"
                @update:model-value="togglePolicy(props.row)"
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
                  @click="editPolicy(props.row)"
                >
                  <q-tooltip>Edit</q-tooltip>
                </q-btn>
                <q-btn
                  flat
                  round
                  color="info"
                  icon="info"
                  @click="showPolicyDetails(props.row)"
                >
                  <q-tooltip>Details</q-tooltip>
                </q-btn>
                <q-btn
                  flat
                  round
                  color="negative"
                  icon="delete"
                  @click="deletePolicy(props.row)"
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
      <q-card style="min-width: 700px">
        <q-card-section>
          <div class="text-h6">{{ editingPolicy ? 'Edit Policy' : 'Add New Policy' }}</div>
        </q-card-section>

        <q-card-section>
          <div class="q-gutter-y-md">
            <q-form @submit="savePolicy">
              <q-input
                v-model="policyForm.policies_name"
                label="Policy Name"
                outlined
                :rules="[val => !!val || 'Name is required']"
              />
              
              <q-input
                v-model="policyForm.policies_regName"
                label="Registry Name"
                outlined
                :rules="[val => !!val || 'Registry name is required']"
              />
              
              <q-input
                v-model="policyForm.policies_regPath"
                label="Registry Path"
                outlined
                :rules="[val => !!val || 'Registry path is required']"
              />
              
              <div class="row q-col-gutter-md">
                <div class="col-12 col-md-6">
                  <q-input
                    v-model="policyForm.policies_regVaule"
                    label="Registry Value"
                    outlined
                    :rules="[val => !!val || 'Registry value is required']"
                  />
                </div>
                <div class="col-12 col-md-6">
                  <q-input
                    v-model="policyForm.policies_regVauleRevert"
                    label="Revert Value"
                    outlined
                    :rules="[val => !!val || 'Revert value is required']"
                  />
                </div>
              </div>
              
              <q-select
                v-model="policyForm.policies_type"
                :options="typeOptions"
                label="Registry Type"
                outlined
                :rules="[val => !!val || 'Type is required']"
              />
              
              <q-toggle
                v-model="policyForm.policies_enable"
                label="Enabled"
              />
            </q-form>
          </div>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancel" color="primary" @click="closeDialog" />
          <q-btn unelevated label="Save" color="primary" @click="savePolicy" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Policy Details Dialog -->
    <q-dialog v-model="showDetailsDialog">
      <q-card style="min-width: 600px">
        <q-card-section>
          <div class="text-h6">Policy Details</div>
        </q-card-section>

        <q-card-section v-if="selectedPolicy">
          <div class="q-gutter-y-md">
            <div>
              <strong>Name:</strong> <q-input
                class="q-mt-sm"
                outlined
                readonly
                dense
                :model-value="selectedPolicy.policies_name"
              />
            </div>
            <div>
              <strong>Registry Name:</strong>
              <q-input
                class="q-mt-sm"
                outlined
                readonly
                dense
                :model-value="selectedPolicy.policies_regName"
              />
            </div>
            <div>
              <strong>Registry Path:</strong>
              <q-input
                class="q-mt-sm"
                outlined
                readonly
                dense
                :model-value="selectedPolicy.policies_regPath"
              />
            </div>
            
            <div class="row q-col-gutter-md">
              <div class="col-12 col-md-6">
                <strong>Registry Value:</strong>
                <q-input
                  class="q-mt-sm"
                  outlined
                  readonly
                  dense
                  :model-value="selectedPolicy.policies_regVaule"
                />
              </div>
              <div class="col-12 col-md-6">
                <strong>Revert Value:</strong>
                <q-input
                  class="q-mt-sm"
                  outlined
                  readonly
                  dense
                  :model-value="selectedPolicy.policies_regVauleRevert"
                />
              </div>
            </div>
            <div>
              <strong>Type:</strong>
              <q-chip
                :color="getTypeColor(selectedPolicy.policies_type)"
                text-color="white"
                size="mh"
                class="q-ml-sm"
              >
                {{ selectedPolicy.policies_type }}
              </q-chip>
            </div>
            <div>
              <strong>Status:</strong>
              <q-chip
                :color="selectedPolicy.policies_enable ? 'positive' : 'negative'"
                text-color="white"
                size="mh"
                class="q-ml-sm"
              >
                {{ selectedPolicy.policies_enable ? 'Enabled' : 'Disabled' }}
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
          Are you sure you want to delete "{{ policyToDelete?.policies_name }}"?
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
      typeFilter: null,
      statusFilter: 'all',
      showAddDialog: false,
      showDetailsDialog: false,
      showDeleteDialog: false,
      editingPolicy: null,
      selectedPolicy: null,
      policyToDelete: null,
      policies: [],
      policyForm: {
        policies_name: '',
        policies_regName: '',
        policies_regPath: '',
        policies_regVaule: '',
        policies_regVauleRevert: '',
        policies_type: '',
        policies_enable: true
      },
      typeOptions: [
        { label: 'DWORD', value: 'DWORD' },
        { label: 'String', value: 'String' }
      ],
      pagination: {
        rowsPerPage: 10,
        sortBy: "policies_id",
        descending: false,
        rowsNumber: 0,
        page: 1,
        rows: 0,
      },
      columns: [
        {
          name: 'policies_name',
          label: 'Policy Name',
          field: 'policies_name',
          align: 'left',
          sortable: true
        },
        {
          name: 'policies_regName',
          label: 'Registry Name',
          field: 'policies_regName',
          align: 'left'
        },
        {
          name: 'policies_regPath',
          label: 'Registry Path',
          field: 'policies_regPath',
          align: 'left',
          style: 'max-width: 250px'
        },
        {
          name: 'policies_regVaule',
          label: 'Value',
          field: 'policies_regVaule',
          align: 'center'
        },
        {
          name: 'type',
          label: 'Type',
          field: 'policies_type',
          align: 'center'
        },
        {
          name: 'enabled',
          label: 'Enabled',
          field: 'policies_enable',
          align: 'center'
        },
        {
          name: 'actions',
          label: 'Actions',
          align: 'center',
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
      this.loadPolicies();
    }
  },

  computed: {
    filteredPolicies() {
      let filtered = this.policies;

      // Filter by search term
      if (this.searchTerm) {
        filtered = filtered.filter(policy =>
          policy.policies_name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
          policy.policies_regName.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
          policy.policies_regPath.toLowerCase().includes(this.searchTerm.toLowerCase())
        );
      }

      // Filter by type
      if (this.typeFilter) {
        filtered = filtered.filter(policy => policy.policies_type === this.typeFilter);
      }

      // Filter by status
      if (this.statusFilter !== 'all') {
        filtered = filtered.filter(policy => policy.policies_enable === this.statusFilter);
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
        this.loadPolicies();
      }
    } else {
      this.$router.push('/prijava');
    }
  },

  methods: {
    onRequest(props) {
      this.pagination = props.pagination;
      this.loadPolicies();
    },

    getTypeColor(type) {
      switch (type) {
        case 'DWORD': return 'primary'
        case 'String': return 'secondary'
        default: return 'grey'
      }
    },

    async loadPolicies() {
      const limit = this.pagination.rowsPerPage === 0 ? this.pagination.rowsNumber : this.pagination.rowsPerPage;

      this.loading = true;
      try {
        const response = await axios.get(`policies`, {
          headers: this.headers,
          params: {
            page: this.pagination.page,
            limit: limit,
            search: this.searchTerm,
            sortBy: this.pagination.sortBy,
            descending: this.pagination.descending,
          },
        });
        this.policies = response.data;
        this.pagination.rowsNumber = response.data.total;
      } catch (error) {
        console.error('Error loading policies:', error);
        this.$q.notify({
          color: "negative",
          position: "top",
          message: "Greška pri dohvatu politika",
          icon: "report_problem",
        });
        // Fallback to mock data
        this.policies = [
          {
            policies_id: 1,
            policies_name: 'Allow Cortana',
            policies_regName: 'AllowCortana',
            policies_regPath: 'HKLM:\\SOFTWARE\\Policies\\Microsoft\\Windows\\Windows Search',
            policies_regVaule: '1',
            policies_regVauleRevert: '0',
            policies_type: 'DWORD',
            policies_enable: true
          },
          {
            policies_id: 2,
            policies_name: 'Disable Windows Store',
            policies_regName: 'DisableStoreApplications',
            policies_regPath: 'HKLM:\\SOFTWARE\\Policies\\Microsoft\\WindowsStore',
            policies_regVaule: '1',
            policies_regVauleRevert: '0',
            policies_type: 'DWORD',
            policies_enable: false
          },
          {
            policies_id: 3,
            policies_name: 'Custom Policy',
            policies_regName: 'CustomSetting',
            policies_regPath: 'HKLM:\\SOFTWARE\\Custom\\Settings',
            policies_regVaule: 'enabled',
            policies_regVauleRevert: 'disabled',
            policies_type: 'String',
            policies_enable: true
          }
        ];
      } finally {
        this.loading = false;
      }
    },

    async applyPolicy(policy) {
      policy.applying = true;
      try {
        const response = await axios.post(`policies/${policy.policies_id}/apply`, {
          computerName: 'DESKTOP-ABC123' // You can make this dynamic
        }, {
          headers: this.headers,
        });
        const result = response.data;
        
        this.$q.notify({
          color: "positive",
          position: "top",
          message: result.message || `Policy "${policy.policies_name}" applied successfully`,
          icon: "check",
        });
      } catch (error) {
        console.error('Error applying policy:', error);
        this.$q.notify({
          color: "negative",
          position: "top",
          message: "Greška pri primjeni politike",
          icon: "report_problem",
        });
      } finally {
        policy.applying = false;
      }
    },

    async revertPolicy(policy) {
      policy.reverting = true;
      try {
        // Note: You might want to add a revert endpoint to your API
        // For now, we'll use the apply endpoint with revert value
        const response = await axios.post(`policies/${policy.policies_id}/apply`, {
          computerName: 'DESKTOP-ABC123',
          revert: true 
        }, {
          headers: this.headers,
        });
        const result = response.data;
        
        this.$q.notify({
          color: "positive",
          position: "top",
          message: result.message || `Policy "${policy.policies_name}" reverted successfully`,
          icon: "check",
        });
      } catch (error) {
        console.error('Error reverting policy:', error);
        this.$q.notify({
          color: "negative",
          position: "top",
          message: "Greška pri vraćanju politike",
          icon: "report_problem",
        });
      } finally {
        policy.reverting = false;
      }
    },

    editPolicy(policy) {
      this.editingPolicy = policy;
      this.policyForm = { ...policy };
      this.showAddDialog = true;
    },

    showPolicyDetails(policy) {
      this.selectedPolicy = policy;
      this.showDetailsDialog = true;
    },

    deletePolicy(policy) {
      this.policyToDelete = policy;
      this.showDeleteDialog = true;
    },

    async confirmDelete() {
      try {
        await axios.delete(`policies/${this.policyToDelete.policies_id}`, {
          headers: this.headers,
        });
        
        this.policies = this.policies.filter(p => p.policies_id !== this.policyToDelete.policies_id);
        
        this.$q.notify({
          color: "positive",
          position: "top",
          message: "Politika uspješno obrisana",
          icon: "check",
        });
      } catch (error) {
        console.error('Error deleting policy:', error);
        this.$q.notify({
          color: "negative",
          position: "top",
          message: "Greška pri brisanju politike",
          icon: "report_problem",
        });
      } finally {
        this.showDeleteDialog = false;
        this.policyToDelete = null;
      }
    },

    async savePolicy() {
      try {
        if (this.editingPolicy) {
          // Update existing policy
          const response = await axios.put(`policies/${this.editingPolicy.policies_id}`, this.policyForm, {
            headers: this.headers,
          });
          const updatedPolicy = response.data;
          
          const index = this.policies.findIndex(p => p.policies_id === this.editingPolicy.policies_id);
          this.policies[index] = updatedPolicy;
        } else {
          // Create new policy
          const response = await axios.post(`policies`, this.policyForm, {
            headers: this.headers,
          });
          const newPolicy = response.data;
          this.policies.push(newPolicy);
        }
        
        this.$q.notify({
          color: "positive",
          position: "top",
          message: `Politika uspješno ${this.editingPolicy ? 'ažurirana' : 'kreirana'}`,
          icon: "check",
        });
        
        this.closeDialog();
      } catch (error) {
        console.error('Error saving policy:', error);
        this.$q.notify({
          color: "negative",
          position: "top",
          message: "Greška pri spremanju politike",
          icon: "report_problem",
        });
      }
    },

    async togglePolicy(policy) {
      try {
        await axios.put(`policies/${policy.policies_id}`, { 
          policies_enable: policy.policies_enable 
        }, {
          headers: this.headers,
        });
        
        this.$q.notify({
          color: "positive",
          position: "top",
          message: `Politika ${policy.policies_enable ? 'omogućena' : 'onemogućena'}`,
          icon: "check",
        });
      } catch (error) {
        console.error('Error toggling policy:', error);
        policy.policies_enable = !policy.policies_enable; // Revert on error
        this.$q.notify({
          color: "negative",
          position: "top",
          message: "Greška pri ažuriranju politike",
          icon: "report_problem",
        });
      }
    },

    closeDialog() {
      this.showAddDialog = false;
      this.editingPolicy = null;
      this.policyForm = {
        policies_name: '',
        policies_regName: '',
        policies_regPath: '',
        policies_regVaule: '',
        policies_regVauleRevert: '',
        policies_type: '',
        policies_enable: true
      };
    }
  }
};
</script> 
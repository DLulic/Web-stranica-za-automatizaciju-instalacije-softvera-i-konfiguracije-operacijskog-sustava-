<template>
  <q-page class="q-pa-md">
    <!-- Page Header -->
    <div class="row q-mb-lg">
      <div class="col-12">
        <div class="row items-center justify-between">
          <div>
            <h4 class="text-h4 q-mb-sm">User Management</h4>
            <p class="text-subtitle1 text-grey-6">Manage system users and permissions</p>
          </div>
          <div class="row q-gutter-sm">
            <q-btn
              color="primary"
              icon="add"
              label="Add New User"
              @click="showAddUserDialog = true"
            />
            <q-btn
              color="info"
              icon="refresh"
              label="Refresh"
              @click="loadUsers"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Statistics Cards -->
    <div class="row q-col-gutter-md q-mb-lg">
      <div class="col-12 col-sm-6 col-md-6">
        <q-card class="stat-card">
          <q-card-section class="text-center">
            <q-icon name="people" size="2rem" color="primary" />
            <div class="text-h6 q-mt-sm">{{ stats.totalUsers }}</div>
            <div class="text-caption text-grey-6">Total Users</div>
          </q-card-section>
        </q-card>
      </div>
      
      <div class="col-12 col-sm-6 col-md-6">
        <q-card class="stat-card">
          <q-card-section class="text-center">
            <q-icon name="admin_panel_settings" size="2rem" color="secondary" />
            <div class="text-h6 q-mt-sm">{{ stats.adminUsers }}</div>
            <div class="text-caption text-grey-6">Admin Users</div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- Search and Filters -->
    <div class="row q-col-gutter-md q-mb-md">
      <div class="col-12 col-md-5">
        <q-input
          v-model="searchTerm"
          placeholder="Search users..."
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
          v-model="roleFilter"
          :options="roleOptions"
          label="Filter by Role"
          outlined
          dense
          clearable
        />
      </div>
    </div>

    <!-- Users Table -->
    <q-card>
      <q-card-section>
        <q-table
          :rows="filteredUsers"
          :columns="columns"
          row-key="user_id"
          :loading="loading"
          v-model:pagination="pagination"
          :rows-per-page-options="[5, 10, 20, 25, 50]" 
          @request="onRequest"
          flat
        >
          <template v-slot:body-cell="props">
            <q-td :props="props">
              <!-- Role column -->
              <q-chip
                v-if="props.col.name === 'role'"
                :color="getRoleColor(props.value)"
                text-color="white"
                size="mh"
              >
                {{ props.value }}
              </q-chip>

              <!-- Actions column -->
              <q-btn-group v-else-if="props.col.name === 'actions'" flat>
                <q-btn
                  flat
                  round
                  color="info"
                  icon="info"
                  @click="showUserDetails(props.row)"
                >
                  <q-tooltip>Details</q-tooltip>
                </q-btn>
                <q-btn
                  flat
                  round
                  color="warning"
                  icon="edit"
                  @click="editUser(props.row)"
                >
                  <q-tooltip>Edit</q-tooltip>
                </q-btn>
                <q-btn
                  flat
                  round
                  color="negative"
                  icon="delete"
                  @click="deleteUser(props.row)"
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

    <!-- Add User Dialog -->
    <q-dialog v-model="showAddUserDialog" @keyup.esc="showAddUserDialog = false">
      <q-card style="min-width: 400px">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6">Add New User</div>
          <q-space />
          <q-btn icon="close" flat round dense @click="showAddUserDialog = false" />
        </q-card-section>

        <q-card-section>
          <q-form @submit="createUser" class="q-gutter-md">
            <q-input
              v-model="newUser.email"
              label="Email"
              type="email"
              outlined
              dense
              :rules="[val => !!val || 'Email is required', val => validateEmail(val) || 'Invalid email format']"
            />
            
            <q-input
              v-model="newUser.password"
              label="Password"
              type="password"
              outlined
              dense
              :rules="[val => !!val || 'Password is required', val => val.length >= 1 || 'Password must be at least 6 characters']"
            />
            
            <q-input
              v-model="newUser.confirmPassword"
              label="Confirm Password"
              type="password"
              outlined
              dense
              :rules="[
                val => !!val || 'Please confirm password',
                val => val === newUser.password || 'Passwords do not match'
              ]"
            />
            
            <q-select
              v-model="newUser.role"
              :options="roleOptions"
              label="Role"
              outlined
              dense
              :rules="[val => !!val || 'Role is required']"
            />
            
            <div class="row q-gutter-sm">
              <q-btn
                label="Cancel"
                color="grey"
                @click="showAddUserDialog = false"
                class="col"
              />
              <q-btn
                label="Create User"
                type="submit"
                color="primary"
                :loading="creatingUser"
                class="col"
              />
            </div>
          </q-form>
        </q-card-section>
      </q-card>
    </q-dialog>

    <!-- Edit User Dialog -->
    <q-dialog v-model="showEditUserDialog" @keyup.esc="showEditUserDialog = false">
      <q-card style="min-width: 400px">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6">Edit User</div>
          <q-space />
          <q-btn icon="close" flat round dense @click="showEditUserDialog = false" />
        </q-card-section>

        <q-card-section>
          <q-form @submit="updateUser" class="q-gutter-md">
            <q-input
              v-model="editingUser.email"
              label="Email"
              type="email"
              outlined
              dense
              :rules="[val => !!val || 'Email is required', val => validateEmail(val) || 'Invalid email format']"
            />
            
            <q-input
              v-model="editingUser.newPassword"
              label="New Password (leave blank to keep current)"
              type="password"
              outlined
              dense
              :rules="[val => !val || val.length >= 6 || 'Password must be at least 6 characters']"
            />
            
            <q-select
              v-model="editingUser.role"
              :options="roleOptions"
              label="Role"
              outlined
              dense
              :rules="[val => !!val || 'Role is required']"
            />
            
            <div class="row q-gutter-sm">
              <q-btn
                label="Cancel"
                color="grey"
                @click="showEditUserDialog = false"
                class="col"
              />
              <q-btn
                label="Update User"
                type="submit"
                color="primary"
                :loading="updatingUser"
                class="col"
              />
            </div>
          </q-form>
        </q-card-section>
      </q-card>
    </q-dialog>

    <!-- User Details Dialog -->
    <q-dialog v-model="showDetailsDialog" @keyup.esc="showDetailsDialog = false">
      <q-card style="min-width: 500px">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6">User Details</div>
          <q-space />
          <q-btn icon="close" flat round dense @click="showDetailsDialog = false" />
        </q-card-section>

        <q-card-section v-if="selectedUser">
          <div class="row q-col-gutter-md">
            <div class="col-12">
              <q-card flat>
                <q-card-section>
                  <div class="q-gutter-y-md">
                    <div>
                      <strong>Email:</strong>
                      <q-input
                        class="q-mt-sm"
                        outlined
                        readonly
                        dense
                        :model-value="selectedUser.email"
                      />
                    </div>
                    <div>
                      <strong>Role:</strong>
                      <q-chip
                        :color="getRoleColor(selectedUser.role)"
                        text-color="white"
                        size="mh"
                        class="q-ml-sm"
                      >
                        {{ selectedUser.role }}
                      </q-chip>
                    </div>
                  </div>
                </q-card-section>
              </q-card>
            </div>
          </div>
        </q-card-section>
      </q-card>
    </q-dialog>

    <!-- Delete User Dialog -->
    <q-dialog v-model="showDeleteDialog" @keyup.esc="showDeleteDialog = false">
      <q-card>
        <q-card-section>
          <div class="text-h6">Confirm Delete</div>
        </q-card-section>
        <q-card-section>
          Are you sure you want to delete "{{ userToDelete?.email }}"?
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
  name: 'UserManagement',
  
  data() {
    return {
      headers: null,
      loading: false,
      creatingUser: false,
      updatingUser: false,
      searchTerm: '',
      roleFilter: null,
      showAddUserDialog: false,
      showEditUserDialog: false,
      showDetailsDialog: false,
      showDeleteDialog: false,
      selectedUser: null,
      userToDelete: null,
      users: [],
      stats: {
        totalUsers: 0,
        adminUsers: 0
      },
      pagination: {
        rowsPerPage: 15,
        sortBy: "user_id",
        descending: true,
        rowsNumber: 0,
        page: 1,
        rows: 0,
      },
      newUser: {
        email: '',
        password: '',
        confirmPassword: '',
        role: null
      },
      editingUser: {
        user_id: null,
        email: '',
        newPassword: '',
        role: null
      },
      roleOptions: [
        { label: 'Admin', value: 'Admin' }
      ],
      columns: [
        {
          name: 'user_id',
          label: 'ID',
          field: 'user_id',
          align: 'left',
          sortable: true
        },
        {
          name: 'email',
          label: 'Email',
          field: 'email',
          align: 'left',
          sortable: true
        },
        {
          name: 'role',
          label: 'Role',
          field: 'role',
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
      if (newVal === 0) {
        this.pagination.rowsPerPage = this.pagination.rowsNumber;
      }
      this.pagination.page = 1;
      this.loadUsers();
    }
  },

  computed: {
    filteredUsers() {
      let filtered = this.users;

      // Filter by search term
      if (this.searchTerm) {
        filtered = filtered.filter(user =>
          user.email.toLowerCase().includes(this.searchTerm.toLowerCase())
        );
      }

      // Filter by role
      if (this.roleFilter) {
        filtered = filtered.filter(user => user.role === this.roleFilter);
      }

      return filtered;
    }
  },

  async mounted() {
    const token = localStorage.getItem("token");

    if (token) {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expirationTime = payload.exp * 1000;

      if (Date.now() >= expirationTime) {
        this.$router.push('/prijava');
      } else {
        this.headers = { Authorization: `Bearer ${token}` };
        this.loadUsers();
        this.loadUserStats();
      }
    } else {
      this.$router.push('/prijava');
    }
  },

  methods: {
    onRequest(props) {
      this.pagination = props.pagination;
      this.loadUsers();
    },

    getRoleColor(role) {
      switch (role) {
        case 'Admin': return 'secondary'
        default: return 'grey'
      }
    },

    formatDate(date) {
      return new Date(date).toLocaleString();
    },

    validateEmail(email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(email);
    },

    async loadUsers() {
      const limit = this.pagination.rowsPerPage === 0 ? this.pagination.rowsNumber : this.pagination.rowsPerPage;

      this.loading = true;
      try {
        const response = await axios.get(`users`, {
          headers: this.headers,
          params: {
            page: this.pagination.page,
            limit: limit,
            search: this.searchTerm,
            sortBy: this.pagination.sortBy || 'user_id',
            descending: this.pagination.descending,
          },
        });
        
        this.users = response.data.users;
        this.pagination.rowsNumber = response.data.total;
      } catch (error) {
        console.error('Error loading users:', error);
        this.$q.notify({
          color: "negative",
          position: "top",
          message: "Greška pri dohvatu korisnika",
          icon: "report_problem",
        });
        
        // Fallback to empty array if API fails
        this.users = [];
        this.pagination.rowsNumber = 0;
      } finally {
        this.loading = false;
      }
    },

    async loadUserStats() {
      try {
        const response = await axios.get(`users/statistics`, {
          headers: this.headers,
        });
        
        this.stats = {
          totalUsers: response.data.totalUsers,
          adminUsers: response.data.adminUsers,
        };
      } catch (error) {
        console.error('Error loading user statistics:', error);
        // Fallback to calculated stats
        this.stats = {
          totalUsers: this.users.length,
          adminUsers: this.users.filter(u => u.role === 'Admin').length,
        };
      }
    },

    async createUser() {
      this.creatingUser = true;
      try {
        const response = await axios.post('new-user', {
          email: this.newUser.email,
          password: this.newUser.password,
          role: this.newUser.role.value
        }, { headers: this.headers });
        
        this.$q.notify({
          color: "positive",
          position: "top",
          message: "Korisnik uspješno kreiran",
          icon: "check_circle",
        });

        this.showAddUserDialog = false;
        this.resetNewUserForm();
        this.loadUsers();
        this.loadUserStats();
      } catch (error) {
        console.error('Error creating user:', error);
        this.$q.notify({
          color: "negative",
          position: "top",
          message: error.response?.data?.message || "Greška pri kreiranju korisnika",
          icon: "report_problem",
        });
      } finally {
        this.creatingUser = false;
      }
    },

    async updateUser() {
      this.updatingUser = true;
      try {
        const updateData = {
          email: this.editingUser.email,
          role: this.editingUser.role.value
        };

        if (this.editingUser.newPassword) {
          updateData.password = this.editingUser.newPassword;
        }

        const response = await axios.put(`users/${this.editingUser.user_id}`, updateData, { 
          headers: this.headers 
        });
        
        this.$q.notify({
          color: "positive",
          position: "top",
          message: "Korisnik uspješno ažuriran",
          icon: "check_circle",
        });

        this.showEditUserDialog = false;
        this.resetEditingUserForm();
        this.loadUsers();
      } catch (error) {
        console.error('Error updating user:', error);
        this.$q.notify({
          color: "negative",
          position: "top",
          message: error.response?.data?.message || "Greška pri ažuriranju korisnika",
          icon: "report_problem",
        });
      } finally {
        this.updatingUser = false;
      }
    },

    deleteUser(user) {
      this.userToDelete = user;
      this.showDeleteDialog = true;
    },

    async confirmDelete() {
      try {
        await axios.delete(`users/${this.userToDelete.user_id}`, {
          headers: this.headers,
        });
        this.users = this.users.filter(u => u.user_id !== this.userToDelete.user_id);
        this.$q.notify({
          color: "positive",
          position: "top",
          message: "Korisnik uspješno obrisan",
          icon: "check_circle",
        });
      } catch (error) {
        console.error('Error deleting user:', error);
        this.$q.notify({
          color: "negative",
          position: "top",
          message: error.response?.data?.message || "Greška pri brisanju korisnika",
          icon: "report_problem",
        });
      } finally {
        this.showDeleteDialog = false;
        this.userToDelete = null;
        this.loadUserStats();
      }
    },

    showUserDetails(user) {
      this.selectedUser = user;
      this.showDetailsDialog = true;
    },

    editUser(user) {
      this.editingUser = {
        user_id: user.user_id,
        email: user.email,
        newPassword: '',
        role: this.roleOptions.find(opt => opt.value === user.role)
      };
      this.showEditUserDialog = true;
    },

    resetNewUserForm() {
      this.newUser = {
        email: '',
        password: '',
        confirmPassword: '',
        role: null
      };
    },

    resetEditingUserForm() {
      this.editingUser = {
        user_id: null,
        email: '',
        newPassword: '',
        role: null
      };
    },
  }
};
</script> 
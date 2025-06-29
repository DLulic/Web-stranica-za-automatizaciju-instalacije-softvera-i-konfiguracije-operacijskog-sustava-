<template>
  <q-layout view="lHh Lpr fff">
    <q-page
      class="window-height window-width row justify-center items-center"
      style="background: linear-gradient(to bottom, #ffffff, #DBECF4); overflow: hidden"
    >
      <div
        class="column q-pa-lg"
        style="max-width: 500px; width: 100%; display: flex; justify-content: center; align-items: center; transform: translateY(-5vh)"
      >
        <div class="row">
          <q-card square class="shadow-24" style="width: 500px; height: auto;">
            <q-card-section class="color-login">
              <h4 class="text-h5 text-white q-my-md text-center">Prijava</h4>
            </q-card-section>
            <q-card-section>
              <q-form class="q-px-sm q-pt-xl" @submit.prevent="login" @keyup.enter="login">
                <q-input
                  ref="email"
                  square
                  clearable
                  v-model="email_korisnika"
                  type="email"
                  lazy-rules
                  :rules="[required, isEmail]"
                  label="Vaš email"
                >
                  <template v-slot:prepend>
                    <q-icon name="email" />
                  </template>
                </q-input>
                <q-input
                  ref="password"
                  square
                  clearable
                  v-model="lozinka_korisnika"
                  :type="passwordFieldType"
                  lazy-rules
                  :rules="[required]"
                  label="Lozinka"
                >
                  <template v-slot:prepend>
                    <q-icon name="lock" />
                  </template>
                  <template v-slot:append>
                    <q-icon
                      :name="visibilityIcon"
                      @click="switchVisibility"
                      class="cursor-pointer"
                    />
                  </template>
                </q-input>
              </q-form>
            </q-card-section>

            <q-card-actions class="q-px-lg">
              <!-- Gumb prijave s novim stilovima -->
              <q-btn
                unelevated
                size="lg"
                @click="login"
                @keyup.space="login"
                class="prijava-gumb full-width text-white"
                label="Prijava"
              />
            </q-card-actions>

            <q-card-section class="text-center q-pa-sm">
              <div>
                <span class="text-body2" style="color: #194569;">Zaboravljena lozinka? </span>
                <a 
                  href="mailto:helpdesk@veleri.hr"
                  style="color: #0d47a1; font-weight: bold; text-decoration: none;"
                >
                  Kontaktiraj nas
                </a>
              </div>
            </q-card-section>
          </q-card>
        </div>
      </div>
    </q-page>
  </q-layout>
</template>

<script>
import axios from "../router/axios";

export default {
  data() {
    return {
      email_korisnika: "",
      lozinka_korisnika: "",
      passwordFieldType: "password",
    };
  },
  computed: {
    visibilityIcon() {
      return this.passwordFieldType === "password"
        ? "visibility_off"
        : "visibility";
    },
  },
  methods: {
    required(value) {
      return !!value || "Ovo polje je obavezno";
    },
    isEmail(value) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(value) || "Unesite validan email";
    },
    switchVisibility() {
      this.passwordFieldType =
        this.passwordFieldType === "password" ? "text" : "password";
    },
    async login() {
      try {
        const response = await axios.post("/login", {
          email: this.email_korisnika,
          password: this.lozinka_korisnika,
        });

        if (response.data.success) {
          localStorage.setItem("token", response.data.token);
          localStorage.setItem("refreshToken", response.data.refreshToken); // Store refresh token

          this.$router.push("/").then(() => {
            window.location.reload();
          });
        } else {
          // Store error message in local storage
          localStorage.setItem("loginError", response.data.message);
          this.$q.notify({
            color: "negative",
            position: "top",
            message: response.data.message,
            icon: "warning",
          });
        }
      } catch (error) {
        //console.error("Login failed:", error);
        localStorage.setItem("loginError", "Prijava nije uspjela. Provjerite podatke i pokušajte ponovno.");
        this.$q.notify({
          color: "negative",
          position: "top",
          message:
            "Prijava nije uspjela. Provjerite podatke i pokušajte ponovno.",
          icon: "warning",
        });
      }
    },
  },
  mounted() {
    // Check for error message in local storage
    const errorMessage = localStorage.getItem("loginError");
    if (errorMessage) {
      this.$q.notify({
        color: "negative",
        position: "top",
        message: errorMessage,
        icon: "warning",
      });
      // Clear the error message from local storage
      localStorage.removeItem("loginError");
    }
  },
};
</script>


const routes = [
  {
    path: '/',
    component: () => import('layouts/AutomationLayout.vue'),
    children: [
      //{ path: '', component: () => import('src/pages/Home.vue'), meta: { requiresLogIn: true } },
      
      { path: 'prijava', component: () => import('src/pages/Login.vue') },
      { path: 'forbidden', component: () => import('src/pages/forbidden.vue') },

      { path: '', component: () => import('src/pages/Dashboard.vue'), meta: { requiresLogIn: true } },
      { path: 'windows-settings', component: () => import('src/pages/WindowsSettings.vue'), meta: { requiresLogIn: true } },
      { path: 'programs', component: () => import('src/pages/Programs.vue'), meta: { requiresLogIn: true } },
      { path: 'reports', component: () => import('src/pages/Reports.vue'), meta: { requiresLogIn: true } },
      { path: 'group-policy', component: () => import('src/pages/Policies.vue'), meta: { requiresLogIn: true } },
      { path: 'python-dependencies', component: () => import('src/pages/PythonPackages.vue'), meta: { requiresLogIn: true } },
      { path: 'users', component: () => import('src/pages/User.vue'), meta: { requiresLogIn: true } },

    ]
  },

  // Always leave this as last one,
  // but you can also remove it
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue')
  }
]

export default routes

// apiUrl must point to the deployed Cloud Run API (client & API are on separate origins).
// Replace with your Cloud Run service URL before the first client deploy, e.g.
//   https://fifa-draft-api-xxxxxxxx-uc.a.run.app
export const environment = {
  production: true,
  apiUrl: 'https://REPLACE_WITH_CLOUD_RUN_URL',
};

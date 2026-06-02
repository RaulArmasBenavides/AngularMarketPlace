// Cypress E2E support file
// https://docs.cypress.io/guides/tooling/plugins-guide

// Disable uncaught exception handling in tests
Cypress.on('uncaught:exception', (err, runnable) => {
  // returning false here prevents Cypress from
  // failing the test
  return false;
});

describe('Angular MarketPlace - Home Page', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('should display the header', () => {
    cy.get('app-header').should('be.visible');
  });

  it('should display the footer', () => {
    cy.get('app-footer').should('be.visible');
  });

  it('should display mobile header on small screens', () => {
    cy.viewport('iphone-x');
    cy.get('app-header-mobile').should('be.visible');
  });

  it('should load the app component', () => {
    cy.get('app-root').should('be.visible');
  });

  it('should display promotion header', () => {
    cy.get('app-header-promotion').should('be.visible');
  });
});

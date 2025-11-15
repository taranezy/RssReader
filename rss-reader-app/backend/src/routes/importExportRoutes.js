/**
 * Import/Export Routes - Single Responsibility: Route all import/export endpoints
 * Depends on ImportExportController and Middleware (Dependency Injection)
 */
module.exports = function createImportExportRoutes(app, importExportController, isAuthenticated) {
  
  /**
   * POST /api/import - Import user data from XML/OPML
   */
  app.post('/api/import', isAuthenticated, (req, res) => {
    console.log('[Routes] POST /api/import - importing OPML/XML data');
    importExportController.importData(req, res);
  });

  /**
   * GET /api/export - Export all user data as XML
   */
  app.get('/api/export', isAuthenticated, (req, res) => {
    console.log('[Routes] GET /api/export - exporting data as XML');
    importExportController.exportData(req, res);
  });
};

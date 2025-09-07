# depot_backend
making the depot backend for sih project'2025


Here is a comprehensive list of all the API endpoints in bus management system, categorized by function.


Depot Management (Authentication)

POST /api/depot/register
Description: Creates a new depot account.
Requires: JSON body with name, location, password, phoneNumber, and email.
Returns: A success message and a JWT token for the new depot.

POST /api/depot/login
Description: Authenticates a depot.
Requires: JSON body with name, location, and password.
Returns: A success message and a JWT token.

GET /api/depot/profile
Description: Fetches the profile of the authenticated depot.
Requires: A valid JWT in the Authorization header.
Returns: The depot's profile information.

PUT /api/depot/profile
Description: Updates the authenticated depot's profile information.
Requires: A valid JWT in the Authorization header and a JSON body with the fields to update (phoneNumber, email).
Returns: The updated depot profile.


Bus Management (CRUD Operations)

POST /api/bus/add
Description: Adds a new bus to the authenticated depot.
Requires: A valid JWT in the Authorization header and a JSON body with busNumber, route, stoppages, and driver details.
Returns: The newly created bus object.

GET /api/bus/all
Description: Retrieves a paginated and searchable list of all buses for the authenticated depot.
Requires: A valid JWT in the Authorization header.
Returns: An array of bus objects and pagination data.

GET /api/bus/:id
Description: Fetches details for a single bus by its ID.
Requires: A valid JWT in the Authorization header and the bus ID in the URL.
Returns: A single bus object.

PUT /api/bus/:id
Description: Updates a bus's information.
Requires: A valid JWT in the Authorization header, the bus ID in the URL, and a JSON body with the fields to update.
Returns: The updated bus object.

DELETE /api/bus/:id
Description: Deletes a bus from the depot.
Requires: A valid JWT in the Authorization header and the bus ID in the URL.
Returns: A success message.

PATCH /api/bus/:id/toggle-status
Description: Toggles a bus's isActive status (e.g., to activate or deactivate it).
Requires: A valid JWT in the Authorization header and the bus ID in the URL.
Returns: The updated bus object.

Statistics
GET /api/bus/stats/overview
Description: Provides an overview of bus statistics for the authenticated depot.
Requires: A valid JWT in the Authorization header.
Returns: Counts for total, active, and inactive buses, as well as the total number of unique routes.


Returns: Counts for total, active, and inactive buses, as well as the total number of unique routes.

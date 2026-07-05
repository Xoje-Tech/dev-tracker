# Delta for Projects

## ADDED Requirements

### Requirement: Repository URL Assignment

The system MAY accept an optional `repoUrl` during project creation and updates.

#### Scenario: Valid URL on creation
- GIVEN the user provides a valid HTTP/HTTPS URL for `repoUrl`
- WHEN the user submits the new project form
- THEN the system MUST save the project with the `repoUrl`

#### Scenario: Invalid URL on creation or update
- GIVEN the user provides an invalid URL string for `repoUrl`
- WHEN the user submits the project form
- THEN the system MUST reject the request with a validation error

#### Scenario: Valid URL on update
- GIVEN an existing project
- WHEN the user updates the project with a new valid `repoUrl`
- THEN the system MUST update and persist the project's repository URL

### Requirement: Repository URL Display

The system MUST display a clickable repository link on the project card if `repoUrl` is present.

#### Scenario: Project has configured repoUrl
- GIVEN a project has a configured `repoUrl`
- WHEN the user views the project on the projects grid
- THEN a clickable repository link MUST be displayed on the project card

#### Scenario: Project lacks configured repoUrl
- GIVEN a project does not have a configured `repoUrl`
- WHEN the user views the project on the projects grid
- THEN no repository link is displayed on the project card
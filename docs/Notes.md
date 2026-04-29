# Notes

## AI Stuff
- [ ] UI Design Skill?
- [ ] TDD Skill for Implementation -> Combination with Angular Testing Library
- [ ] How to continuously update AGENTS.md Files? In Dev Cycle Loop?

## Next Tasks
- [ ] Preview Cognito should have one app client for local development for AI to verify e2e tests
  - [ ] Fix local E2E-Tests so that they are concise


## To Verify
- [~] Destroy and Re-Deploy complete Environment (f.e `dev` or `prod`)
  - [ ] Verify Teardown works properly now

- [~] Domain Integration
  - [ ] Verify Prod Domain

- [~] Teardown Temporary Preview Branch right after Playwright Tests are done (simultaneous with Release Backend and CI Frontend) on Main Branch

- [x] Deploy Temporary Preview / Deploy summary <- remove e2e deployment info if it is run on `main` as it only lives a very short time frame

- [~] Reloading Pages that require a specific role (such as `Systemübersicht`) the user is redirected to the main page instead of the one he is authorized to

- [~] How to make sure E-Mail will not be in Spam-Folder (Template Adjustments?)

### Next
- [ ] Dynamo Setup
  - [ ] DynamoDB Table Design for User
  - [ ] Terraform Setup 
  - [ ] Implement DB Connection in Backend
  - [ ] Add it to /health Endpoint
  - [ ] Create Dummy Data for preview branches


- [ ] Remove MongoDB Connection -> Use AWS DocumentDB if really needed 
    - [ ] Also remove ApplicationDatabase

## UI

## Bugs
- [ ] Add DLQ for AWS EventBridge Notifications that caused an error! -> Trigger Admin f.e

- [ ] Remove the now unnecessary path `/preview` part of any preview path as it is already within the subpath of the URL
- [ ] E2E Tests not yet full user journeys, adapt existing tests, write findings in AGENTS.md
- [ ] Environment Tag should be below navigation bar and centered (completely removed in prod) to not squeeze the ui
- [ ] Map Custom Error Codes to HTTP Status Codes in API GW (Currently all errors are 500)
    - [ ] if necessary -> implement custom error code in valid range


## Ideas
- [ ] Can Template be registered in AWS and being referenced? Challenge current approach
  - [ ] if not possible -> Template Visible in Local Dev Mode?
- [ ] Create Architecture Document with Mermaid Diagrams and update it after every feature change
  - [ ] Infrastructure
  - [ ] Software Architecture
- [ ] Implement a custom ui for login / registration
- [ ] Decide on UI Library / Elements
- [ ] Think about how to split different applications (or later potentially even domains) into different Lambda's
  - [ ] Impact on Terraform probably quite large, gain?

## Backlog
- [ ] Store Auth Token as HttpOnly Cookie to prevent XSS Attacks
    - Not easily possible, requires loop through BFF
    - Probably not relevant for now

## Questions
Deploy setup:
1. Where to Store if Boostrap is done or not (Chicken and Egg problem)

Answer: Don't store it -> leave the bucket there forever ;-)

2. Is it safe to expose the following variables to $GITHUB_ENV in [action.yml](../.github/actions/terraform-action/action.yml)
    1. Is this the preferred way of injecting env vars for terraform from github actions?
> echo "TF_ACTION_ROLE_ARN=${{ inputs.aws_oidc_role_arn }}"  >> "$GITHUB_ENV"
> echo "TF_ACTION_AWS_REGION=${{ inputs.aws_region }}"       >> "$GITHUB_ENV"
> echo "TF_ACTION_SESSION_NAME=${{ inputs.session_name }}"   >> "$GITHUB_ENV"
> echo "TF_VAR_environment=${{ inputs.environment }}"        >> "$GITHUB_ENV"
> echo "TF_VAR_aws_account_id=${{ inputs.aws_account_id }}"  >> "$GITHUB_ENV"

Answer: Use a Setup-Script that needs to be run manually from local machine using AWS CLI
1. Also provision Cognito Users this way?


### Done
- [x] Integrate Email Sending Capability for Application (AWS SES)
- [x] Integrate Scheduling Capability for Application (AWS EventBridge)
- [x] Domain Integration for all Environments including IDP (AWS Cognito)
- [x] Switch Testing in Frontend to use TestingLibrary
- [x] E2E Testing Setup
- [x] Build Open API Spec for FE and BE differently
- [x] Cleanup `breadly-api/` -> frontend / backend link the file anyway and create the dto's
- [x] Move Variables / Secrets that are not env specific to repo level on Github
- [x] Add a version in the backend and display it in the frontend (health status page)
- [x] Deploy Application from Feature Branch
- [x] Create Skills / Agents for Coding itself

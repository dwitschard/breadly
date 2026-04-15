# Notes

## Next Tasks
- [x] E2E Testing Setup
    - [x] Run E2E-Tests on Preview Branch
    - [x] Create Video to verify it
    - [x] Add Summary of Tests to Step Summary of Build Step in Github Actions
    - [x] Add Summary of Tests to PRs
    - [x] Fix usage of Node 20 in Github Action
    - [x] Check if a github compound action might be useful to print out playwright results to GH-Variables for Summary / PR
    - [x] Check if E2E Tests are part of the dev cycle - each new feature should be covered in an E2E Test
    - [x] Display Environment (`dev`, `preview-xyz` ) in navbar somewhere to verify easily in the e2e test
    - [ ] Cleanup Teardown Actions in Github -> `teardown_env` vs. `preview-cleanup` vs. `_teardown-preview` -> merge?
      - [ ] it should still be possible to manually teardown an entire stack -> if preview env could be passed even better
    - [ ] Validate if true: `dev`-Stage / `main`-Branch: Deploy preview branch during action to `preview/ci-dev`, if successful deploy to `dev`


- [ ] Switch Testing in Frontend to use TestingLibrary
    - [ ] Adjust instructions in AGENTS.md Files for FE-Testing


- [ ] Create a domain agnostic Backend (Lambda) that acts as a scheduler.
  - [ ] It should call API's of the Domain Backend(s) at defined triggers (scheduled)


- [ ] Integrate AWS-SES (Simple-Email-Service) into the Backend to easily produce E-Mails from the Application
  - [ ] Template + Text must be controlled by Codebase


- [ ] Dynamo Setup
  - [ ] DynamoDB Table Design for User
  - [ ] Terraform Setup 
  - [ ] Implement DB Connection in Backend
  - [ ] Add it to /health Endpoint
  - [ ] Create Dummy Data for preview branches

- [ ] Remove MongoDB Connection -> Use AWS DocumentDB if really needed 
    - [ ] Also remove ApplicationDatabase

## UI
- [ ] Add general User-Information into Dropdown Header <- currently empty because of not available name/email
- [x] Switch `Systemstatus` to Menu-Item in the Profile itself, only available for `ADMIN`
- [x] Use Icons for Buttons (Aktualisieren, Löschen, Hinzufügen)

## Bugs
- [ ] In Profile also add email address of user (not only verification status). Include E-Mail in JWT Token
- [ ] Map Custom Error Codes to HTTP Status Codes in API GW (Currently all errors are 500)
    - [ ] if necessary -> implement custom error code in valid range


## Ideas
- [ ] Implement a custom ui for login / registration
- [ ] Git Worktree Setup for multiple Agents to build things on different branches without conflicts
- [ ] decide on ui library / elements
- [ ] Think about how to split different applications (or later potentially even domains) into different Lambda's
  - [ ] Impact on Terraform probably quite large, gain? 
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
- [x] Build Open API Spec for FE and BE differently
- [x] Cleanup `breadly-api/` -> frontend / backend link the file anyway and create the dto's
- [x] Move Variables / Secrets that are not env specific to repo level on Github
- [x] Add a version in the backend and display it in the frontend (health status page)
- [x] Deploy Application from Feature Branch
- [x] Create Skills / Agents for Coding itself

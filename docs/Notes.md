# Notes

## AI Stuff
- [ ] UI Design Skill?
- [ ] TDD Skill for Implementation -> Combination with Angular Testing Library
- [ ] How to continuously update AGENTS.md Files? In Dev Cycle Loop?

## Next Tasks

### Next
- [ ] Domain Integration
  - [~] Switch E-Mail domain from `email.breadly.appdock.ch` to `email.apdock.ch` and share between all apps
  - [~] Only 3 Cognitos should be running -> prod, dev, preview
  - [~] Cognito should run on own domains
  - [ ] Fix Teardown of Environments using Domains
  - [ ] Remove the now unnecessary path `/preview` part of any preview path as it is already within the subpath of the URL
  - [ ] Teardown Temporary Preview Branch right after Playwright Tests are done (simultaneous with Release Backend and CI Frontend) on Main Branch


- [ ] Create a domain agnostic Backend (Lambda) that acts as a scheduler.
  - [ ] It should call API's of the Domain Backend(s) at defined triggers (scheduled)


- [ ] Integrate AWS-SES (Simple-Email-Service) into the Backend to easily produce E-Mails from the Application
  - [ ] Template + Text must be controlled by Codebase
  - [ ] Can Template be registered in AWS and being referenced? Challenge current approach


- [ ] Dynamo Setup
  - [ ] DynamoDB Table Design for User
  - [ ] Terraform Setup 
  - [ ] Implement DB Connection in Backend
  - [ ] Add it to /health Endpoint
  - [ ] Create Dummy Data for preview branches


- [ ] Remove MongoDB Connection -> Use AWS DocumentDB if really needed 
    - [ ] Also remove ApplicationDatabase

## UI
- [~] Add general User-Information into Dropdown Header <- currently empty because of not available name/email
- [x] Switch `Systemstatus` to Menu-Item in the Profile itself, only available for `ADMIN`
- [x] Use Icons for Buttons (Aktualisieren, Löschen, Hinzufügen)

## Bugs
- [~] Time missing when reloading `Systemstatus`

- [~] Deploy Temporary Preview / Deploy summary <- remove e2e deployment info if it is run on `main` as it only lives a very short time frame
- [~] In Profile also add email address of user (not only verification status). Include E-Mail in JWT Token

- [ ] E2E Tests not yet full user journeys, adapt existing tests, write findings in AGENTS.md
- [ ] Environment Tag should be below navigation bar and centered (completely removed in prod) to not squeeze the ui
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
- [x] Switch Testing in Frontend to use TestingLibrary
- [x] E2E Testing Setup
- [x] Build Open API Spec for FE and BE differently
- [x] Cleanup `breadly-api/` -> frontend / backend link the file anyway and create the dto's
- [x] Move Variables / Secrets that are not env specific to repo level on Github
- [x] Add a version in the backend and display it in the frontend (health status page)
- [x] Deploy Application from Feature Branch
- [x] Create Skills / Agents for Coding itself

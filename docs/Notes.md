# Notes

## AI Stuff
- [ ] UI Design Skill?
- [ ] TDD Skill for Implementation -> Combination with Angular Testing Library
- [ ] How to continuously update AGENTS.md Files? In Dev Cycle Loop?

## Next Tasks

## To Verify
- [x] Deploy Temporary Preview / Deploy summary <- remove e2e deployment info if it is run on `main` as it only lives a very short time frame
- [ ] Check new E-Mail Address will not receive emails in SPAM Folder

### Next

- [ ] Dynamo Setup
  - [~] Add E-Mail and Last-Login to User Settings

- [ ] Fix Styling of Authentication
  - [ ] Adjust `settings.json` to match design system
  - [ ] Reuse of Design Tokens `_tokens.scss` (other branch) possible?

- [ ] Create Design System Components
  - [ ] Everything configurable via Config (JSON or similar)
  - [ ] Make sure all variables are exposed and usable for other components too (similar to our Setup)


- [ ] Give AI possibility to run e2e locally
  - [ ] Should be a quality gate before finishing a UI Task


- [ ] Implement Design according to ClaudeDesign using the Design System Components
  - [ ] Create a Favicon and add it to the Application


- [ ] DB Schema for Recipes
  - [x] Think about general structure
    - [ ] Are all SKs and GSIs updated automatically? Any LSIs used that I need to manage?
  - [ ] Create a document describing all UIs / User Journeys needed to allow database interaction with the new schema
    - [ ] Used for Claude Design afterwards
  - [ ] Create Seeding Mechanism and dummy data
  - [ ] Implement it in DynamoDB & update Backend / Frontend accordingly


- [ ] Remove MongoDB Connection -> Use AWS DocumentDB if really needed 
    - [ ] Also remove ApplicationDatabase


- [ ] Importer of Recipes of public webpage
  - [ ] scheduled to get latest updates


## UI

## Bugs
- [ ] When the user does not select the default language or theme on reload it will flicker (ligth/dark mode) and show the default language for a short time (english) before switching to the selected one.
  - [ ] Potential Fix: Store the selected theme and language in local storage and load it on app start before rendering anything
- [ ] Remove the now unnecessary path `/preview` part of any preview path as it is already within the subpath of the URL
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
- [x] Minor Bugs (Reload Issue, Playwright Setup locally, )
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

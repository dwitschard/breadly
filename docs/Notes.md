# Notes

## Next Week
[ ] Git Worktree Setup for multiple Agents to build things on different branches without conflicts

## Week Goals
[x] Create Skills / Agents for Coding itself
    [x] Architecture Description Backend
    [x] Architecture Description Frontend
    [x] Architecture Description API Module
    [x] Coding Agent -> Create API Spec, Implement BE & FE, Write Tests + E2E
[ ] Deploy Application from Feature Branch
    [x] Terraform Setup (GW remains for all features, separate Stack for BE and FE - cognito if easily possible)
    [x] Setup Dummy Data
    [x] Delete Env once Branch is deleted
    [x] Check if Teardown of Preview Env works
    [x] Make deployments / Terraform Setup easier
    [ ] Add a version in the backend and display it in the frontend (health status page)
        [ ] Git Short SHA from CI Pipeline plus prefix (backend-xxxx | frontend-xxxx) as Version
[ ] Move Variables / Secrets that are not env specific to repo level on Github
    [ ] Make sure everything still work the same
[ ] E2E Testing Setup
    [ ] Deployment to a "CI" Environment (preview/ci) -> limit preview branches to 4
    [ ] Add Mock Data to it (Login, Recipe, etc.)
    [ ] Run Playwright Test against it
    [ ] Create Video to verify it
[ ] DynamoDB Table Design for User
[ ] Add DynamoDB Connection 
    [ ] Terraform Setup
    [ ] Implement DB Connection in Backend
    [ ] Add it to /health Endpoint
[ ] Remove MongoDB Connection -> Use AWS DocumentDB if really needed 
    [ ] Also remove ApplicationDatabase

## Bugs
[ ] Check if `package.json` is still necessary in `breadly-api/` -> frontend / backend link the file anyway and create the dto's

[ ] Build Open API Spec for FE and BE differently (if needed)
    [ ] Check Frontend
    [ ] Check Backend

[ ] Map Custom Error Codes to HTTP Status Codes in API GW (Currently all errors are 500)
    [ ] if necessary -> implement custom error code in valid range


## Ideas
[ ] Implement a custom ui for login / registration
[ ] Switch Testing in Frontend to use TestingLibrary
[ ] decide on ui library / elements

### Done
[x] Store Auth Token as HttpOnly Cookie to prevent XSS Attacks 
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

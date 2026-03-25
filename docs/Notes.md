# Notes

## Week Goals
[x] Frontend and Backend are being deployed automatically
[x] Backend serves only Requests via API Gateway
[x] User need to authenticate via Cognito to access API Gateway
[x] Backend is connected to a Database
[x] User has a fluid Login / Logout Experience

- Backend is connected to DynamoDB
- Local Setup is developer friendly
  - supertest import in Test

Optional:
- Custom UI for Login / Registration

## Next Week
- Create Skills / Agents for Coding itself
- Agent should: Create API Spec, implement BE & FE, write tests + E2E
- Think about E2E-Setup -> Spawn a Lambda for Testing

## Next Steps
- DynamoDB Table Design for User
- Add DynamoDB Connection
    - Terraform Setup
    - Implement DB Connection in Backend
    - Add it to /health Endpoint
- Remove MongoDB Connection -> Use AWS DocumentDB if really needed
  - Also remove ApplicationDatabase

- Map Custom Error Codes to HTTP Status Codes in API GW (Currently all errors are 500)
  - if necessary -> implement custom error code in valid range

## Bugs
- Keep URL when automatically reloading/relogin
- Environment Specific Configuration of Cognito (clientId, issuer?)
  - SSM Params should be available via Env-Variable in Backend -> No call to SSM needed in Backend
- Fix Test Errors when importing `supertest`

- Build Open API Spec for FE and BE differently (if needed)
  - Development on BE and FE should be possible at the same time 
  - Check if real interfaces can be generated for FE and BE without types being defined in BE / FE

## Ideas
- Switch Testing in Frontend to use TestingLibrary
- Implement a custom ui for login / registration
- decide on ui library / elements
- Think about a public lambda API that does not require authentication (how to separate on code level?)

- Store Auth Token as HttpOnly Cookie to prevent XSS Attacks
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

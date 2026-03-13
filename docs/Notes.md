# Notes

## Next Steps
- Add CloudFront to get a HTTPS Endpoint for the FE (required by cognito)
- Authenticate Frontend using Cognito User Pool -> make it work  
- Remove /health endpoint from Gateway
- Secure lambda invocation using IAM Role
- Extract Role in Backend and use it for Business Logic
- Check Connectivity to MongoDB Atlas from Lambda
- Check Connectivity to DynamoDB from Lambda
- Think about a public lambda API that does not require authentication (how to separate on code level?)

## Bugs
1. Build Open API Spec for FE and BE differently (if needed)
   2. Development on BE and FE should be possible at the same time
   3. Check if real interfaces can be generated for FE and BE without types being defined in BE / FE

## Ideas
1. Implement a custom ui for login / registration
2. decide on ui library / elements

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
# Notes

Deploy setup:
1. Where to Store if Boostrap is done or not (Chicken and Egg problem)

2. Is it safe to expose the following variables to $GITHUB_ENV in [action.yml](../.github/actions/terraform-action/action.yml)
   1. Is this the preferred way of injecting env vars for terraform from github actions?
> echo "TF_ACTION_ROLE_ARN=${{ inputs.aws_oidc_role_arn }}"  >> "$GITHUB_ENV"
> echo "TF_ACTION_AWS_REGION=${{ inputs.aws_region }}"       >> "$GITHUB_ENV"
> echo "TF_ACTION_SESSION_NAME=${{ inputs.session_name }}"   >> "$GITHUB_ENV"
> echo "TF_VAR_environment=${{ inputs.environment }}"        >> "$GITHUB_ENV"
> echo "TF_VAR_aws_account_id=${{ inputs.aws_account_id }}"  >> "$GITHUB_ENV"

Terraform Cleanup ([plan](docs/plans/terraform-cleanup.md))
1. Fix path for static resources in terraform and github, lot of `../../../` which is not good and error prone.
2. Rename `bootstrap-frontend` and `bootsrap` to setup-frontend-infrastructure or simliar
3. Rename `aws/frontend/infra` to `deploy-frontend` or similar

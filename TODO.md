# Bugs

Deploy setup:
1. `bootstra-frontend` does not work correctly with exit codes. Currently `terraform apply` is applied all the time and therefore fails

Build setup:
3. Use Artifact generated in `build-frontend` in `deploy-frontend` instead of building again. This is also a performance improvement.
4. `bootstrap-frontend` should be run all the time, only if changes to stack are necessary run terraform plan

Terraform Cleanup
4. Fix path for static resources in terraform and github, lot of `../../../` which is not good and error prone.
5. Rename `bootstrap-frontend` and `bootsrap` to setup-frontend-infrastructure or simliar
6. Rename `aws/frontend/infra` to `deploy-frontend` or similar

# Refactor
1. Entire Terraform part
2. Github Actions part
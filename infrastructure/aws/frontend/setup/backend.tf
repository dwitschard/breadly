# setup/backend.tf — local backend (must be local; this root creates the remote state bucket).

terraform {
  backend "local" {}
}

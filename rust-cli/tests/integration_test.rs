use assert_cmd::Command;
use predicates::prelude::*;

#[test]
fn test_hello_default() {
    let mut cmd = Command::cargo_bin("mycli").unwrap();
    cmd.arg("hello")
        .assert()
        .success()
        .stdout(predicate::str::contains("Hello, World!"));
}

#[test]
fn test_hello_with_name() {
    let mut cmd = Command::cargo_bin("mycli").unwrap();
    cmd.args(["hello", "Alice"])
        .assert()
        .success()
        .stdout(predicate::str::contains("Hello, Alice!"));
}

#[test]
fn test_version() {
    let mut cmd = Command::cargo_bin("mycli").unwrap();
    cmd.arg("--version")
        .assert()
        .success()
        .stdout(predicate::str::contains("mycli"));
}

#[test]
fn test_help() {
    let mut cmd = Command::cargo_bin("mycli").unwrap();
    cmd.arg("--help")
        .assert()
        .success()
        .stdout(predicate::str::contains("A simple CLI application"));
}

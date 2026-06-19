use assert_cmd::Command;
use predicates::prelude::*;

#[test]
fn test_hello_default() {
    let mut cmd = Command::cargo_bin("mycli").unwrap();
    cmd.env_remove("APP__GREETING")
        .arg("hello")
        .assert()
        .success()
        .stdout(predicate::str::contains("Hello, World!"));
}

#[test]
fn test_hello_with_name() {
    let mut cmd = Command::cargo_bin("mycli").unwrap();
    cmd.env_remove("APP__GREETING")
        .args(["hello", "Alice"])
        .assert()
        .success()
        .stdout(predicate::str::contains("Hello, Alice!"));
}

#[test]
fn test_hello_with_custom_greeting_via_env() {
    let mut cmd = Command::cargo_bin("mycli").unwrap();
    cmd.env("APP__GREETING", "Bonjour")
        .args(["hello", "Marie"])
        .assert()
        .success()
        .stdout(predicate::str::contains("Bonjour, Marie!"));
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

/// Returns a greeting message for the given name.
pub fn hello(name: &str) -> String {
    format!("Hello, {}!", name)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_hello_world() {
        assert_eq!(hello("World"), "Hello, World!");
    }

    #[test]
    fn test_hello_name() {
        assert_eq!(hello("Alice"), "Hello, Alice!");
    }

    #[test]
    fn test_hello_empty() {
        assert_eq!(hello(""), "Hello, !");
    }
}

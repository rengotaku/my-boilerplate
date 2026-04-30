/// Returns a greeting message for the given name using the configured prefix.
pub fn hello(greeting: &str, name: &str) -> String {
    format!("{}, {}!", greeting, name)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_hello_default() {
        assert_eq!(hello("Hello", "World"), "Hello, World!");
    }

    #[test]
    fn test_hello_named() {
        assert_eq!(hello("Hello", "Alice"), "Hello, Alice!");
    }

    #[test]
    fn test_hello_empty_name() {
        assert_eq!(hello("Hello", ""), "Hello, !");
    }

    #[test]
    fn test_hello_custom_greeting() {
        assert_eq!(hello("Bonjour", "Marie"), "Bonjour, Marie!");
    }
}

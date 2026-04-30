use anyhow::Result;
use tracing_subscriber::{fmt, prelude::*, EnvFilter};

pub fn init(default_level: &str) -> Result<()> {
    let filter = EnvFilter::try_from_default_env()
        .or_else(|_| EnvFilter::try_new(default_level))
        .or_else(|_| EnvFilter::try_new("info"))
        .expect("info is always a valid filter");

    tracing_subscriber::registry()
        .with(filter)
        .with(fmt::layer().with_target(false).with_writer(std::io::stderr))
        .try_init()
        .ok();

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn init_with_valid_level_succeeds() {
        init("info").unwrap();
    }

    #[test]
    fn init_falls_back_when_level_is_invalid() {
        init("not-a-level").unwrap();
    }

    #[test]
    fn init_is_idempotent() {
        init("debug").unwrap();
        init("trace").unwrap();
    }
}

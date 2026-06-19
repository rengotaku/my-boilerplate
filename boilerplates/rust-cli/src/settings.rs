use anyhow::{Context, Result};
use config::{Config, Environment, File, FileFormat};
use serde::Deserialize;

#[derive(Debug, Clone, Deserialize, PartialEq, Eq)]
pub struct Settings {
    pub greeting: String,
    pub log_level: String,
}

impl Default for Settings {
    fn default() -> Self {
        Self {
            greeting: "Hello".to_string(),
            log_level: "info".to_string(),
        }
    }
}

impl Settings {
    pub fn load() -> Result<Self> {
        let _ = dotenvy::dotenv();
        Self::build_from(File::with_name("config/default").required(false))
    }

    fn build_from(default_file: File<config::FileSourceFile, FileFormat>) -> Result<Self> {
        let defaults = Self::default();
        let cfg = Config::builder()
            .set_default("greeting", defaults.greeting)?
            .set_default("log_level", defaults.log_level)?
            .add_source(default_file)
            .add_source(Environment::with_prefix("APP").separator("__"))
            .build()
            .context("failed to build configuration")?;

        cfg.try_deserialize()
            .context("failed to deserialize Settings")
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::sync::Mutex;

    static ENV_LOCK: Mutex<()> = Mutex::new(());

    fn clear_app_env() {
        for (key, _) in std::env::vars() {
            if key.starts_with("APP__") {
                std::env::remove_var(key);
            }
        }
    }

    #[test]
    fn defaults_are_used_when_no_sources() {
        let _guard = ENV_LOCK.lock().unwrap();
        clear_app_env();
        let settings =
            Settings::build_from(File::with_name("config/__missing__").required(false)).unwrap();
        assert_eq!(settings, Settings::default());
    }

    #[test]
    fn env_overrides_defaults() {
        let _guard = ENV_LOCK.lock().unwrap();
        clear_app_env();
        std::env::set_var("APP__GREETING", "Hi");
        std::env::set_var("APP__LOG_LEVEL", "debug");

        let settings =
            Settings::build_from(File::with_name("config/__missing__").required(false)).unwrap();

        assert_eq!(settings.greeting, "Hi");
        assert_eq!(settings.log_level, "debug");

        std::env::remove_var("APP__GREETING");
        std::env::remove_var("APP__LOG_LEVEL");
    }

    #[test]
    fn default_values_are_sensible() {
        let s = Settings::default();
        assert_eq!(s.greeting, "Hello");
        assert_eq!(s.log_level, "info");
    }
}

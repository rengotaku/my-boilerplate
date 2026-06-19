use anyhow::Result;

use rust_cli::{logging, settings::Settings};

mod cli;

fn main() -> Result<()> {
    let settings = Settings::load()?;
    logging::init(&settings.log_level)?;
    cli::run(&settings)
}

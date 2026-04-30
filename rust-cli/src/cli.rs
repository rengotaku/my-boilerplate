use anyhow::Result;
use clap::{Parser, Subcommand};
use tracing::{debug, info};

use rust_cli::{greet, settings::Settings};

#[derive(Parser)]
#[command(name = "mycli")]
#[command(about = "A simple CLI application", long_about = None)]
#[command(version)]
pub struct Cli {
    #[command(subcommand)]
    command: Commands,
}

#[derive(Subcommand)]
enum Commands {
    /// Print a greeting
    Hello {
        /// Name to greet
        #[arg(default_value = "World")]
        name: String,
    },
}

pub fn run(settings: &Settings) -> Result<()> {
    let cli = Cli::parse();
    debug!(?settings.log_level, "settings loaded");

    match cli.command {
        Commands::Hello { name } => {
            info!(target: "cli", %name, "running hello command");
            println!("{}", greet::hello(&settings.greeting, &name));
        }
    }

    Ok(())
}

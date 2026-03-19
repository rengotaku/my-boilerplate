use anyhow::Result;
use clap::{Parser, Subcommand};

use rust_cli::greet;

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

pub fn run() -> Result<()> {
    let cli = Cli::parse();

    match cli.command {
        Commands::Hello { name } => {
            println!("{}", greet::hello(&name));
        }
    }

    Ok(())
}

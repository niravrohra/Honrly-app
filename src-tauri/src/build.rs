fn main() {
    println!("cargo:rerun-if-changed=.env");

    // Read the .env file
    if let Ok(lines) = std::fs::read_to_string(".env") {
        for line in lines.lines() {
            if let Some((key, value)) = line.split_once('=') {
                println!("cargo:rustc-env={}={}", key.trim(), value.trim());
            }
        }
    }
}

import os
import zipfile

def create_zip():
    zip_filename = "ai_agent_isometric_mto.zip"
    exclude_dirs = {
        "node_modules", ".next", "venv", "__pycache__", ".git", "dist", "build",
        ".mypy_cache", ".pytest_cache"
    }
    
    with zipfile.ZipFile(zip_filename, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for root, dirs, files in os.walk("."):
            # Exclude directories in place
            dirs[:] = [d for d in dirs if d not in exclude_dirs]
            
            for file in files:
                if file == zip_filename or file == "package_zip.py" or file == "iso-mto-dashboard.html":
                    continue
                if file.endswith(".zip"):
                    continue
                
                filepath = os.path.join(root, file)
                arcname = os.path.relpath(filepath, start=".")
                zipf.write(filepath, arcname)
                
    print(f"Successfully created {zip_filename}")
    print(f"Size: {os.path.getsize(zip_filename) / (1024*1024):.2f} MB")

if __name__ == "__main__":
    create_zip()

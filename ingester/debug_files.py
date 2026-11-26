import os

VAULT_PATH = r"C:\Users\Margil\OneDrive\Documents\MyNotes\Rag"
print(f"Checking vault path: {VAULT_PATH}")

markdown_files = []
for root, _, files in os.walk(VAULT_PATH):
    for file in files:
        print(f"Found file: {file}")
        if file.endswith(".md"):
            markdown_files.append(os.path.join(root, file))

print(f"Total markdown files: {len(markdown_files)}")

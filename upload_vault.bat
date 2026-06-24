@echo off
rem One‑time Vault upload script
rem Ensure you have installed dependencies first (npm install)

node scripts/bulk-import.mjs ^
    --csv scripts/bulk-upload-vault.csv ^
    --covers scripts/covers ^
    --pdfs scripts/vault-pdfs

rem If you want to validate without uploading, add --dry-run to the command above.

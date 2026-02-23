# Overwrite commit message file with clean message (no co-author)
# Git passes the message file path as first argument
$msgPath = $args[0]
if ($msgPath) { Set-Content -Path $msgPath -Value "Update terbaru" }

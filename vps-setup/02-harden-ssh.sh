#!/usr/bin/env bash
set -euo pipefail

# =============================================================================
# SSH Hardening Script
# Run as clawuser with sudo AFTER verifying SSH key login works
#
# WARNING: This disables root login and password authentication.
#          Make sure you can SSH in as clawuser with your key first!
# =============================================================================

SSHD_CONFIG="/etc/ssh/sshd_config"

echo "=== SSH Hardening ==="

# Safety check: make sure we're not root
if [ "$(id -u)" -eq 0 ] && [ -z "${SUDO_USER:-}" ]; then
    echo "ERROR: Run this as clawuser with sudo, not directly as root."
    echo "Usage: sudo bash 02-harden-ssh.sh"
    exit 1
fi

# Backup current config
cp "$SSHD_CONFIG" "${SSHD_CONFIG}.backup.$(date +%Y%m%d%H%M%S)"
echo "Backed up current sshd_config."

# Apply hardened settings
declare -A SSH_SETTINGS=(
    ["PermitRootLogin"]="no"
    ["PasswordAuthentication"]="no"
    ["PubkeyAuthentication"]="yes"
    ["ChallengeResponseAuthentication"]="no"
    ["UsePAM"]="yes"
)

for key in "${!SSH_SETTINGS[@]}"; do
    value="${SSH_SETTINGS[$key]}"
    if grep -qE "^#?${key}" "$SSHD_CONFIG"; then
        sed -i "s/^#*${key}.*/${key} ${value}/" "$SSHD_CONFIG"
    else
        echo "${key} ${value}" >> "$SSHD_CONFIG"
    fi
    echo "  Set ${key} = ${value}"
done

# Validate config before restarting
echo ""
echo "Validating sshd config..."
if sshd -t; then
    echo "Config is valid. Restarting SSH..."
    systemctl restart ssh
    echo "SSH restarted successfully."
else
    echo "ERROR: Invalid sshd config! Restoring backup..."
    cp "${SSHD_CONFIG}.backup."* "$SSHD_CONFIG"
    echo "Backup restored. SSH was NOT restarted."
    exit 1
fi

echo ""
echo "=== SSH hardening complete ==="
echo ""
echo "Settings applied:"
echo "  - Root login: DISABLED"
echo "  - Password auth: DISABLED"
echo "  - Public key auth: ENABLED"
echo ""
echo "IMPORTANT: Keep your current SSH session open!"
echo "Open a NEW terminal and verify you can still connect:"
echo "  ssh clawuser@<your-vps-ip>"

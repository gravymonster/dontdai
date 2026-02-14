#!/usr/bin/env bash
set -euo pipefail

# =============================================================================
# Hetzner VPS Initial Setup Script
# Run as root on a fresh Hetzner VPS
# =============================================================================

USERNAME="clawuser"

echo "=== Step 1: Update system packages ==="
apt update && apt upgrade -y && apt autoremove -y

echo "=== Step 2: Create non-root user '${USERNAME}' ==="
if id "$USERNAME" &>/dev/null; then
    echo "User '${USERNAME}' already exists, skipping creation."
else
    adduser "$USERNAME"
    usermod -aG sudo "$USERNAME"
    echo "User '${USERNAME}' created and added to sudo group."
fi

echo "=== Step 3: Set up SSH directory for ${USERNAME} ==="
USER_HOME="/home/${USERNAME}"
mkdir -p "${USER_HOME}/.ssh"
chmod 700 "${USER_HOME}/.ssh"

# Copy root's authorized_keys to the new user (so you can SSH in)
if [ -f /root/.ssh/authorized_keys ]; then
    cp /root/.ssh/authorized_keys "${USER_HOME}/.ssh/authorized_keys"
    chmod 600 "${USER_HOME}/.ssh/authorized_keys"
    chown -R "${USERNAME}:${USERNAME}" "${USER_HOME}/.ssh"
    echo "Copied root SSH keys to ${USERNAME}."
else
    echo "WARNING: No /root/.ssh/authorized_keys found."
    echo "You must add your SSH public key to ${USER_HOME}/.ssh/authorized_keys"
    echo "before running the SSH hardening script, or you will be locked out!"
fi

echo ""
echo "=== Initial setup complete ==="
echo ""
echo "NEXT STEPS (do these before running 02-harden-ssh.sh):"
echo "  1. From your LOCAL machine, verify you can SSH in as ${USERNAME}:"
echo "     ssh ${USERNAME}@<your-vps-ip>"
echo ""
echo "  2. Verify sudo works:"
echo "     sudo whoami  (should print 'root')"
echo ""
echo "  3. Only then run: sudo bash 02-harden-ssh.sh"

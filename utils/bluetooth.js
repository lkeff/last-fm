/**
 * Bluetooth Utility Module for Last.fm Desktop Application
 * Cross-platform Bluetooth device management using OS shell commands.
 * Linux: bluetoothctl + pactl  |  Windows: PowerShell + pnputil
 *
 * @module bluetooth
 */

'use strict';

const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

const IS_WINDOWS = process.platform === 'win32';

// Allowlist for MAC address format (Linux) and Windows InstanceId characters
const MAC_RE = /^([0-9A-Fa-f]{2}:){5}[0-9A-Fa-f]{2}$/;
const INSTANCE_ID_RE = /^[\w\\{}\-&#@ ]+$/;

/**
 * Validate a device address to prevent command injection.
 * @param {string} address
 * @returns {boolean}
 */
function isValidAddress(address) {
  if (typeof address !== 'string' || address.length === 0 || address.length > 200) return false;
  return IS_WINDOWS ? INSTANCE_ID_RE.test(address) : MAC_RE.test(address);
}

/**
 * Run a shell command with timeout and return stdout.
 * @param {string} cmd
 * @param {object} [opts]
 * @returns {Promise<string>}
 */
async function run(cmd, opts = {}) {
  const { stdout } = await execAsync(cmd, { timeout: opts.timeout || 10000, ...opts });
  return (stdout || '').trim();
}

/**
 * @typedef {object} BluetoothStatus
 * @property {boolean} powered
 * @property {boolean} discoverable
 * @property {boolean} pairable
 * @property {string|undefined} name
 * @property {string|undefined} address
 */

/**
 * @typedef {object} BluetoothDevice
 * @property {string} address
 * @property {string} name
 * @property {boolean} connected
 */

/**
 * Get Bluetooth controller status.
 * @returns {Promise<BluetoothStatus>}
 */
async function getStatus() {
  try {
    if (IS_WINDOWS) {
      const out = await run(
        "powershell -NoProfile -NonInteractive -Command \"Get-Service bthserv | Select-Object Name,Status | ConvertTo-Json -Compress\""
      );
      const svc = JSON.parse(out);
      return {
        powered: svc.Status === 'Running',
        discoverable: false,
        pairable: false,
        name: svc.Name,
        address: undefined
      };
    } else {
      const out = await run('bluetoothctl show');
      return {
        powered: /Powered:\s*yes/i.test(out),
        discoverable: /Discoverable:\s*yes/i.test(out),
        pairable: /Pairable:\s*yes/i.test(out),
        name: (out.match(/Name:\s*(.+)/) || [])[1]?.trim(),
        address: (out.match(/Address:\s*([0-9A-Fa-f:]{17})/i) || [])[1]
      };
    }
  } catch (err) {
    return { powered: false, discoverable: false, pairable: false, error: err.message };
  }
}

/**
 * List paired Bluetooth devices.
 * @returns {Promise<BluetoothDevice[]>}
 */
async function listDevices() {
  try {
    if (IS_WINDOWS) {
      const out = await run(
        "powershell -NoProfile -NonInteractive -Command \"Get-PnpDevice -Class Bluetooth | Select-Object Status,FriendlyName,InstanceId | ConvertTo-Json -Compress\""
      );
      if (!out || out === 'null') return [];
      const raw = JSON.parse(out);
      const arr = Array.isArray(raw) ? raw : [raw];
      return arr.map(d => ({
        address: d.InstanceId || 'unknown',
        name: d.FriendlyName || 'Unknown Device',
        connected: d.Status === 'OK'
      }));
    } else {
      const out = await run('bluetoothctl devices 2>/dev/null || echo ""');
      const devices = [];
      for (const line of out.split('\n')) {
        const m = line.match(/Device\s+([0-9A-Fa-f:]{17})\s+(.+)/);
        if (!m) continue;
        let connected = false;
        try {
          const info = await run(`bluetoothctl info ${m[1]}`);
          connected = /Connected:\s*yes/i.test(info);
        } catch { /* non-fatal */ }
        devices.push({ address: m[1], name: m[2].trim(), connected });
      }
      return devices;
    }
  } catch (err) {
    return [];
  }
}

/**
 * List Bluetooth audio sinks (Linux PulseAudio/PipeWire only).
 * @returns {Promise<Array<{name: string, description: string, isDefault: boolean}>>}
 */
async function listAudioSinks() {
  if (IS_WINDOWS) return [];
  try {
    const [sinksOut, defaultSink] = await Promise.all([
      run('pactl list sinks short 2>/dev/null || echo ""'),
      run('pactl get-default-sink 2>/dev/null || echo ""').catch(() => '')
    ]);
    return sinksOut
      .split('\n')
      .filter(l => l && (l.includes('bluetooth') || l.includes('bluez')))
      .map(l => {
        const name = l.split('\t')[1] || l.trim();
        return { name, description: name, isDefault: name === defaultSink };
      });
  } catch {
    return [];
  }
}

/**
 * Connect to a Bluetooth device.
 * @param {string} address  MAC address (Linux) or InstanceId (Windows)
 * @returns {Promise<{success: boolean, error?: string}>}
 */
async function connectDevice(address) {
  if (!isValidAddress(address)) {
    return { success: false, error: 'Invalid device address' };
  }
  try {
    if (IS_WINDOWS) {
      await run(`powershell -NoProfile -NonInteractive -Command "pnputil /enable-device '${address}'"`, { timeout: 15000 });
    } else {
      await run(`bluetoothctl connect ${address}`, { timeout: 15000 });
    }
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Disconnect a Bluetooth device.
 * @param {string} address  MAC address (Linux) or InstanceId (Windows)
 * @returns {Promise<{success: boolean, error?: string}>}
 */
async function disconnectDevice(address) {
  if (!isValidAddress(address)) {
    return { success: false, error: 'Invalid device address' };
  }
  try {
    if (IS_WINDOWS) {
      await run(`powershell -NoProfile -NonInteractive -Command "pnputil /disable-device '${address}'"`, { timeout: 15000 });
    } else {
      await run(`bluetoothctl disconnect ${address}`, { timeout: 15000 });
    }
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Set Bluetooth power on or off (Linux only).
 * @param {boolean} on
 * @returns {Promise<{success: boolean, error?: string}>}
 */
async function setPower(on) {
  try {
    if (IS_WINDOWS) {
      const action = on ? 'Start-Service' : 'Stop-Service';
      await run(`powershell -NoProfile -NonInteractive -Command "${action} bthserv"`);
    } else {
      await run(`bluetoothctl power ${on ? 'on' : 'off'}`);
    }
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

module.exports = {
  getStatus,
  listDevices,
  listAudioSinks,
  connectDevice,
  disconnectDevice,
  setPower,
  isValidAddress
};

# Writes uinput command lines (adb shell uinput -) for a USB keyboard: register, then key combos from argv
import json, sys, time
KEYS = {'ALT': 56, 'META': 125, 'CTRL': 29, 'RIGHT': 106, 'LEFT': 105, 'H': 35, 'D': 32, 'TAB': 15, 'ENTER': 28}
def out(o): sys.stdout.write(json.dumps(o) + '\n'); sys.stdout.flush()
out({"id": 1, "command": "register", "name": "Test USB Keyboard", "vid": 6353, "pid": 11330, "bus": "usb",
     "configuration": [{"type": 100, "data": [1]}, {"type": 101, "data": list(range(1, 128))}]})
for line in sys.stdin:
    keys = [KEYS[k] for k in line.split()]
    if not keys: continue
    ev = []
    for k in keys: ev += [1, k, 1, 0, 0, 0]
    for k in reversed(keys): ev += [1, k, 0, 0, 0, 0]
    out({"id": 1, "command": "inject", "events": ev})

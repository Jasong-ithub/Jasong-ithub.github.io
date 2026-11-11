#!/usr/bin/env bash
# Diagnostic only (TalkBack keys, 11 November 2026): where do keys stop on the emulator?
set -x
PKG=com.android.talkback
SVC=$PKG/com.google.android.marvin.talkback.TalkBackService
mark(){ adb shell log -t DIAG "MARK $1"; echo "==== MARK $1"; }
emu(){ adb emu event send "$@"; }
combo(){ # keys down in order then up in reverse, each its own console command with a sync
  for k in "$@"; do emu EV_KEY:$k:1 EV_SYN:0:0; sleep 0.05; done
  for ((i=$#; i>0; i--)); do emu EV_KEY:${!i}:0 EV_SYN:0:0; sleep 0.05; done; }
adb install -r -g talkback.apk
adb shell cmd package compile -m speed -f $PKG
adb shell getprop ro.build.fingerprint
adb shell getevent -p 2>&1 | grep -E "add device|name:|KEY|ABS" | head -60
adb shell settings put secure accessibility_verbose_logging 1
adb shell settings put secure tts_default_synth com.google.android.tts
adb shell am set-debug-app --persistent com.android.chrome
adb shell 'echo "_ --disable-fre --no-default-browser-check --no-first-run --disable-features=SigninPromo" > /data/local/tmp/chrome-command-line'
adb shell settings put secure enabled_accessibility_services $SVC
adb shell settings put secure accessibility_enabled 1
sleep 45
adb logcat -c
adb logcat -v time > logcat.txt 2>&1 &
LC=$!
adb shell getevent -lt > getevent.txt 2>&1 &
GE=$!
sleep 2
adb shell am start -a android.settings.SETTINGS; sleep 10
mark settings-emu-alt-right-separate; combo KEY_LEFTALT KEY_RIGHT; sleep 4
mark settings-emu-alt-right-onecmd; emu EV_KEY:KEY_LEFTALT:1 EV_SYN:0:0 EV_KEY:KEY_RIGHT:1 EV_SYN:0:0 EV_KEY:KEY_RIGHT:0 EV_SYN:0:0 EV_KEY:KEY_LEFTALT:0 EV_SYN:0:0; sleep 4
mark settings-emu-right; combo KEY_RIGHT; sleep 4
mark settings-emu-tab; combo KEY_TAB; sleep 4
mark settings-emu-meta-right; combo KEY_LEFTMETA KEY_RIGHT; sleep 4
mark settings-input-keycombination; adb shell input keycombination KEYCODE_ALT_LEFT KEYCODE_DPAD_RIGHT; sleep 4
mark settings-input-keyevent-tab; adb shell input keyevent KEYCODE_TAB; sleep 4
mark chrome-open; adb shell am start -n com.android.chrome/com.google.android.apps.chrome.Main -a android.intent.action.VIEW -d https://jasong-ithub.github.io/benchmark-shop/help.html; sleep 25
mark chrome-emu-alt-right-separate; combo KEY_LEFTALT KEY_RIGHT; sleep 4
mark chrome-emu-alt-right-2; combo KEY_LEFTALT KEY_RIGHT; sleep 4
mark chrome-emu-alt-h; combo KEY_LEFTALT KEY_H; sleep 4
mark chrome-emu-meta-right; combo KEY_LEFTMETA KEY_RIGHT; sleep 4
mark chrome-emu-h; combo KEY_H; sleep 4
mark chrome-emu-tab; combo KEY_TAB; sleep 4
mark chrome-input-keycombination; adb shell input keycombination KEYCODE_ALT_LEFT KEYCODE_DPAD_RIGHT; sleep 4
mark end
kill $GE $LC 2>/dev/null; sleep 1
echo "==== getevent (first 200 lines)"; head -200 getevent.txt
echo "==== DIAG and TBDIAG lines"; grep -E "DIAG|TBDIAG" logcat.txt | head -300
echo "==== talkback speech"; grep -E "MARK|Speaking fragment|TBDIAG|execute\(\) feedback" logcat.txt | cut -c1-260 | head -400
echo "==== accessibility input lines"; grep -iE "MARK|KeyboardInterceptor|AccessibilityInputFilter|KeyEventDispatcher|InputDispatcher" logcat.txt | cut -c1-260 | head -100
echo "==== dumpsys accessibility"; adb shell dumpsys accessibility | head -80
echo "==== dumpsys input (dispatcher)"; adb shell dumpsys input | grep -iE "InputFilter|RecentQueue|KeyEvent|Device [0-9]+:|Classes|Sources" | head -80
echo "==== talkback dump"; adb shell dumpsys activity service $SVC | head -120

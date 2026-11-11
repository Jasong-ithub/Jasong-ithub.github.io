#!/usr/bin/env bash
# Diagnostic only (TalkBack keys, 11 November 2026, second run): does a USB keyboard made with Android's own uinput
# shell command reach TalkBack, and do the emulator console's keys reach the input devices at all?
set -x
PKG=com.android.talkback
SVC=$PKG/com.google.android.marvin.talkback.TalkBackService
D=.github/tb-diag
mark(){ adb shell log -t DIAG "MARK $1"; echo "==== MARK $1"; }
adb shell id
adb shell ls -l /dev/uinput
adb install -r -g talkback.apk
adb shell cmd package compile -m speed -f $PKG
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
# 1. the emulator console's keys: counted on the qwerty2 device itself (getevent exits after 4 events)
Q=$(adb shell getevent -p | grep -B1 '"qwerty2"' | head -1 | awk '{print $4}')
echo "qwerty2 is $Q"
(timeout 15 adb shell getevent -lt -c 4 $Q > ge-emu.txt 2>&1 &)
sleep 2
adb emu event send EV_KEY:KEY_TAB:1 EV_SYN:0:0 EV_KEY:KEY_TAB:0 EV_SYN:0:0
sleep 14; echo "==== getevent of the emulator's keys"; cat ge-emu.txt
# 2. a USB keyboard through uinput, kept open through a FIFO
mkfifo kbd.fifo
(tail -f kbd.fifo | python3 $D/kbd.py | adb shell uinput - > uinput.out 2>&1 &)
exec 3>kbd.fifo
sleep 3
adb shell getevent -p | grep -E "add device|name:"
adb shell dumpsys input | grep -A3 "Test USB Keyboard" | head -8
k(){ mark "$1"; echo "$2" >&3; sleep 4; }
adb shell am start -a android.settings.SETTINGS; sleep 10
k settings-usb-alt-right "ALT RIGHT"
k settings-usb-alt-right-2 "ALT RIGHT"
k settings-usb-tab "TAB"
k settings-usb-meta-right "META RIGHT"
mark chrome-open; adb shell am start -n com.android.chrome/com.google.android.apps.chrome.Main -a android.intent.action.VIEW -d https://jasong-ithub.github.io/benchmark-shop/help.html; sleep 25
k chrome-usb-alt-right "ALT RIGHT"
k chrome-usb-alt-right-2 "ALT RIGHT"
k chrome-usb-alt-h "ALT H"
k chrome-usb-alt-h-2 "ALT H"
k chrome-usb-alt-d "ALT D"
k chrome-usb-meta-right "META RIGHT"
k chrome-usb-h "H"
k chrome-usb-tab "TAB"
k chrome-usb-alt-right-3 "ALT RIGHT"
mark end
exec 3>&-
sleep 2; kill $LC 2>/dev/null
echo "==== uinput output"; head -30 uinput.out
echo "==== marks, TalkBack's keys and speech"; grep -E "MARK|TBDIAG|Speaking fragment|TTS is not ready" logcat.txt | cut -c1-300 | head -300
echo "==== dumpsys input recent"; adb shell dumpsys input | grep -A12 "RecentQueue" | head -30
echo "==== talkback dump"; adb shell dumpsys activity service $SVC | grep -E "inputMode|keymap|Keymap" | head

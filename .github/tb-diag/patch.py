# Diagnostic only: log every key event TalkBack receives and what its key combo manager decides
import sys
root = sys.argv[1]
def edit(path, anchor, add, after=True):
    p = f"{root}/{path}"
    s = open(p).read()
    assert s.count(anchor) == 1, (path, anchor, s.count(anchor))
    s = s.replace(anchor, anchor + add if after else add + anchor)
    open(p, 'w').write(s)
TB = "talkback/src/main/java/com/google/android/accessibility/talkback/TalkBackService.java"
KC = "talkback/src/main/java/com/google/android/accessibility/talkback/keyboard/KeyComboManager.java"
edit(TB, "protected boolean onKeyEventInternal(KeyEvent keyEvent) {",
     '\n    android.util.Log.w("TBDIAG", "service.onKeyEvent active=" + isServiceActive() + " dev=" + keyEvent.getDeviceId() + " " + keyEvent);')
edit(TB, "      if (listener.onKeyEvent(keyEvent, eventId)) {",
     '\n        android.util.Log.w("TBDIAG", "consumed by " + listener.getClass().getSimpleName());')
edit(KC, "  public boolean onKeyEvent(KeyEvent event, EventId eventId) {",
     '\n    android.util.Log.w("TBDIAG", "KCM.onKeyEvent delegate=" + (keyEventDelegate != null) + " partial=" + hasPartialMatch + " performed=" + performedCombo + " match=" + matchKeyCombo + " state=" + serviceState + " trigger=" + keyComboModel.getTriggerModifier() + " model=" + keyComboModel.getClass().getSimpleName() + " mods=" + event.getModifiers());')
edit(KC, "    performedCombo = matchAndPerformKeyCombo(currentKeyCombo, triggerModifier);",
     '\n    android.util.Log.w("TBDIAG", "KCM.onKeyDown combo mods=" + currentKeyCombo.getModifiers() + " key=" + currentKeyCombo.getKeyCode() + " trigger=" + currentKeyCombo.isTriggerModifierUsed() + " performed=" + performedCombo + " partial=" + hasPartialMatch);')
edit(KC, "    boolean triggerModifierNotPressedWhenNeeded =",
     '    android.util.Log.w("TBDIAG", "KCM.onKeyDown trigger=" + triggerModifier + " pressed=" + pressedTriggerModifier + " browse=" + enabledBrowseMode + " mods=" + event.getModifiers());\n', after=False)
print("patched")

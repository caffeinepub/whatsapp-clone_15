# Specification

## Summary
**Goal:** Fix the unresponsive Create Profile screen so that users can successfully submit their display name and be transitioned into the main chat layout.

**Planned changes:**
- Diagnose and fix the `ProfileSetupModal` so input fields remain interactive after Internet Identity login.
- Ensure submitting a valid display name correctly triggers the `registerUser` backend call without the UI freezing or the submit button becoming permanently disabled.
- Show a loading indicator on the submit button while the call is in flight, and re-enable the form after completion.
- Display an error message if the backend call fails, keeping the form usable for retry.
- Fix the `useAuthFlow` hook to correctly reflect the newly registered state so the `ProfileSetupModal` is not re-shown after successful registration.
- On successful registration, close the modal and navigate the user to the main `ChatLayout`.

**User-visible outcome:** After logging in with Internet Identity, users can enter a display name (and optional avatar URL), submit the form without it hanging, and be taken directly into the main chat interface.

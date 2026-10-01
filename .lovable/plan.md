# Centered Pookie Doll Upgrade

## What will change
- Re-anchor the doll to the top-center edge of the main upload area and increase her displayed size by 1.5× on desktop and mobile.
- Keep her above the pink bubbles at layer 50 while ensuring the doll wrapper never blocks file drops or clicks.
- Preserve the existing candy control beneath her and keep the current roaming, bubble reactions, and return-to-home behavior centered on the upload area.

## Face and voice behavior
- Add Framer Motion for the doll’s motion states and spring transitions.
- Track browser speech start/end events so a small mouth overlay animates continuously only while dialogue is playing.
- Add a subtle eye overlay that blinks independently every three seconds.
- Keep speech cancellation and event cleanup so repeated lines do not overlap or stutter.

## Technical details
- Update the doll component’s home-coordinate calculation to use the centered anchor.
- Use responsive dimensions of 114px on mobile and 150px on larger screens.
- Add transparent, non-interactive facial overlays positioned over the existing image; the original doll asset remains unchanged.
- Verify the centered placement, candy interaction, upload click-through, animation state, and production build health.

## Preserved
- Beige-blue styling and all existing visual assets.
- File conversion controls, target-size inputs, and processing logic.
- Search metadata and verification tags.

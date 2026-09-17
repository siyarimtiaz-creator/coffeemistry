# Home Hero Background Diagnosis

## Published-route reproduction

The published Home route retains its original hero image element and reference: `/manus-storage/coffeemistry-hero_a0f2021e.jpg`. Browser inspection shows the element completes with zero natural width and height. The hero is therefore not hidden by its existing overlay or typography layers; its copied-project storage reference does not resolve to an image asset.

## Original asset comparison

The source Coffeemistry deployment uses the same relative path and successfully loads the original landscape hero image at 1920 × 1080. As with the earlier catalog-media issue, that source storage object was not included in this independent project’s storage namespace. The Home implementation itself, hero text, layout, overlays, and animation layers remain unchanged.

## Restoration validation

The original hero image was copied into this project’s approved static storage and the Home page’s single hero asset constant was updated to the new project-local URL. Desktop, tablet, and mobile visual checks show the intended cup photography, existing overlays, readable hero text, functional CTA placement, correct cropping, and no horizontal overflow. No Home content, styling, animation, or non-Home route was changed.

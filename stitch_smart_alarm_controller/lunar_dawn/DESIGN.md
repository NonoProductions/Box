# Design System Document: The Morning Ethereal

## 1. Overview & Creative North Star
**Creative North Star: "The Weightless Awakening"**

This design system is engineered to feel like the first light of dawn—breathable, effortless, and profoundly calm. To move beyond the "template" look, we move away from rigid structural grids and toward a **Fluid Editorial Layout**. By utilizing intentional asymmetry, expansive white space, and a rejection of hard borders, the UI feels less like an app and more like a digital sanctuary. 

The experience is defined by "intentional air"—using large margins and high-contrast typography scales to guide the eye through a serene, unhurried journey. We don't just present data; we curate moments of peace.

---

## 2. Colors & Surface Philosophy
The palette is rooted in Soft Indigo (`primary`) and the clarity of a morning sky (`background`). 

### The "No-Line" Rule
**Traditional 1px borders are strictly prohibited.** To section content, use background shifts. A section of `surface-container-low` sitting atop a `background` provides all the definition a user needs without the cognitive "noise" of a line.

### Surface Hierarchy & Nesting
Treat the UI as a physical stack of fine, semi-transparent papers. 
- **Base Level:** `surface` (#f7f9fc) for the main canvas.
- **Sectioning:** Use `surface-container-low` (#f0f4f8) to group related content blocks.
- **Focal Points:** Use `surface-container-lowest` (#ffffff) for high-priority cards to make them "pop" against the off-white background.

### The "Glass & Gradient" Rule
To add soul to the indigo, avoid flat fills for large areas. Use a subtle linear gradient from `primary` (#4456ba) to `primary-container` (#8596ff) for hero states or primary CTAs. For floating elements (like a navigation bar or a "Sleep Now" overlay), apply **Glassmorphism**: use `surface` at 70% opacity with a `24px` backdrop-blur to allow underlying colors to bleed through softly.

---

## 3. Typography
The system utilizes **Manrope** for its geometric yet approachable character. We use extreme scale variance to create an editorial feel.

- **Display (Large/Medium):** Reserved for "Aha!" moments—total hours slept or morning greetings. These should be set with tight letter-spacing (-0.02em) to feel premium.
- **Headlines:** Used for section starts. Paired with `surface-container` shifts, they create clear entry points without needing dividers.
- **Body-LG:** Our standard for readability. It must have generous line-height (1.6) to maintain the "airy" aesthetic.
- **Labels:** Use `on-surface-variant` (#596065) for meta-data.

**Hierarchy Strategy:** A `display-md` headline should often be paired with a `body-sm` description to create a sophisticated, high-contrast visual tension that feels custom-designed.

---

## 4. Elevation & Depth
Depth in this system is achieved through **Tonal Layering**, not structural shadows.

- **The Layering Principle:** Instead of a shadow, place a `surface-container-lowest` card on a `surface-container-low` background. The subtle shift from #f0f4f8 to #ffffff creates a "soft lift" that feels organic.
- **Ambient Shadows:** If an element must float (e.g., a FAB or a Tooltip), use an ultra-diffused shadow: `Y: 12px, Blur: 32px, Color: #3F51B5 at 6% opacity`. This mimics natural light passing through blue-tinted glass.
- **The "Ghost Border" Fallback:** For input fields or essential containers, use the `outline-variant` (#abb3b9) at **15% opacity**. This creates a suggestion of a boundary rather than a hard constraint.

---

## 5. Components

### Buttons
- **Primary:** Gradient fill (`primary` to `primary-container`) with `on-primary` text. No shadow. 8px (`DEFAULT`) radius.
- **Secondary:** `secondary-container` (#e0e1f9) background with `on-secondary-container` text.
- **Tertiary:** Pure text using `primary` color, bold weight, with a `title-sm` scale.

### Cards & Lists
- **The Divider Ban:** Never use a horizontal rule. To separate list items, use 16px of vertical spacing. For cards, use `surface-container-low` with an 8px corner radius.
- **Interaction:** On hover/tap, transition a card from `surface-container-low` to `surface-container-lowest` and apply a 4% Indigo ambient shadow.

### Input Fields
- Avoid "box" inputs. Use a `surface-container-low` fill with a `Ghost Border`. When focused, the border transitions to `primary` at 40% opacity.

### Custom Components for Sleep
- **The Breath Indicator:** A large, circular element using a `primary_dim` to `primary` radial gradient, with a 20px backdrop-blur glass effect on the inner ring.
- **The Progress Arc:** Use `primary` for the active path and `surface-container-highest` (#dce3e9) for the track to maintain the soft-contrast look.

---

## 6. Do’s and Don’ts

### Do:
- **Do** use whitespace as a functional element. If a screen feels "busy," double the margin between sections.
- **Do** use `primary-fixed-dim` (#7789f0) for icons to keep them visible but soft.
- **Do** align text and imagery asymmetrically to create a modern, editorial rhythm.

### Don’t:
- **Don’t** use pure black (#000000) for text. Use `on-surface` (#2c3338) to keep the "morning-fresh" softness.
- **Don’t** use standard Material Design 2px borders or high-opacity shadows.
- **Don’t** crowd the edges of the screen. Maintain a minimum 24px "Breathing Room" margin on all mobile screens.

---

## 7. Tokens Reference Summary

| Role | Token Value | Usage |
| :--- | :--- | :--- |
| **Background** | `#f7f9fc` | Main screen canvas |
| **Primary CTA** | `#4456ba` | High-emphasis actions |
| **Secondary Tier** | `#e0e1f9` | Sub-sections and chips |
| **High Surface** | `#ffffff` | Floating cards / Modals |
| **Shadow Tint** | `#3F51B5 (6%)` | Ambient depth |
| **Rounding** | `0.5rem (8px)` | Global radius |
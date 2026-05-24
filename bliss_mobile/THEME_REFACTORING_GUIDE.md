# Bliss Flutter App - Brand Theme Refactoring Guide

## Overview
Your Flutter app has been refactored with a consistent brand theme following fintech and recruitment platform design patterns. The theme uses a professional color palette with deep blue primary color, forest green secondary, and white backgrounds.

---

## Brand Colors

### Primary Color (Blue)
- **Hex:** `#0D47A1`
- **Flutter Color:** `Color(0xFF0D47A1)`
- **Usage:** Main buttons, headers, active states, primary navigation, text highlights
- **Example:** AppBar background, Primary CTA buttons, form focus states

### Secondary Color (Green)
- **Hex:** `#2E7D32`
- **Flutter Color:** `Color(0xFF2E7D32)`
- **Usage:** Success states, positive feedback, secondary actions, highlights
- **Example:** Success messages, icon highlights, secondary buttons (when needed)

### Background
- **Light Mode:** `#FFFFFF` (Pure White)
- **Dark Mode:** `#121212` (Deep Black)
- **Usage:** Scaffold and card backgrounds

### Supporting Colors
- **Surface (Light):** `#FAFAFA` - Light background for inputs and secondary surfaces
- **Surface (Dark):** `#1E1E1E` - Dark surfaces
- **Text Dark:** `#212121` - Primary text color
- **Text Medium:** `#616161` - Secondary text color
- **Error/Danger:** `#DD3E3E` - Error states and warnings

---

## Theme Structure in `lib/theme.dart`

### Key Components:

1. **AppBar Theme**
   - Background: Primary Blue (`#0D47A1`)
   - Foreground: White
   - Elevation: 0 (flat design)
   - Title font size: 18, weight: w600

2. **Button Themes**
   - **ElevatedButton:** Blue background, white text, rounded corners (12dp)
   - **OutlinedButton:** Blue border (1.5px), blue text
   - Padding: 16px vertical, 24px horizontal
   - Font weight: w600

3. **Input Field Theme**
   - **Fill Color (Light):** `#FAFAFA`
   - **Fill Color (Dark):** `#2A2A2A`
   - **Border Radius:** 12dp
   - **Border Color (Enabled):** `Colors.grey.shade300`
   - **Border Color (Focused):** Primary Blue, 2px width
   - **Prefix Icon Color:** Primary Blue

4. **Card Theme**
   - Border radius: 12dp
   - Elevation: 2
   - Margin: 8px vertical, 12px horizontal

5. **Text Theme**
   - **Display Large:** 34px, bold, dark text
   - **Headline Small:** 20px, w700, primary blue for headings
   - **Title Large:** 18px, w600
   - **Body Large:** 16px
   - **Body Medium:** 14px
   - **Label Large:** 14px, w600, white (for buttons)

---

## Applying Theme to Screens

### Example 1: Login/Signup Screen Structure

```dart
// 1. Use theme from context
final theme = Theme.of(context);

Scaffold(
  backgroundColor: theme.scaffoldBackgroundColor,
  appBar: AppBar(...), // Uses theme colors automatically
  body: Column(
    children: [
      // Logo Section
      const Logo(height: 50, width: 50),
      
      // Title using theme
      Text(
        'Portal Title',
        style: theme.textTheme.headlineSmall?.copyWith(
          color: theme.colorScheme.primary, // Blue
          fontWeight: FontWeight.w700,
        ),
      ),
      
      // Form Card
      Card(
        child: Column(
          children: [
            // Form fields automatically use theme input decoration
            TextField(
              decoration: InputDecoration(
                labelText: 'Email',
                prefixIcon: const Icon(Icons.email),
              ),
            ),
            
            // Button uses theme style
            ElevatedButton(
              onPressed: () {},
              child: const Text('Submit'),
            ),
          ],
        ),
      ),
    ],
  ),
)
```

### Example 2: Using Theme Colors Explicitly

```dart
// Primary Blue
theme.colorScheme.primary          // #0D47A1
theme.colorScheme.onPrimary        // White text on blue

// Secondary Green
theme.colorScheme.secondary        // #2E7D32

// Text Colors
theme.textTheme.bodyMedium?.copyWith(
  color: Colors.grey.shade600,     // Medium gray
)

// Surface Colors
theme.scaffoldBackgroundColor      // White (light) / #121212 (dark)
theme.colorScheme.surface          // #FAFAFA (light) / #1E1E1E (dark)
```

---

## Styling Guidelines

### Spacing & Padding

**Standard Spacing Units:**
- **Minimal:** 8px
- **Small:** 12px
- **Medium:** 16px
- **Standard:** 20px
- **Large:** 24px
- **Extra Large:** 32px

**Form Fields:**
```dart
SizedBox(height: 16), // Between form fields
SizedBox(height: 28), // Before buttons
```

**Cards & Containers:**
```dart
padding: const EdgeInsets.all(28),  // Card internal padding
margin: const EdgeInsets.symmetric(horizontal: 20), // Screen margins
```

### Border Radius

- **Form Fields & Cards:** 12dp
- **Larger Components:** 16dp
- **Buttons:** 12dp (inherited from theme)

### Icons

- **Size:** 24px (standard), 50px (logo), 64px (hero)
- **Color:** Automatically inherits from theme prefix icon color (primary blue)
- **Spacing:** 12px after icon, 8px before

### Text Styling

**Do use theme:**
```dart
Text(
  'Hello',
  style: theme.textTheme.headlineSmall?.copyWith(
    color: theme.colorScheme.primary,
  ),
)
```

**Don't hardcode colors:**
```dart
// ❌ Avoid
Text('Hello', style: TextStyle(color: Colors.blue))
// ✅ Use
Text('Hello', style: theme.textTheme.headlineSmall)
```

### Button Styling

**Primary Action (Blue):**
```dart
ElevatedButton(
  onPressed: () {},
  child: const Text('Login'),
)
```

**Secondary Action (Outlined):**
```dart
OutlinedButton(
  onPressed: () {},
  child: const Text('Cancel'),
)
```

**Buttons automatically inherit:**
- Correct colors (blue bg, white text)
- Rounded corners (12dp)
- Proper padding
- Font weight (w600)

### Form Fields

**Email/Text Input:**
```dart
TextField(
  keyboardType: TextInputType.emailAddress,
  decoration: InputDecoration(
    labelText: 'Email Address',
    prefixIcon: const Icon(Icons.email),
    hintText: 'your.email@company.com',
  ),
)
```

**Password Input:**
```dart
TextField(
  obscureText: !_passwordVisible,
  decoration: InputDecoration(
    labelText: 'Password',
    prefixIcon: const Icon(Icons.lock),
    suffixIcon: IconButton(
      icon: Icon(_passwordVisible 
        ? Icons.visibility 
        : Icons.visibility_off),
      onPressed: () => setState(
        () => _passwordVisible = !_passwordVisible,
      ),
    ),
  ),
)
```

---

## Updated Screens

### 1. **Employer Login Screen** (`lib/employers_portal/screens/employer_login_screen.dart`)

**Changes:**
- ✅ Added Bliss logo at the top
- ✅ Updated to white background
- ✅ Changed AppBar to use primary blue
- ✅ Updated form fields to use theme input decoration
- ✅ Improved spacing and padding
- ✅ Added password visibility toggle
- ✅ Better visual hierarchy with card-based design
- ✅ Professional divider between email/Google login
- ✅ Responsive layout (max-width: 450px)

**Key Features:**
```
┌─────────────────────┐
│   Logo (50x50)      │
│  Bliss Employer     │
│  Portal             │
│                     │
│  Connect with top   │
│  global talent      │
├─────────────────────┤
│  ┌───────────────┐  │
│  │ Welcome Back  │  │ ← Card with shadow
│  │               │  │
│  │ Email: ___    │  │ ← Theme input fields
│  │ Password: ___ │  │
│  │               │  │
│  │  [LOGIN BTN]  │  │ ← Blue button
│  │               │  │
│  │  ────or────   │  │
│  │               │  │
│  │[Google Sign]  │  │ ← Outlined button
│  └───────────────┘  │
│                     │
│ Don't have account? │
│      Sign up        │
└─────────────────────┘
```

### 2. **Employer Signup Screen** (`lib/employers_portal/screens/employer_signup_screen.dart`)

**Changes:**
- ✅ Updated AppBar with primary blue and logo
- ✅ Changed to white background
- ✅ Applied theme input decoration to all form fields
- ✅ Added icons to form fields (person, business, email, phone, etc.)
- ✅ Improved form field spacing (18px between fields)
- ✅ Updated buttons to use theme styling
- ✅ Removed hardcoded colors
- ✅ Better responsive design

**Form Fields:**
- Full Name (with person icon)
- Company Name (with business icon)
- Account Type (dropdown)
- Email (with email icon)
- Password (with lock icon)
- WhatsApp Number (with phone icon)
- Country (with globe icon)

---

## Dark Mode Support

The theme automatically supports dark mode:

**Light Mode:**
- Background: `#FFFFFF` (white)
- Text: `#212121` (dark)
- Surface: `#FAFAFA`
- AppBar: Primary Blue

**Dark Mode:**
- Background: `#121212` (deep black)
- Text: White/light gray
- Surface: `#1E1E1E`
- AppBar: `#1E1E1E`

**Implementation:** No additional code needed! The theme handles switching automatically based on system settings or `ThemeMode`.

---

## Best Practices Going Forward

### 1. **Always Use Theme Colors**
```dart
// ✅ Good
color: theme.colorScheme.primary
color: theme.colorScheme.secondary
backgroundColor: theme.scaffoldBackgroundColor

// ❌ Avoid
color: Color(0xFF0D47A1)
color: Colors.blue
backgroundColor: Colors.white
```

### 2. **Use Theme Text Styles**
```dart
// ✅ Good
style: theme.textTheme.headlineSmall
style: theme.textTheme.bodyMedium

// ❌ Avoid
style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold)
```

### 3. **Leverage Built-in Components**
```dart
// ✅ Use theme-aware components
TextField(...) // Inherits input theme
ElevatedButton(...) // Inherits button theme
Card(...) // Inherits card theme
AppBar(...) // Inherits AppBar theme

// ❌ Don't create custom styled versions
Container(
  decoration: BoxDecoration(
    color: Colors.blue,
    borderRadius: BorderRadius.circular(8),
  ),
)
```

### 4. **Consistent Spacing**
- Between form fields: **16px** (SizedBox height)
- Before buttons: **28px**
- Screen padding: **20px**
- Card padding: **28px**

### 5. **Icon Colors & Sizes**
- Standard icons: 24px (automatic from theme)
- Logo: 50px (for headers)
- Hero icons: 64px (for large sections)
- All icons automatically use primary blue prefix icon color

### 6. **Logo Placement**
```dart
// Top of major screens
const Logo(height: 50, width: 50),
const SizedBox(height: 16),
Text('Portal Title', style: theme.textTheme.headlineSmall),
```

---

## Checklist for New Screens

When creating new screens, follow this checklist:

- [ ] Use `theme.scaffoldBackgroundColor` for Scaffold
- [ ] Use primary blue for AppBar (`theme.colorScheme.primary`)
- [ ] Use theme input decoration for all text fields
- [ ] Use theme text styles for all text
- [ ] ElevatedButton uses theme styling (no custom style needed)
- [ ] OutlinedButton uses theme styling
- [ ] Cards use theme card theme (automatic)
- [ ] Icons use theme icon colors (automatic prefix icon color)
- [ ] Spacing follows standard units (16px, 20px, 28px)
- [ ] Border radius is 12dp for inputs/buttons, 16dp for cards
- [ ] Logo added to top of major screens (login, signup, portals)
- [ ] Tested in both light and dark modes
- [ ] No hardcoded colors (`Colors.blue`, `Color(0xFF...)`)
- [ ] No custom font styles (use theme text styles)

---

## Color Palette Summary

| Element | Light Mode | Dark Mode | Usage |
|---------|-----------|-----------|-------|
| **Primary** | `#0D47A1` | `#0D47A1` | Buttons, headers, active states |
| **Secondary** | `#2E7D32` | `#2E7D32` | Success, highlights |
| **Background** | `#FFFFFF` | `#121212` | Scaffold background |
| **Surface** | `#FAFAFA` | `#1E1E1E` | Cards, inputs |
| **Text Primary** | `#212121` | `#FFFFFF` | Main text |
| **Text Secondary** | `#616161` | `#E0E0E0` | Supporting text |
| **Error** | `#DD3E3E` | `#DD3E3E` | Error states |
| **Border** | `#E0E0E0` | `#424242` | Input borders |

---

## Testing Checklist

- [ ] Login screen displays correctly
- [ ] Signup form shows all fields properly spaced
- [ ] Buttons have proper hover states
- [ ] Icons render correctly in form fields
- [ ] Dark mode works without additional changes
- [ ] Responsive design works on mobile (320px+) and tablet (600px+)
- [ ] Password visibility toggle works
- [ ] Form validation shows proper error states
- [ ] Logo appears at correct size and spacing

---

## Questions or Issues?

If you need to make adjustments to the theme:

1. **Edit colors:** Modify the color constants at the top of `lib/theme.dart`
2. **Change spacing:** Update padding/margin values in theme definitions
3. **Adjust typography:** Modify `_textThemeLightMode` and `_textThemeDarkMode`
4. **Update button styles:** Modify `elevatedButtonTheme` and `outlinedButtonTheme`
5. **Change border radius:** Update all `BorderRadius.circular()` values

All changes will automatically apply across the entire app!

---

**Theme Last Updated:** May 2026
**Version:** 1.0
**Brand Colors:** Bliss Connect Professional Palette

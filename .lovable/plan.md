

## Replace Profile Avatar with Custom Image

Copy the uploaded image to `src/assets/` and update `UserProfile.tsx` to display it instead of the ChefHat icon in the profile circle.

### Changes

**1. Copy asset**
- Copy `user-uploads://recepie.avif` → `src/assets/profile-avatar.avif`

**2. Update `src/pages/UserProfile.tsx`**
- Import the image: `import profileAvatar from "@/assets/profile-avatar.avif"`
- Replace the ChefHat icon inside the 64px avatar circle with an `<img>` tag using `object-cover` and `rounded-full` styling


# Admin Users + Admin Notifications: 3 chhoti manual edits

Zip ki files `carwise-backend/src/` mein copy karo (overwrite):
- src/admin-users/            (naya)
- src/admin-notifications/    (naya)
- src/access-control/roles.guard.ts   (update: deactivated user ko block karta hai)
- src/notifications/notification.schema.ts (update: ek naya `campaign` field)

## 1) users/schemas/user.schema.ts  -> isActive field
`role` wali property ke neeche ye add karo:

```ts
  @Prop({ default: true })
  isActive: boolean;
```

## 2) auth/auth.service.ts  -> deactivated user login na kar sake
Teen jagah ye 5 lines add karo:

```ts
    if (user.isActive === false) {
      throw new UnauthorizedException(
        'Your account has been deactivated. Please contact support.',
      );
    }
```
- login(): `isPasswordValid` wale check ke BAAD
- googleLogin(): user mil jane / ban jane ke BAAD, `const payload = ...` se PEHLE
- refreshTokens(): `if (!user || user.refreshToken !== refreshToken) {...}` ke BAAD

## 3) app.module.ts  -> modules register
```ts
import { AdminUsersModule } from './admin-users/admin-users.module';
import { AdminNotificationsModule } from './admin-notifications/admin-notifications.module';
```
aur `imports: [...]` array mein `AdminUsersModule, AdminNotificationsModule,` add karo.

"""One-shot script to create or promote an admin user.

Usage (from the backend/ directory):
    python create_admin.py

Requires the same .env / environment as the app (DATABASE_URL must be reachable).
"""
import asyncio
import sys
import os

sys.path.insert(0, os.path.dirname(__file__))

EMAIL    = "config@cardecon.com"
USERNAME = "cardecon_admin"
PASSWORD = "password123"


async def main():
    from sqlalchemy import select
    from app.database import AsyncSessionLocal, engine, Base
    import app.models.user   # register model with Base
    from app.models.user import User, UserRole, SubscriptionTier
    from app.core.security import hash_password

    # Ensure tables exist
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as db:
        # Check if user already exists
        result = await db.execute(select(User).where(User.email == EMAIL))
        user = result.scalar_one_or_none()

        if user:
            # Promote existing user
            user.role = UserRole.admin
            user.subscription_tier = SubscriptionTier.admin
            user.is_verified = True
            user.password_hash = hash_password(PASSWORD)
            await db.commit()
            print(f"✓ Existing user {EMAIL} updated to admin role.")
        else:
            # Create new admin user
            user = User(
                email=EMAIL,
                username=USERNAME,
                password_hash=hash_password(PASSWORD),
                role=UserRole.admin,
                subscription_tier=SubscriptionTier.admin,
                is_verified=True,
            )
            db.add(user)
            await db.commit()
            print(f"✓ Admin user created: {EMAIL} / {USERNAME}")

        print(f"  Email:    {EMAIL}")
        print(f"  Username: {user.username}")
        print(f"  Password: {PASSWORD}")
        print(f"  Role:     {user.role}")

    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(main())

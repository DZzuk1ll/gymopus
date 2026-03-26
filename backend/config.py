from __future__ import annotations

from cryptography.fernet import Fernet
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str = "sqlite+aiosqlite:///./gymops.db"
    encryption_key: str = ""
    auth_token: str | None = None
    auth_enabled: bool = False
    cors_origins: list[str] = ["http://localhost:3000"]

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    def get_encryption_key(self) -> str:
        if not self.encryption_key:
            key = Fernet.generate_key().decode()
            self.encryption_key = key
            print(
                f"[WARNING] No ENCRYPTION_KEY set. Generated a new key: {key}\n"
                "Please add it to your .env file to persist across restarts."
            )
        return self.encryption_key


settings = Settings()

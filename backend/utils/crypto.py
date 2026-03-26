from __future__ import annotations

from cryptography.fernet import Fernet

from config import settings

_fernet: Fernet | None = None


def _get_fernet() -> Fernet:
    global _fernet
    if _fernet is None:
        key = settings.get_encryption_key()
        _fernet = Fernet(key.encode())
    return _fernet


def encrypt_api_key(plain_key: str) -> str:
    return _get_fernet().encrypt(plain_key.encode()).decode()


def decrypt_api_key(encrypted_key: str) -> str:
    return _get_fernet().decrypt(encrypted_key.encode()).decode()


def mask_api_key(encrypted_key: str | None) -> str | None:
    if not encrypted_key:
        return None
    try:
        decrypted = decrypt_api_key(encrypted_key)
        return f"****{decrypted[-4:]}" if len(decrypted) >= 4 else "****"
    except Exception:
        return "****"

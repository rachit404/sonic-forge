"""Basic config sanity tests."""
from sonicforge.config import settings


def test_settings_loaded():
    assert settings.app_port == 8000
    assert settings.app_env in ("development", "production")
    assert settings.projects_root is not None

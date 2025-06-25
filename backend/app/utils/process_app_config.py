import os
import json
from app.utils.logger_setup import logger

CONFIG_DIR = os.path.join(os.getcwd(), "config")
APP_CONFIG_PATH = os.path.join(CONFIG_DIR, "app_config.json")
DEFAULT_CONFIG_PATH = os.path.join(CONFIG_DIR, "default_app_config.json")

with open(DEFAULT_CONFIG_PATH, "r") as default_config_file:
    DEFAULT_CONFIG = json.load(default_config_file)


def get_config_value(config_dict, key, default, cast_func=lambda x: x):
    env_value = os.getenv(key.upper())
    if env_value is not None:
        logger.info(f"✔ Env override '{key}' set: {env_value}")
        return cast_func(env_value)

    if key in config_dict:
        logger.info(f"✔ Config '{key}' set: {config_dict[key]}")
        return cast_func(config_dict[key])

    logger.warning(f"⚠ '{key}' missing! Defaulted to: {default}")
    return cast_func(default)


def process_app_config():
    """Load and validate app_config.json with optional .env overrides."""

    if not os.path.exists(APP_CONFIG_PATH):
        logger.error(f"Config file missing: {APP_CONFIG_PATH}.")
        return

    with open(APP_CONFIG_PATH, "r") as app_config_file:
        app_config = json.load(app_config_file)

    validated_config = {}

    validated_config["app_mode"] = get_config_value(
        app_config, "app_mode", DEFAULT_CONFIG["app_mode"]
    )
    validated_config["db_type"] = get_config_value(
        app_config, "db_type", DEFAULT_CONFIG["db_type"]
    )
    validated_config["backend_port"] = get_config_value(
        app_config, "backend_port", DEFAULT_CONFIG["backend_port"], int
    )
    validated_config["backend_host"] = get_config_value(
        app_config, "backend_host", DEFAULT_CONFIG["backend_host"]
    )
    validated_config["sql_lite_db_url"] = get_config_value(
        app_config, "sql_lite_db_url", DEFAULT_CONFIG["sql_lite_db_url"]
    )

    # Optional: PostgreSQL config
    validated_config["postgres_url"] = get_config_value(
        app_config, "postgres_url", DEFAULT_CONFIG.get("postgres_url", "")
    )

    return validated_config

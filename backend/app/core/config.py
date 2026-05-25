from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str
    secret_key: str
    access_token_expire_minutes: int = 10080
    cors_origins: str = "http://localhost:3000"

    model_config = {"env_file": ".env"}


settings = Settings()

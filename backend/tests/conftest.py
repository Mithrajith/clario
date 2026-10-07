import os
import pytest

# Enforce isolated test environment so tests never write to live Neon PostgreSQL or Qdrant Cloud
os.environ["DATABASE_URL"] = "sqlite:///:memory:"
os.environ["ENVIRONMENT"] = "test"
os.environ["LLM_PROVIDER"] = "mock"


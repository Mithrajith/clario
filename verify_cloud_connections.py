#!/usr/bin/env python3
"""
Verify and validate Clario Cloud Databases:
1. Supabase PostgreSQL (Relational Data, Users, Documents, Conversations)
2. Qdrant Cloud Cluster (Vector Search, 384-dim Embeddings)
"""

import sys
import os
import uuid
import logging

# Ensure root and backend directories are in sys.path
root_dir = os.path.abspath(os.path.dirname(__file__))
backend_dir = os.path.join(root_dir, "backend") if os.path.exists(os.path.join(root_dir, "backend")) else os.path.abspath(os.path.join(root_dir, "../backend"))
project_root = root_dir if os.path.exists(os.path.join(root_dir, "backend")) else os.path.abspath(os.path.join(root_dir, ".."))

for p in [project_root, backend_dir]:
    if p not in sys.path:
        sys.path.insert(0, p)

# Load root .env
from dotenv import load_dotenv
env_path = os.path.join(project_root, ".env")
load_dotenv(env_path, override=True)

from sqlalchemy import text
from qdrant_client.http import models as qmodels

from app.core.config import settings
from app.core.database import engine, Base, SessionLocal
from app.services.vector_service import vector_service
from app.models.role import Role, ROLE_USER, ROLE_ADMIN, ROLE_ANALYST, SYSTEM_ROLES
from app.models.user import User

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("cloud_verifier")


def verify_postgresql() -> bool:
    print("\n" + "=" * 70)
    print("1. VERIFYING NEON POSTGRESQL CONNECTION & SCHEMA")
    print("=" * 70)
    print(f"DATABASE_URL (configured): {settings.DATABASE_URL.split('@')[-1]}")
    print(f"SQLAlchemy URL: {settings.sqlalchemy_database_url.split('@')[-1]}")

    try:
        # 1. Connection check
        with engine.connect() as conn:
            row = conn.execute(text("SELECT version(), current_database(), current_user;")).fetchone()
            print(f" [+] PostgreSQL Connected: {row[0]}")
            print(f" [+] Database: {row[1]} | User: {row[2]}")

        # 2. Create tables if they do not exist
        print(" [+] Ensuring all schema tables exist on Neon DB...")
        Base.metadata.create_all(bind=engine)
        print(" [+] Schema tables initialized successfully.")

        # 3. Seed initial system roles if missing
        with SessionLocal() as db:
            for role_name in SYSTEM_ROLES:
                role = db.query(Role).filter(Role.name == role_name).first()
                if not role:
                    role = Role(name=role_name, description=f"System role: {role_name}")
                    db.add(role)
            db.commit()
            print(" [+] System roles verified: [admin, analyst, user]")

            # Count tables/users
            user_count = db.query(User).count()
            print(f" [+] Current User count in Neon DB: {user_count}")

        print(" [SUCCESS] Neon PostgreSQL is fully operational and ready!")
        return True

    except Exception as e:
        logger.error(f" [FAILED] Neon PostgreSQL verification error: {e}", exc_info=True)
        return False


def verify_qdrant_cloud() -> bool:
    print("\n" + "=" * 70)
    print("2. VERIFYING QDRANT CLUSTER CONNECTION & COLLECTION")
    print("=" * 70)
    print(f"QDRANT_URL: {settings.QDRANT_URL}")
    print(f"QDRANT_COLLECTION_NAME: {settings.QDRANT_COLLECTION_NAME}")
    print(f"QDRANT_API_KEY Configured: {bool(settings.QDRANT_API_KEY)}")

    try:
        # 1. Connectivity check
        client = vector_service.get_client()
        collections_resp = client.get_collections()
        col_names = [c.name for c in collections_resp.collections]
        print(f" [+] Qdrant Cloud Connected! Existing collections: {col_names}")

        # 2. Collection provisioning
        vector_service.ensure_collection_exists(vector_size=settings.EMBEDDING_DIMENSION)
        col_info = client.get_collection(settings.QDRANT_COLLECTION_NAME)
        print(f" [+] Collection '{settings.QDRANT_COLLECTION_NAME}' status: {col_info.status}")
        print(f" [+] Vector size: {col_info.config.params.vectors.size} ({col_info.config.params.vectors.distance})")

        # 3. Test vector upsert & search
        test_id = str(uuid.uuid4())
        test_vector = [0.05] * settings.EMBEDDING_DIMENSION
        print(f" [+] Testing vector upsert with dummy point ID: {test_id}...")
        client.upsert(
            collection_name=settings.QDRANT_COLLECTION_NAME,
            points=[
                qmodels.PointStruct(
                    id=test_id,
                    vector=test_vector,
                    payload={"test": True, "source": "cloud_verifier"}
                )
            ]
        )

        # Search test
        if hasattr(client, "query_points"):
            search_res = client.query_points(
                collection_name=settings.QDRANT_COLLECTION_NAME,
                query=test_vector,
                limit=1
            ).points
        else:
            search_res = client.search(
                collection_name=settings.QDRANT_COLLECTION_NAME,
                query_vector=test_vector,
                limit=1
            )
        assert len(search_res) > 0, "Vector search returned no results!"
        top_point = search_res[0]
        score = getattr(top_point, "score", 1.0)
        point_id = getattr(top_point, "id", str(top_point))
        print(f" [+] Vector search verified: Found point {point_id} with score {score:.4f}")

        # Clean up test point
        client.delete(
            collection_name=settings.QDRANT_COLLECTION_NAME,
            points_selector=qmodels.PointIdsList(points=[test_id])
        )
        print(" [+] Cleaned up dummy test vector point.")

        print(" [SUCCESS] Qdrant Cloud Cluster is fully operational and ready!")
        return True

    except Exception as e:
        logger.error(f" [FAILED] Qdrant Cloud verification error: {e}", exc_info=True)
        return False


def main():
    print("======================================================================")
    print("      CLARIO ENTERPRISE KNOWLEDGE PLATFORM — CLOUD DB VERIFICATION")
    print("======================================================================")

    db_ok = verify_postgresql()
    qdrant_ok = verify_qdrant_cloud()

    print("\n" + "=" * 70)
    print("SUMMARY")
    print("=" * 70)
    print(f" 1. Neon PostgreSQL: {'[CONNECTED & READY]' if db_ok else '[FAILED]'}")
    print(f" 2. Qdrant Cloud Cluster: {'[CONNECTED & READY]' if qdrant_ok else '[FAILED]'}")
    print("=" * 70)

    if db_ok and qdrant_ok:
        print("\nALL CLOUD DATABASES ARE FULLY CONNECTED AND FUNCTIONAL!\n")
        sys.exit(0)
    else:
        print("\nONE OR MORE CLOUD DATABASES FAILED VERIFICATION!\n")
        sys.exit(1)


if __name__ == "__main__":
    main()

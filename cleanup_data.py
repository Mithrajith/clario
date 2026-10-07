#!/usr/bin/env python3
"""
Cleanup Script for Clario Enterprise Platform.
Deletes all data (PostgreSQL relational records, documents, chunks, conversations,
messages, audit logs, vector embeddings in Qdrant, physical storage files)
EXCEPT the designated user 'ksmithun@gamil.com' (and 'ksmithun@gmail.com').
"""

import os
import sys
import shutil
import logging

# Ensure paths are set
script_dir = os.path.dirname(os.path.abspath(__file__))
if script_dir not in sys.path:
    sys.path.insert(0, script_dir)

from backend.app.core.config import settings
from backend.app.core.database import SessionLocal, Base, engine
from backend.app.core.security import hash_password
from backend.app.models.user import User, user_roles
from backend.app.models.role import Role, ROLE_ADMIN, ROLE_ANALYST, ROLE_USER, SYSTEM_ROLES
from backend.app.models.document import Document
from backend.app.models.document_chunk import DocumentChunk
from backend.app.models.conversation import Conversation, Message
from backend.app.models.audit_log import AuditLog
from backend.app.services.vector_service import vector_service

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("data_cleanup")

TARGET_EMAIL = "ksmithun@gamil.com"
TARGET_ALT_EMAIL = "ksmithun@gmail.com"

def cleanup_all_data():
    logger.info("=" * 65)
    logger.info("STARTING COMPLETE DATA PURGE (PRESERVING %s)", TARGET_EMAIL)
    logger.info("=" * 65)

    with SessionLocal() as db:
        # 1. Ensure system roles exist
        logger.info("[1/6] Checking system roles...")
        role_map = {}
        for role_name in SYSTEM_ROLES:
            role = db.query(Role).filter(Role.name == role_name).first()
            if not role:
                role = Role(name=role_name, description=f"System role: {role_name}")
                db.add(role)
                db.flush()
            role_map[role_name] = role
        db.commit()

        # 2. Check or create target user
        logger.info("[2/6] Ensuring preserved user exists...")
        target_user = (
            db.query(User)
            .filter(
                (User.email == TARGET_EMAIL) | (User.email == TARGET_ALT_EMAIL)
            )
            .first()
        )

        if not target_user:
            logger.info("Target user %s not found in DB. Creating new Administrator account...", TARGET_EMAIL)
            target_user = User(
                email=TARGET_EMAIL,
                name="Mithun KS",
                password_hash=hash_password("ClarioAdmin2026!"),
                department="Security & IT",
                is_active=True,
                roles=[role_map[ROLE_ADMIN], role_map[ROLE_ANALYST], role_map[ROLE_USER]],
            )
            db.add(target_user)
            db.commit()
            db.refresh(target_user)
            logger.info("Created user: %s (ID: %s)", target_user.email, target_user.id)
        else:
            logger.info("Found existing target user: %s (ID: %s)", target_user.email, target_user.id)
            # Ensure user has admin role
            current_role_names = [r.name for r in target_user.roles]
            for rname in SYSTEM_ROLES:
                if rname not in current_role_names:
                    target_user.roles.backend.append(role_map[rname])
            target_user.is_active = True
            db.commit()
            db.refresh(target_user)

        preserved_user_ids = [target_user.id]

        # 3. Purge PostgreSQL tables
        logger.info("[3/6] Purging PostgreSQL relational data...")

        # A. Delete all DocumentChunks
        deleted_chunks = db.query(DocumentChunk).delete()
        logger.info(" -> Deleted %d document chunk records.", deleted_chunks)

        # B. Delete all Documents
        deleted_docs = db.query(Document).delete()
        logger.info(" -> Deleted %d document records.", deleted_docs)

        # C. Delete all Messages
        deleted_msgs = db.query(Message).delete()
        logger.info(" -> Deleted %d conversation message records.", deleted_msgs)

        # D. Delete all Conversations
        deleted_convs = db.query(Conversation).delete()
        logger.info(" -> Deleted %d conversation records.", deleted_convs)

        # E. Delete all Audit Logs
        deleted_audits = db.query(AuditLog).delete()
        logger.info(" -> Deleted %d audit log records.", deleted_audits)

        # F. Delete all other Users
        other_users = db.query(User).filter(~User.id.in_(preserved_user_ids)).all()
        other_user_count = len(other_users)
        for u in other_users:
            u.roles.clear()
            db.delete(u)
        logger.info(" -> Deleted %d other user accounts.", other_user_count)

        db.commit()

        # Verify DB counts
        remaining_users = db.query(User).all()
        logger.info("PostgreSQL verification: %d user(s) remaining in database:", len(remaining_users))
        for u in remaining_users:
            logger.info("   - User: %s | Roles: %s | Active: %s", u.email, [r.name for r in u.roles], u.is_active)

    # 4. Purge Qdrant Vector Points
    logger.info("[4/6] Purging Qdrant vector database points...")
    try:
        client = vector_service.get_client()
        col_name = settings.QDRANT_COLLECTION_NAME

        # Recreate collection cleanly
        logger.info(" -> Re-creating Qdrant collection '%s' with dimension %d...", col_name, settings.EMBEDDING_DIMENSION)
        try:
            client.delete_collection(collection_name=col_name)
            logger.info(" -> Deleted old Qdrant collection.")
        except Exception as col_err:
            logger.info(" -> Collection delete note: %s", col_err)

        vector_service.ensure_collection_exists(vector_size=settings.EMBEDDING_DIMENSION)
        col_info = client.get_collection(col_name)
        logger.info(" -> Qdrant collection status: %s | Points count: %d", col_info.status, col_info.points_count)
        logger.info(" [SUCCESS] Qdrant vectors completely purged.")
    except Exception as qdrant_err:
        logger.error("Failed to purge Qdrant vectors: %s", qdrant_err, exc_info=True)

    # 5. Clean Physical File Storage
    logger.info("[5/6] Purging local document storage directories...")
    storage_dirs = [
        os.path.join(script_dir, "storage", "documents"),
        os.path.join(script_dir, "..", "storage", "documents"),
        "/tmp/clario_uploads",
    ]

    for s_dir in storage_dirs:
        if os.path.exists(s_dir):
            for item in os.listdir(s_dir):
                item_path = os.path.join(s_dir, item)
                try:
                    if os.path.isdir(item_path):
                        shutil.rmtree(item_path)
                    else:
                        os.remove(item_path)
                    logger.info(" -> Removed storage item: %s", item_path)
                except Exception as file_err:
                    logger.warning("Could not delete %s: %s", item_path, file_err)

    # 6. Final Status
    logger.info("[6/6] VERIFICATION SUMMARY")
    logger.info("=" * 65)
    logger.info("All documents, chunks, vectors, conversations, messages,")
    logger.info("audit logs, and non-target users have been purged.")
    logger.info("Preserved Active User: %s", TARGET_EMAIL)
    logger.info("=" * 65)


if __name__ == "__main__":
    cleanup_all_data()


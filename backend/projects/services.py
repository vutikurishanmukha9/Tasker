import logging

from accounts.models import User

logger = logging.getLogger(__name__)


def add_team_member(project, user_id):
    """
    Add a user to a project's team.

    Validates that the user exists and is not already a member.
    Returns (success: bool, message: str).
    """
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return False, "User not found."

    if project.team_members.filter(id=user_id).exists():
        return False, f"{user.username} is already a team member."

    project.team_members.add(user)
    logger.info(
        "User %s added to project '%s' (id=%d)",
        user.email,
        project.name,
        project.id,
    )
    return True, f"{user.username} added to the project."


def remove_team_member(project, user_id):
    """
    Remove a user from a project's team.

    Auto-unassigns any tasks assigned to this user in the project
    before removing them from the team.
    Returns (success: bool, message: str).
    """
    if not project.team_members.filter(id=user_id).exists():
        return False, "User is not a member of this project."

    user = User.objects.get(id=user_id)

    # Auto-unassign tasks before removal
    unassigned_count = project.tasks.filter(assigned_to_id=user_id).update(
        assigned_to=None
    )

    if unassigned_count > 0:
        logger.info(
            "Auto-unassigned %d task(s) from user %s in project '%s'",
            unassigned_count,
            user.email,
            project.name,
        )

    project.team_members.remove(user)
    logger.info(
        "User %s removed from project '%s' (id=%d)",
        user.email,
        project.name,
        project.id,
    )

    message = f"{user.username} removed from the project."
    if unassigned_count > 0:
        message += f" {unassigned_count} task(s) were unassigned."

    return True, message

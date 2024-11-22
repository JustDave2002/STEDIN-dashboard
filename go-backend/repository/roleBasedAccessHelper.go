package repository

import (
	"fmt"
	"strings"
)

func applyRoleBasedAccess(meberID int64, baseQuery string) (string, error) {
	// Fetch roles for the user
	roles, err := GetRolesForMeber(meberID)
	if err != nil {
		return "", fmt.Errorf("failed to fetch roles for meber: %w", err)
	}

	// Check if any role has is_restricted set to false
	for _, role := range roles {
		if !role.IsRestricted {
			// No restrictions, so return the base query unchanged
			return baseQuery, nil
		}
	}

	// Fetch tags for the meber if all roles are restricted
	meberTags, err := GetMeberTags(meberID)
	if err != nil {
		return "", fmt.Errorf("failed to fetch tags for meber: %w", err)
	}

	// If no tags are found, restrict access to nothing
	if len(meberTags) == 0 {
		return baseQuery + " WHERE 1 = 0", nil // Always false condition
	}

	// Generate the WHERE clause based on the tags
	queryTags := "'" + strings.Join(meberTags, "','") + "'"
	accessClause := fmt.Sprintf("WHERE tg.name IN (%s) AND tg.type = 'location'", queryTags)

	// Append the RBAC access clause to the base query
	return baseQuery + " " + accessClause, nil
}
